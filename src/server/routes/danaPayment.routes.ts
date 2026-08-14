import type { Express, Request } from 'express';
import {
  DanaCallbackError,
  getDanaEnvironment,
  getDanaNotifyPath,
  isDanaCallbackConfigured,
  isDanaQrisConfigured,
  processDanaFinishNotify,
  type DanaFinishNotifyBody,
} from '../services/danaQris.service';

function header(req: Request, name: string) {
  return req.get(name)?.trim() || '';
}

function danaTimestamp() {
  return new Date(Date.now() + 7 * 60 * 60 * 1000)
    .toISOString()
    .replace('Z', '+07:00');
}

export function registerDanaPaymentRoutes(app: Express) {
  app.get(getDanaNotifyPath(), (_req, res) => {
    res.json({
      ok: true,
      provider: 'DANA QRIS Acquirer',
      environment: getDanaEnvironment(),
      callbackPath: getDanaNotifyPath(),
      signatureVerificationConfigured: isDanaCallbackConfigured(),
      qrisGenerationConfigured: isDanaQrisConfigured(),
    });
  });

  app.post(getDanaNotifyPath(), async (req, res) => {
    res.setHeader('X-TIMESTAMP', danaTimestamp());
    try {
      await processDanaFinishNotify({
        body: (req.body || {}) as DanaFinishNotifyBody,
        timestamp: header(req, 'X-TIMESTAMP'),
        signature: header(req, 'X-SIGNATURE'),
        partnerId: header(req, 'X-PARTNER-ID'),
        externalId: header(req, 'X-EXTERNAL-ID'),
      });
      return res.json({ responseCode: '2005600', responseMessage: 'Successful' });
    } catch (error) {
      if (error instanceof DanaCallbackError) {
        return res.status(error.statusCode).json({
          responseCode: error.responseCode,
          responseMessage: error.message,
        });
      }
      console.error('DANA Finish Notify failed:', error instanceof Error ? error.message : error);
      return res.status(500).json({
        responseCode: '5005601',
        responseMessage: 'Internal Server Error',
      });
    }
  });
}
