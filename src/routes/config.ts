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

/**
 * Flatten a patch to leaf paths so it updates fields rather than replacing
 * subdocuments.
 *
 * `{ $set: { siteConfig: { siteName: 'x' } } }` replaces `siteConfig` whole,
 * dropping every sibling. Flattening recursively matters because the schema
 * nests two deep — `contactContent.form.submitLabel`, `commissions.featured.tag`
 * — so stopping at one level still replaced `form` and `featured` wholesale.
 *
 * Arrays are set whole: sending a list means replacing it, not merging by index.
 * An empty object yields no paths, leaving that branch untouched.
 */
function toDotNotation(
  value: Record<string, unknown>,
  prefix = '',
  out: Record<string, unknown> = {},
): Record<string, unknown> {
  for (const [key, child] of Object.entries(value)) {
    const path = prefix ? `${prefix}.${key}` : key;
    const isPlainObject =
      child !== null && typeof child === 'object' && !Array.isArray(child);

    if (isPlainObject) {
      // An empty object expresses "no change to this branch". Emitting it as a
      // path would $set the branch to {} and wipe everything under it.
      toDotNotation(child as Record<string, unknown>, path, out);
    } else {
      out[path] = child;
    }
  }

  return out;
}

router.put('/', requireAuth, async (req: Request, res: Response) => {
  const body = (req.body ?? {}) as Record<string, unknown>;

  // An upsert cannot use dot-notation for a document that does not exist yet,
  // so the first write sets the object whole and later ones patch fields.
  const existing = await GlobalConfig.exists({});
  const update = existing ? toDotNotation(body) : body;

  const config = await GlobalConfig.findOneAndUpdate(
    {},
    { $set: update },
    { returnDocument: 'after', upsert: true, runValidators: true },
  );

  res.json({ success: true, data: config });
});

export { router as configRouter };
