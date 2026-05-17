
import { describe, it, expect } from 'vitest';
import { CommissionTier } from '../../src/models/index.js';

describe('CommissionTier Model', () => {
  const validTier = {
    name: 'Bust Sketch',
    priceLabel: '$25-$40',
    detailTag: 'Sketch / Lineart',
    description: 'A clean bust-level sketch with optional flat colors.',
    sortOrder: 0,
  };

  it('should create a tier with all valid fields', async () => {
    const tier = await CommissionTier.create(validTier);

    expect(tier._id).toBeDefined();
    expect(tier.name).toBe(validTier.name);
    expect(tier.priceLabel).toBe(validTier.priceLabel);
    expect(tier.detailTag).toBe(validTier.detailTag);
    expect(tier.description).toBe(validTier.description);
    expect(tier.sortOrder).toBe(0);
  });

  it('should fail without name', async () => {
    const { name: _, ...noName } = validTier;
    await expect(CommissionTier.create(noName)).rejects.toThrow(/name/i);
  });

  it('should fail without priceLabel', async () => {
    const { priceLabel: _, ...noPrice } = validTier;
    await expect(CommissionTier.create(noPrice)).rejects.toThrow(/price/i);
  });

  it('should fail without detailTag', async () => {
    const { detailTag: _, ...noTag } = validTier;
    await expect(CommissionTier.create(noTag)).rejects.toThrow(/detail/i);
  });

  it('should fail without description', async () => {
    const { description: _, ...noDesc } = validTier;
    await expect(CommissionTier.create(noDesc)).rejects.toThrow(/description/i);
  });

  it('should fail when name exceeds 100 characters', async () => {
    const tier = { ...validTier, name: 'x'.repeat(101) };
    await expect(CommissionTier.create(tier)).rejects.toThrow(/100/);
  });

  it('should return tiers sorted by sortOrder', async () => {
    await CommissionTier.create([
      { ...validTier, name: 'C', sortOrder: 2 },
      { ...validTier, name: 'A', sortOrder: 0 },
      { ...validTier, name: 'B', sortOrder: 1 },
    ]);

    const tiers = await CommissionTier.find().sort({ sortOrder: 1 });

    expect(tiers).toHaveLength(3);
    expect(tiers[0].name).toBe('A');
    expect(tiers[1].name).toBe('B');
    expect(tiers[2].name).toBe('C');
  });
});
