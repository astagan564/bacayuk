import type { Express, Response } from 'express';
import { AuthenticationError, requireAuthenticatedUser } from '../middleware/userAuth';
import { isValidAdminPin } from '../middleware/adminAuth';
import { estimateMidtransFee, recordCostEvent } from '../services/costTracking.service';
import {
  createDanaQrisOrder,
  getDanaQrisOrderForUser,
  isDanaQrisEnabled,
  listDanaQrisOrdersForUser,
  toDanaOrderResponse,
} from '../services/danaQris.service';
import {
  approveManualPaymentOrder,
  createManualPaymentOrder,
  getManualPaymentInstructions,
  getManualPaymentOrderForUser,
  listManualPaymentOrdersForUser,
  listManualPaymentOrdersForAdmin,
  rejectManualPaymentOrder,
  retryManualPaymentWhatsAppNotification,
  submitManualPaymentProof,
  toManualOrderResponse,
} from '../services/manualPayment.service';
import {
  consumeDownloadEntitlement,
  finalizePaymentEntitlement,
  getMidtransAmountBreakdown,
  getCoreClient,
  getPaymentOrder,
  getPaymentOrderForUser,
  getSnapClient,
  isMidtransEnabled,
  listUserEntitlements,
  renewDownloadEntitlement,
  resolveTransactionRequest,
  savePendingPaymentOrder,
  type EntitlementRow,
} from '../services/payment.service';

function getAdminReviewerName() {
  return process.env.ADMIN_REVIEWER_NAME?.trim() || 'Admin BacaYuk';
}

function adminOrderToResponse(order: Awaited<ReturnType<typeof listManualPaymentOrdersForAdmin>>[number]) {
  return {
    orderId: order.order_id,
    purchaseType: order.purchase_type,
    storyId: order.story_id,
    storyTitle: order.story_title,
    amount: order.amount,
    discountAmount: order.discount_amount,
    customerName: order.customer_name,
    customerEmail: order.customer_email,
    status: order.status,
    paymentMethod: order.payment_method,
    expiresAt: order.expires_at,
    proofSubmittedAt: order.proof_submitted_at,
    proofUrl: order.proof_signed_url,
    payerNote: order.payer_note,
    reviewNote: order.review_note,
    reviewedAt: order.reviewed_at,
    reviewedBy: order.reviewed_by,
    paidAt: order.paid_at,
    whatsappNotificationStatus: order.whatsapp_notification_status,
    whatsappNotificationAttempts: order.whatsapp_notification_attempts,
    whatsappNotificationSentAt: order.whatsapp_notification_sent_at,
    whatsappNotificationError: order.whatsapp_notification_error,
    createdAt: order.created_at,
  };
}

function entitlementToReceipt(entitlement: EntitlementRow) {
  return {
    storyId: entitlement.story_id || 'vip_sub',
    storyTitle: entitlement.story_title,
    customerName: entitlement.customer_name,
    customerEmail: entitlement.customer_email,
    transactionId: entitlement.source_order_id,
    paymentMethod: entitlement.entitlement_type === 'vip' ? 'vip' : entitlement.payment_method,
    amount: entitlement.amount,
    purchasedAt: entitlement.created_at,
    downloadCount: entitlement.download_count,
    downloadLimit: entitlement.download_limit,
    tokenExpiresAt: entitlement.token_expires_at || entitlement.expires_at,
  };
}

function sendRouteError(res: Response, error: unknown) {
  if (error instanceof AuthenticationError) {
    return res.status(401).json({ error: error.message });
  }
  const message = error instanceof Error ? error.message : 'Permintaan tidak dapat diproses.';
  return res.status(400).json({ error: message });
}

async function recordMidtransCost(
  order: Awaited<ReturnType<typeof getPaymentOrder>>,
  grossAmount: number,
  paymentMethod: string,
) {
  const amount = getMidtransAmountBreakdown(order.amount, grossAmount);
  const estimatedProviderFee = estimateMidtransFee(order.amount, paymentMethod);
  const estimatedMerchantFee = Math.max(0, estimatedProviderFee - amount.customerFeeAmount);
  await recordCostEvent({
    referenceId: `midtrans-fee:${order.orderId}`,
    storyId: order.purchaseType === 'book' ? order.storyId : undefined,
    eventType: 'payment_fee',
    provider: 'Midtrans',
    model: paymentMethod || undefined,
    amountIdr: estimatedMerchantFee,
    metadata: {
      orderId: order.orderId,
      orderAmount: amount.orderAmount,
      grossAmount: amount.grossAmount,
      customerFeeAmount: amount.customerFeeAmount,
      estimatedProviderFee,
      paymentMethod,
    },
  });
}

export function registerPaymentRoutes(app: Express) {
  app.post('/api/verify-admin-pin', (req, res) => {
    const configuredPin = process.env.ADMIN_PIN || process.env.VITE_ADMIN_PIN;
    const submittedPin = typeof req.body?.pin === 'string' ? req.body.pin : '';

    if (!configuredPin) {
      return res.status(503).json({ error: 'ADMIN_PIN is not configured.' });
    }

    res.json({ ok: submittedPin === configuredPin });
  });

  app.post('/api/payment-quote', async (req, res) => {
    try {
      const user = await requireAuthenticatedUser(req);
      const order = await resolveTransactionRequest(req.body, user);
      res.json({
        amount: order.amount,
        discountAmount: order.discountAmount,
        couponCode: order.couponCode,
        storyId: order.storyId,
        storyTitle: order.storyTitle,
        purchaseType: order.purchaseType,
      });
    } catch (error) {
      if (!(error instanceof AuthenticationError)) console.error('Error generating payment quote:', error);
      sendRouteError(res, error);
    }
  });

  app.post('/api/manual-payment-orders', async (req, res) => {
    try {
      const user = await requireAuthenticatedUser(req);
      if (req.body?.paymentMethod === 'dana_qris' && isDanaQrisEnabled()) {
        const order = await createDanaQrisOrder(user, req.body || {});
        return res.status(201).json({ order: toDanaOrderResponse(order) });
      }
      const manualRequest = req.body?.paymentMethod === 'dana_qris'
        ? { ...(req.body || {}), paymentMethod: 'manual_qris' }
        : req.body || {};
      const { order, instructions } = await createManualPaymentOrder(user, manualRequest);
      res.status(201).json({ order: toManualOrderResponse(order, instructions) });
    } catch (error) {
      if (!(error instanceof AuthenticationError)) console.error('Error creating manual payment order:', error);
      sendRouteError(res, error);
    }
  });

  app.get('/api/manual-payment-orders', async (req, res) => {
    try {
      const user = await requireAuthenticatedUser(req);
      const [manualOrders, danaOrders] = await Promise.all([
        listManualPaymentOrdersForUser(user.id),
        listDanaQrisOrdersForUser(user.id),
      ]);
      const orders = [
        ...manualOrders.map((order) => toManualOrderResponse(
          order,
          getManualPaymentInstructions(order.purchase_type, order.amount, order.payment_method),
        )),
        ...danaOrders.map(toDanaOrderResponse),
      ]
        .sort((left, right) => Date.parse(right.createdAt) - Date.parse(left.createdAt))
        .slice(0, 20);
      res.json({ orders });
    } catch (error) {
      if (!(error instanceof AuthenticationError)) console.error('Error listing user payment orders:', error);
      sendRouteError(res, error);
    }
  });

  app.get('/api/manual-payment-orders/:orderId', async (req, res) => {
    try {
      const user = await requireAuthenticatedUser(req);
      if (req.params.orderId.startsWith('BY')) {
        const order = await getDanaQrisOrderForUser(req.params.orderId, user.id);
        return res.json({ order: toDanaOrderResponse(order) });
      }
      const order = await getManualPaymentOrderForUser(req.params.orderId, user.id);
      if (!order) return res.status(404).json({ error: 'Pesanan tidak ditemukan.' });
      const instructions = getManualPaymentInstructions(
        order.purchase_type,
        order.amount,
        order.payment_method,
      );
      res.json({ order: toManualOrderResponse(order, instructions) });
    } catch (error) {
      sendRouteError(res, error);
    }
  });

  app.post('/api/manual-payment-orders/:orderId/proof', async (req, res) => {
    try {
      const user = await requireAuthenticatedUser(req);
      const order = await submitManualPaymentProof({
        orderId: req.params.orderId,
        userId: user.id,
        dataUrl: req.body?.dataUrl,
        paymentMethod: req.body?.paymentMethod,
        payerNote: req.body?.payerNote,
      });
      res.json({ order: toManualOrderResponse(order) });
    } catch (error) {
      if (!(error instanceof AuthenticationError)) console.error('Error submitting payment proof:', error);
      sendRouteError(res, error);
    }
  });

  app.get('/api/admin/manual-payment-orders', async (req, res) => {
    if (!isValidAdminPin(req.headers['x-admin-pin'])) {
      return res.status(403).json({ error: 'PIN admin tidak valid.' });
    }
    try {
      const orders = await listManualPaymentOrdersForAdmin();
      res.json({ orders: orders.map(adminOrderToResponse) });
    } catch (error) {
      console.error('Error listing manual payment orders:', error);
      sendRouteError(res, error);
    }
  });

  app.post('/api/admin/manual-payment-orders/:orderId/approve', async (req, res) => {
    if (!isValidAdminPin(req.headers['x-admin-pin'])) {
      return res.status(403).json({ error: 'PIN admin tidak valid.' });
    }
    try {
      const entitlement = await approveManualPaymentOrder(
        req.params.orderId,
        getAdminReviewerName(),
        typeof req.body?.note === 'string' ? req.body.note : undefined,
      );
      res.json({ receipt: entitlementToReceipt(entitlement) });
    } catch (error) {
      console.error('Error approving manual payment:', error);
      sendRouteError(res, error);
    }
  });

  app.post('/api/admin/manual-payment-orders/:orderId/reject', async (req, res) => {
    if (!isValidAdminPin(req.headers['x-admin-pin'])) {
      return res.status(403).json({ error: 'PIN admin tidak valid.' });
    }
    try {
      const note = typeof req.body?.note === 'string' ? req.body.note : '';
      const order = await rejectManualPaymentOrder(req.params.orderId, getAdminReviewerName(), note);
      res.json({ order: adminOrderToResponse({ ...order, proof_signed_url: null }) });
    } catch (error) {
      console.error('Error rejecting manual payment:', error);
      sendRouteError(res, error);
    }
  });

  app.post('/api/admin/manual-payment-orders/:orderId/notify-whatsapp', async (req, res) => {
    if (!isValidAdminPin(req.headers['x-admin-pin'])) {
      return res.status(403).json({ error: 'PIN admin tidak valid.' });
    }
    try {
      const order = await retryManualPaymentWhatsAppNotification(req.params.orderId);
      res.json({ order: adminOrderToResponse({ ...order, proof_signed_url: null }) });
    } catch (error) {
      console.error('Error retrying WhatsApp payment notification:', error);
      sendRouteError(res, error);
    }
  });

  // Midtrans Snap Token endpoint
  app.post('/api/create-transaction', async (req, res) => {
    try {
      if (!isMidtransEnabled()) {
        return res.status(404).json({ error: 'Pembayaran Midtrans sedang dinonaktifkan.' });
      }
      const user = await requireAuthenticatedUser(req);
      const order = await resolveTransactionRequest(req.body, user);
      const snap = getSnapClient();
      const transactionId = `TRX-${Date.now()}-${Math.floor(1000 + Math.random() * 9000)}`;

      const parameter = {
        transaction_details: {
          order_id: transactionId,
          gross_amount: order.amount
        },
        credit_card: {
          secure: true
        },
        customer_details: {
          first_name: order.customerName,
          email: order.customerEmail
        },
        item_details: [{
          id: order.storyId,
          price: order.amount,
          quantity: 1,
          name: order.storyTitle
        }],
        custom_field1: order.purchaseType,
        custom_field2: order.storyId,
        custom_field3: order.couponCode || ''
      };

      const transaction = await snap.createTransaction(parameter);
      await savePendingPaymentOrder(transactionId, user.id, order);
      res.json({
        token: transaction.token,
        redirect_url: transaction.redirect_url,
        orderId: transactionId,
        amount: order.amount,
        discountAmount: order.discountAmount,
        couponCode: order.couponCode,
        storyId: order.storyId,
        storyTitle: order.storyTitle,
        purchaseType: order.purchaseType,
      });
    } catch (error) {
      if (!(error instanceof AuthenticationError)) console.error('Error generating midtrans token:', error);
      sendRouteError(res, error);
    }
  });

  app.post('/api/verify-transaction', async (req, res) => {
    try {
      if (!isMidtransEnabled()) {
        return res.status(404).json({ error: 'Pembayaran Midtrans sedang dinonaktifkan.' });
      }
      const user = await requireAuthenticatedUser(req);
      const { orderId } = req.body;
      if (typeof orderId !== 'string' || !orderId.trim()) {
        return res.status(400).json({ error: 'orderId is required.' });
      }

      const cleanOrderId = orderId.trim();
      const paymentOrder = await getPaymentOrderForUser(cleanOrderId, user.id);
      const core = getCoreClient();
      const status = await core.transaction.status(cleanOrderId);
      const transactionStatus = status.transaction_status;
      const fraudStatus = status.fraud_status;
      const isPaid =
        (transactionStatus === 'capture' && fraudStatus === 'accept') ||
        transactionStatus === 'settlement';
      const grossAmount = Math.max(0, Number(status.gross_amount || 0));
      if (!Number.isInteger(grossAmount) || grossAmount < paymentOrder.amount) {
        return res.status(409).json({ error: 'Nominal pembayaran kurang dari nilai order.', isPaid: false });
      }

      let entitlement: EntitlementRow | null = null;
      if (isPaid && grossAmount > 0) {
        entitlement = await finalizePaymentEntitlement(
          cleanOrderId,
          grossAmount,
          status.payment_type || 'midtrans',
        );
        await recordMidtransCost(paymentOrder, grossAmount, status.payment_type || 'midtrans');
      }

      res.json({
        orderId,
        isPaid,
        transactionStatus,
        fraudStatus,
        paymentType: status.payment_type,
        orderAmount: paymentOrder.amount,
        grossAmount,
        customerFeeAmount: Math.max(0, grossAmount - paymentOrder.amount),
        entitlement: entitlement ? entitlementToReceipt(entitlement) : null,
      });
    } catch (error) {
      if (!(error instanceof AuthenticationError)) console.error('Error verifying midtrans transaction:', error);
      sendRouteError(res, error);
    }
  });

  app.get('/api/entitlements', async (req, res) => {
    try {
      const user = await requireAuthenticatedUser(req);
      const entitlements = await listUserEntitlements(user.id);
      const activeVip = entitlements
        .filter((item) => item.entitlement_type === 'vip' && item.expires_at && new Date(item.expires_at) > new Date())
        .sort((a, b) => new Date(b.expires_at!).getTime() - new Date(a.expires_at!).getTime())[0];
      const latestBooks = new Map<string, EntitlementRow>();
      for (const entitlement of entitlements) {
        if (entitlement.entitlement_type === 'book' && entitlement.story_id && !latestBooks.has(entitlement.story_id)) {
          latestBooks.set(entitlement.story_id, entitlement);
        }
      }
      res.json({
        vipExpiresAt: activeVip?.expires_at || null,
        purchases: [...latestBooks.values()].map(entitlementToReceipt),
      });
    } catch (error) {
      sendRouteError(res, error);
    }
  });

  app.post('/api/consume-download', async (req, res) => {
    try {
      const user = await requireAuthenticatedUser(req);
      const storyId = typeof req.body?.storyId === 'string' ? req.body.storyId.trim() : '';
      if (!storyId) return res.status(400).json({ error: 'storyId is required.' });
      const entitlement = await consumeDownloadEntitlement(user.id, storyId);
      res.json({ receipt: entitlementToReceipt(entitlement) });
    } catch (error) {
      sendRouteError(res, error);
    }
  });

  app.post('/api/renew-download', async (req, res) => {
    try {
      const user = await requireAuthenticatedUser(req);
      const storyId = typeof req.body?.storyId === 'string' ? req.body.storyId.trim() : '';
      if (!storyId) return res.status(400).json({ error: 'storyId is required.' });
      const entitlement = await renewDownloadEntitlement(user.id, storyId);
      res.json({ receipt: entitlementToReceipt(entitlement) });
    } catch (error) {
      sendRouteError(res, error);
    }
  });

  app.post('/api/midtrans-notification', async (req, res) => {
    try {
      if (!isMidtransEnabled()) {
        return res.status(404).json({ error: 'Midtrans webhook dinonaktifkan.' });
      }
      const core = getCoreClient();
      const status = await core.transaction.notification(req.body);
      const transactionStatus = status.transaction_status;
      const fraudStatus = status.fraud_status;
      const isPaid =
        (transactionStatus === 'capture' && fraudStatus === 'accept')
        || transactionStatus === 'settlement';
      const grossAmount = Math.max(0, Number(status.gross_amount || 0));
      const orderId = status.order_id;
      if (isPaid && Number.isInteger(grossAmount) && grossAmount > 0 && orderId) {
        const paymentOrder = await getPaymentOrder(orderId);
        await finalizePaymentEntitlement(
          orderId,
          grossAmount,
          status.payment_type || 'midtrans',
        );
        await recordMidtransCost(paymentOrder, grossAmount, status.payment_type || 'midtrans');
      }
      console.log('Midtrans notification:', {
        orderId: status.order_id,
        transactionStatus,
        fraudStatus,
      });
      res.json({ ok: true });
    } catch (error) {
      console.error('Error processing midtrans notification:', error);
      res.status(500).json({ error: 'Failed to process notification.' });
    }
  });
}
