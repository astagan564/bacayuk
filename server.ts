import 'dotenv/config';
import { createApp } from './src/server/app';

export { createApp };

async function startServer() {
  const port = 3000;
  const app = await createApp();

  app.listen(port, '0.0.0.0', () => {
    console.log(`Server running on http://0.0.0.0:${port}`);
  });
}

if (!process.env.VERCEL) {
  startServer();
}
