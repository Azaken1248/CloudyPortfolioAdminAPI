import { Router, type Request, type Response } from 'express';
import { GlobalConfig, Artwork, CommissionTier, FaqItem, TosSection } from '../models/index.js';
import { NotFoundError } from '../utils/errors.js';

const router = Router();

router.get('/', async (_req: Request, res: Response) => {
  const [config, artworks, commissionTiers, faqItems, tosSections] = await Promise.all([
    GlobalConfig.findOne().lean(),
    Artwork.find().sort({ sortOrder: 1 }).lean(),
    CommissionTier.find().sort({ sortOrder: 1 }).lean(),
    FaqItem.find().sort({ sortOrder: 1 }).lean(),
    TosSection.find().sort({ sortOrder: 1 }).lean(),
  ]);

  if (!config) {
    throw new NotFoundError('GlobalConfig');
  }

  const portfolio = {
    ...config,
    artworks,
    commissionTiers,
    faqItems,
    tosSections,
  };

  res.json({ success: true, data: portfolio });
});

export { router as portfolioRouter };
