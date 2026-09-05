import { Router, type Request, type Response } from 'express';
import { Artwork } from '../models/index.js';
import { requireAuth } from '../middleware/auth.js';
import { NotFoundError } from '../utils/errors.js';
import { parseSortItems } from '../utils/sortItems.js';

const router = Router();

router.get('/', async (_req: Request, res: Response) => {
  const artworks = await Artwork.find().sort({ sortOrder: 1 });
  res.json({ success: true, data: artworks });
});

router.get('/:id', async (req: Request, res: Response) => {
  const artwork = await Artwork.findById(req.params.id);

  if (!artwork) {
    throw new NotFoundError('Artwork');
  }

  res.json({ success: true, data: artwork });
});

router.post('/', requireAuth, async (req: Request, res: Response) => {
  const artwork = await Artwork.create(req.body);
  res.status(201).json({ success: true, data: artwork });
});

router.put('/sort', requireAuth, async (req: Request, res: Response) => {
  const items = parseSortItems(req.body);

  const operations = items.map(({ id, sortOrder }) => ({
    updateOne: {
      filter: { _id: id },
      update: { $set: { sortOrder } },
    },
  }));

  await Artwork.bulkWrite(operations);
  const artworks = await Artwork.find().sort({ sortOrder: 1 });
  res.json({ success: true, data: artworks });
});

router.put('/:id', requireAuth, async (req: Request, res: Response) => {
  const artwork = await Artwork.findByIdAndUpdate(
    req.params.id,
    { $set: req.body },
    { returnDocument: 'after', runValidators: true },
  );

  if (!artwork) {
    throw new NotFoundError('Artwork');
  }

  res.json({ success: true, data: artwork });
});

router.delete('/:id', requireAuth, async (req: Request, res: Response) => {
  const artwork = await Artwork.findByIdAndDelete(req.params.id);

  if (!artwork) {
    throw new NotFoundError('Artwork');
  }

  res.json({ success: true, data: { message: 'Artwork deleted' } });
});

export { router as artworksRouter };
