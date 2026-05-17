import { Router, type Request, type Response } from 'express';
import { GlobalConfig } from '../models/index.js';
import { requireAuth } from '../middleware/auth.js';
import { NotFoundError } from '../utils/errors.js';

const router = Router();

router.get('/', async (_req: Request, res: Response) => {
  const config = await GlobalConfig.findOne();

  if (!config) {
    throw new NotFoundError('GlobalConfig');
  }

  res.json({ success: true, data: config });
});

router.put('/', requireAuth, async (req: Request, res: Response) => {
  const config = await GlobalConfig.findOneAndUpdate(
    {},
    { $set: req.body },
    { returnDocument: 'after', upsert: true, runValidators: true },
  );

  res.json({ success: true, data: config });
});

export { router as configRouter };
