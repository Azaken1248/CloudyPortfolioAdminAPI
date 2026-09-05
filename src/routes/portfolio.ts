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

  /**
   * `.lean()` returns the raw document, so mongoose schema defaults are not
   * applied — a field added after a document was written is simply absent from
   * the response rather than coming back as its default.
   *
   * That is not a cosmetic difference. The admin merges its own defaults into
   * whatever this endpoint returns and calls the result "live state", so an
   * omitted field made the editor believe the server already held its default.
   * The diff then found nothing to publish, and the setting could never be
   * saved: the editor showed links the site did not have, and publishing was a
   * no-op.
   *
   * Fields with a schema default are filled explicitly here so the response
   * always describes the full shape.
   */
  const portfolio = {
    ...config,
    navLinks: config.navLinks ?? [],
    nav: config.nav ?? [],
    socials: config.socials ?? [],
    artworks,
    commissionTiers,
    faqItems,
    tosSections,
  };

  res.json({ success: true, data: portfolio });
});

export { router as portfolioRouter };
