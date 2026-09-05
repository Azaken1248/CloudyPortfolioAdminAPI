import { Router, type Request, type Response } from 'express';
import { FaqItem } from '../models/index.js';
import { requireAuth } from '../middleware/auth.js';
import { NotFoundError } from '../utils/errors.js';
import { parseSortItems } from '../utils/sortItems.js';

const router = Router();

router.get('/', async (_req: Request, res: Response) => {
  const faqs = await FaqItem.find().sort({ sortOrder: 1 });
  res.json({ success: true, data: faqs });
});

router.post('/', requireAuth, async (req: Request, res: Response) => {
  const faq = await FaqItem.create(req.body);
  res.status(201).json({ success: true, data: faq });
});

router.put('/sort', requireAuth, async (req: Request, res: Response) => {
  const items = parseSortItems(req.body);

  const operations = items.map(({ id, sortOrder }) => ({
    updateOne: {
      filter: { _id: id },
      update: { $set: { sortOrder } },
    },
  }));

  await FaqItem.bulkWrite(operations);
  const faqs = await FaqItem.find().sort({ sortOrder: 1 });
  res.json({ success: true, data: faqs });
});

router.put('/:id', requireAuth, async (req: Request, res: Response) => {
  const faq = await FaqItem.findByIdAndUpdate(
    req.params.id,
    { $set: req.body },
    { returnDocument: 'after', runValidators: true },
  );

  if (!faq) {
    throw new NotFoundError('FaqItem');
  }

  res.json({ success: true, data: faq });
});

router.delete('/:id', requireAuth, async (req: Request, res: Response) => {
  const faq = await FaqItem.findByIdAndDelete(req.params.id);

  if (!faq) {
    throw new NotFoundError('FaqItem');
  }

  res.json({ success: true, data: { message: 'FAQ deleted' } });
});

export { router as faqsRouter };
