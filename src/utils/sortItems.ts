import mongoose from 'mongoose';
import { ValidationError } from './errors.js';

export type SortItem = { id: string; sortOrder: number };

/**
 * Validate a `/sort` payload before it reaches `bulkWrite`.
 *
 * The handlers previously cast `req.body.items` straight to
 * `{ id: string; sortOrder: number }[]` and fed it into an `updateOne` filter.
 * TypeScript cannot enforce that at runtime, so a non-string `id` — an object
 * such as `{ "$ne": null }` — became part of a Mongo query rather than a value,
 * and a non-numeric `sortOrder` reached the `$set`. These routes are
 * admin-authenticated, so this is robustness rather than an open door, but the
 * shape should not be assumed.
 */
export function parseSortItems(body: unknown): SortItem[] {
  const items = (body as { items?: unknown } | null)?.items;

  if (!Array.isArray(items) || items.length === 0) {
    throw new ValidationError('Items array is required');
  }

  if (items.length > 500) {
    throw new ValidationError('Too many items in a single sort request (limit 500)');
  }

  return items.map((raw, index) => {
    if (typeof raw !== 'object' || raw === null) {
      throw new ValidationError(`Item at index ${index} must be an object`);
    }

    const { id, sortOrder } = raw as Record<string, unknown>;

    if (typeof id !== 'string' || !mongoose.isValidObjectId(id)) {
      throw new ValidationError(`Item at index ${index} has an invalid id`);
    }

    if (typeof sortOrder !== 'number' || !Number.isFinite(sortOrder)) {
      throw new ValidationError(`Item at index ${index} has a non-numeric sortOrder`);
    }

    return { id, sortOrder };
  });
}
