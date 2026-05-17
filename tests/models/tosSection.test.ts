import { describe, it, expect } from 'vitest';
import { TosSection } from '../../src/models/index.js';

describe('TosSection Model', () => {
  const validTos = {
    heading: 'General Terms',
    variant: 'default' as const,
    points: [
      'Commissioning me means you have read and accepted the TOS.',
      'I have the right to decline any commission.',
    ],
    sortOrder: 0,
  };

  it('should create a TOS section with all valid fields', async () => {
    const tos = await TosSection.create(validTos);

    expect(tos._id).toBeDefined();
    expect(tos.heading).toBe(validTos.heading);
    expect(tos.variant).toBe('default');
    expect(tos.points).toHaveLength(2);
    expect(tos.sortOrder).toBe(0);
  });

  it('should accept "prohibited" variant', async () => {
    const tos = await TosSection.create({ ...validTos, variant: 'prohibited' as const });
    expect(tos.variant).toBe('prohibited');
  });

  it('should accept "info" variant', async () => {
    const tos = await TosSection.create({ ...validTos, variant: 'info' as const });
    expect(tos.variant).toBe('info');
  });

  it('should default variant to "default"', async () => {
    const { variant: _, ...noVariant } = validTos;
    const tos = await TosSection.create(noVariant);
    expect(tos.variant).toBe('default');
  });

  it('should fail without heading', async () => {
    const { heading: _, ...noHeading } = validTos;
    await expect(TosSection.create(noHeading)).rejects.toThrow(/heading/i);
  });

  it('should fail with empty points array', async () => {
    const tos = { ...validTos, points: [] };
    await expect(TosSection.create(tos)).rejects.toThrow(/point/i);
  });

  it('should fail with invalid variant', async () => {
    const tos = { ...validTos, variant: 'invalid' as any };
    await expect(TosSection.create(tos)).rejects.toThrow(/variant/i);
  });

  it('should fail when heading exceeds 200 characters', async () => {
    const tos = { ...validTos, heading: 'x'.repeat(201) };
    await expect(TosSection.create(tos)).rejects.toThrow(/200/);
  });

  it('should return sections sorted by sortOrder', async () => {
    await TosSection.create([
      { ...validTos, heading: 'C', sortOrder: 2 },
      { ...validTos, heading: 'A', sortOrder: 0 },
      { ...validTos, heading: 'B', sortOrder: 1 },
    ]);

    const sections = await TosSection.find().sort({ sortOrder: 1 });

    expect(sections).toHaveLength(3);
    expect(sections[0].heading).toBe('A');
    expect(sections[1].heading).toBe('B');
    expect(sections[2].heading).toBe('C');
  });
});