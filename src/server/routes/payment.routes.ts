import type { Express } from 'express';
import { estimateMidtransFee, recordCostEvent } from '../services/costTracking.service';
import { getCoreClient, getSnapClient, resolveTransactionRequest } from '../services/payment.service';

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
      const order = await resolveTransactionRequest(req.body);
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
      console.error('Error generating midtrans token:', error);
      res.status(400).json({ error: error instanceof Error ? error.message : 'Failed to generate midtrans token.' });
    }
  });

  app.post('/api/verify-transaction', async (req, res) => {
    try {
      const { orderId } = req.body;
      if (typeof orderId !== 'string' || !orderId.trim()) {
        return res.status(400).json({ error: 'orderId is required.' });
      }

      const core = getCoreClient();
      const status = await core.transaction.status(orderId.trim());
      const transactionStatus = status.transaction_status;
      const fraudStatus = status.fraud_status;
      const isPaid =
        (transactionStatus === 'capture' && fraudStatus === 'accept') ||
        transactionStatus === 'settlement';
      const grossAmount = Math.max(0, Number(status.gross_amount || 0));

      if (isPaid && grossAmount > 0) {
        await recordCostEvent({
          referenceId: `midtrans-fee:${orderId.trim()}`,
          storyId: typeof (status as { custom_field2?: unknown }).custom_field2 === 'string'
            ? (status as { custom_field2: string }).custom_field2
            : undefined,
          eventType: 'payment_fee',
          provider: 'Midtrans',
          model: status.payment_type || undefined,
          amountIdr: estimateMidtransFee(grossAmount, status.payment_type || ''),
          metadata: { orderId: orderId.trim(), grossAmount, paymentType: status.payment_type || '' },
        });
      }

      res.json({
        orderId,
        isPaid,
        transactionStatus,
        fraudStatus,
        paymentType: status.payment_type,
        grossAmount,
      });
    } catch (error) {
      console.error('Error verifying midtrans transaction:', error);
      res.status(500).json({ error: 'Failed to verify transaction status.' });
    }
  });

  app.post('/api/midtrans-notification', async (req, res) => {
    try {
      const core = getCoreClient();
      const status = await core.transaction.notification(req.body);
      console.log('Midtrans notification:', {
        orderId: status.order_id,
        transactionStatus: status.transaction_status,
        fraudStatus: status.fraud_status,
      });
      res.json({ ok: true });
    } catch (error) {
      console.error('Error processing midtrans notification:', error);
      res.status(500).json({ error: 'Failed to process notification.' });
    }
  });
}

