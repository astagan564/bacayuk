import type { Express, Response } from 'express';
import { AuthenticationError, requireAuthenticatedUser } from '../middleware/userAuth';
import { estimateMidtransFee, recordCostEvent } from '../services/costTracking.service';
import {
  consumeDownloadEntitlement,
  finalizePaymentEntitlement,
  getCoreClient,
  getPaymentOrderForUser,
  getSnapClient,
  listUserEntitlements,
  renewDownloadEntitlement,
  resolveTransactionRequest,
  savePendingPaymentOrder,
  type EntitlementRow,
} from '../services/payment.service';

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

export function registerPaymentRoutes(app: Express) {
  app.post('/api/verify-admin-pin', (req, res) => {
    const configuredPin = process.env.ADMIN_PIN || process.env.VITE_ADMIN_PIN;
    const submittedPin = typeof req.body?.pin === 'string' ? req.body.pin : '';

    if (!configuredPin) {
      return res.status(503).json({ error: 'ADMIN_PIN is not configured.' });
    }

    res.json({ ok: submittedPin === configuredPin });
  });

  // Midtrans Snap Token endpoint
  app.post('/api/create-transaction', async (req, res) => {
    try {
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
      if (!Number.isInteger(grossAmount) || grossAmount !== paymentOrder.amount) {
        return res.status(409).json({ error: 'Nominal pembayaran tidak sesuai dengan order.', isPaid: false });
      }

      let entitlement: EntitlementRow | null = null;
      if (isPaid && grossAmount > 0) {
        entitlement = await finalizePaymentEntitlement(
          cleanOrderId,
          grossAmount,
          status.payment_type || 'midtrans',
        );
        await recordCostEvent({
          referenceId: `midtrans-fee:${cleanOrderId}`,
          storyId: paymentOrder.purchaseType === 'book' ? paymentOrder.storyId : undefined,
          eventType: 'payment_fee',
          provider: 'Midtrans',
          model: status.payment_type || undefined,
          amountIdr: estimateMidtransFee(grossAmount, status.payment_type || ''),
          metadata: { orderId: cleanOrderId, grossAmount, paymentType: status.payment_type || '' },
        });
      }

      res.json({
        orderId,
        isPaid,
        transactionStatus,
        fraudStatus,
        paymentType: status.payment_type,
        grossAmount,
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
        await finalizePaymentEntitlement(
          orderId,
          grossAmount,
          status.payment_type || 'midtrans',
        );
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

