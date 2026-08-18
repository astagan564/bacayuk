import express from 'express';
import path from 'path';
import { registerCatalogRoutes } from './routes/catalog.routes';
import { registerCoreStoryRoutes } from './routes/coreStory.routes';
import { registerDanaPaymentRoutes } from './routes/danaPayment.routes';
import { registerIllustrationRoutes } from './routes/illustration.routes';
import { registerManuscriptRoutes } from './routes/manuscript.routes';
import { registerPaymentRoutes } from './routes/payment.routes';
import { registerQuickStoryRoutes } from './routes/quickStory.routes';
import { registerStoryEnhancementRoutes } from './routes/storyEnhancement.routes';
import { registerTranslationRoutes } from './routes/translation.routes';
import { registerSettingsRoutes } from './routes/settings.routes';
import { registerAccountRoutes } from './routes/account.routes';
import { registerAdminUsersRoutes } from './routes/adminUsers.routes';
import { registerSeoMiddleware } from './middleware/seoMiddleware';

export async function createApp(options: { serveClient?: boolean } = {}) {
  const app = express();
  const serveClient = options.serveClient ?? true;
  const isProductionServer = process.env.NODE_ENV === 'production' || process.argv[1]?.endsWith('server.cjs');

  // Payment proofs are validated and capped at 1.5 MB after base64 decoding.
  app.use(express.json({ limit: '3mb' }));

  registerCatalogRoutes(app);
  registerQuickStoryRoutes(app);
  registerManuscriptRoutes(app);
  registerCoreStoryRoutes(app);
  registerStoryEnhancementRoutes(app);
  registerIllustrationRoutes(app);
  registerTranslationRoutes(app);
  registerDanaPaymentRoutes(app);
  registerPaymentRoutes(app);
  registerSettingsRoutes(app);
  registerAccountRoutes(app);
  registerAdminUsersRoutes(app);

  if (serveClient) {
    if (!isProductionServer) {
      const { createServer: createViteServer } = await import('vite');
      const vite = await createViteServer({
        server: { middlewareMode: true },
        appType: 'spa',
      });
      app.use(vite.middlewares);
    } else {
      const distPath = path.join(process.cwd(), 'dist');
      app.use(express.static(distPath));
      registerSeoMiddleware(app, distPath);
      app.get('*', (_req, res) => {
        res.sendFile(path.join(distPath, 'index.html'));
      });
    }
  }

  return app;
}
