import { Router, type Request, type Response } from 'express';
import { CommissionTier } from '../models/index.js';
import { requireAuth } from '../middleware/auth.js';
import { NotFoundError, ValidationError } from '../utils/errors.js';

const router = Router();

router.get('/', async (_req: Request, res: Response) => {
  const tiers = await CommissionTier.find().sort({ sortOrder: 1 });
  res.json({ success: true, data: tiers });
});

router.post('/', requireAuth, async (req: Request, res: Response) => {
  const tier = await CommissionTier.create(req.body);
  res.status(201).json({ success: true, data: tier });
});

router.put('/sort', requireAuth, async (req: Request, res: Response) => {
  const { items } = req.body as { items: { id: string; sortOrder: number }[] };

  if (!Array.isArray(items) || items.length === 0) {
    throw new ValidationError('Items array is required');
  }

  const operations = items.map(({ id, sortOrder }) => ({
    updateOne: {
      filter: { _id: id },
      update: { $set: { sortOrder } },
    },
  }));

  await CommissionTier.bulkWrite(operations);
  const tiers = await CommissionTier.find().sort({ sortOrder: 1 });
  res.json({ success: true, data: tiers });
});

router.put('/:id', requireAuth, async (req: Request, res: Response) => {
  const tier = await CommissionTier.findByIdAndUpdate(
    req.params.id,
    { $set: req.body },
    { returnDocument: 'after', runValidators: true },
  );

  if (!tier) {
    throw new NotFoundError('CommissionTier');
  }

  res.json({ success: true, data: tier });
});

router.delete('/:id', requireAuth, async (req: Request, res: Response) => {
  const tier = await CommissionTier.findByIdAndDelete(req.params.id);

  if (!tier) {
    throw new NotFoundError('CommissionTier');
  }

  res.json({ success: true, data: { message: 'Commission tier deleted' } });
});

export { router as commissionsRouter };
