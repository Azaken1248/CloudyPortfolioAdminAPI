import { Router, type Request, type Response } from 'express';
import { TosSection } from '../models/index.js';
import { requireAuth } from '../middleware/auth.js';
import { NotFoundError, ValidationError } from '../utils/errors.js';

const router = Router();

router.get('/', async (_req: Request, res: Response) => {
  const sections = await TosSection.find().sort({ sortOrder: 1 });
  res.json({ success: true, data: sections });
});

router.post('/', requireAuth, async (req: Request, res: Response) => {
  const section = await TosSection.create(req.body);
  res.status(201).json({ success: true, data: section });
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

  await TosSection.bulkWrite(operations);
  const sections = await TosSection.find().sort({ sortOrder: 1 });
  res.json({ success: true, data: sections });
});

router.put('/:id', requireAuth, async (req: Request, res: Response) => {
  const section = await TosSection.findByIdAndUpdate(
    req.params.id,
    { $set: req.body },
    { returnDocument: 'after', runValidators: true },
  );

  if (!section) {
    throw new NotFoundError('TosSection');
  }

  res.json({ success: true, data: section });
});

router.delete('/:id', requireAuth, async (req: Request, res: Response) => {
  const section = await TosSection.findByIdAndDelete(req.params.id);

  if (!section) {
    throw new NotFoundError('TosSection');
  }

  res.json({ success: true, data: { message: 'TOS section deleted' } });
});

export { router as tosRouter };
