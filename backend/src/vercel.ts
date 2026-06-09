import { app, initDb } from './app';

let dbReady: Promise<void> | null = null;

export default async function handler(req: any, res: any) {
  if (!dbReady) {
    dbReady = initDb().catch((err) => {
      console.error('DB init error:', err);
      dbReady = null;
      throw err;
    });
  }
  await dbReady;
  app(req, res);
}
