import { createApp } from '../server.js';

const appPromise = createApp({ serveClient: true });

export default async function handler(req: any, res: any) {
  const app = await appPromise;
  return app(req, res);
}
