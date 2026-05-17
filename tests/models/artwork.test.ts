
import { describe, it, expect } from 'vitest';
import { Artwork } from '../../src/models/index.js';

describe('Artwork Model', () => {
  const validArtwork = {
    title: 'Fischl Fan Art',
    category: 'Fan Art',
    description: 'A detailed fan art illustration.',
    imageUrl: 'https://res.cloudinary.com/test/image/upload/fischl.webp',
    altText: 'Fischl fan art illustration',
    sortOrder: 0,
  };
  it('should create an artwork with all valid fields', async () => {
    const artwork = await Artwork.create(validArtwork);

    expect(artwork._id).toBeDefined();
    expect(artwork.title).toBe(validArtwork.title);
    expect(artwork.category).toBe(validArtwork.category);
    expect(artwork.description).toBe(validArtwork.description);
    expect(artwork.imageUrl).toBe(validArtwork.imageUrl);
    expect(artwork.altText).toBe(validArtwork.altText);
    expect(artwork.sortOrder).toBe(0);
    expect(artwork.createdAt).toBeInstanceOf(Date);
    expect(artwork.updatedAt).toBeInstanceOf(Date);
  });

  it('should default sortOrder to 0 when not provided', async () => {
    const { sortOrder: _, ...withoutSort } = validArtwork;
    const artwork = await Artwork.create(withoutSort);

    expect(artwork.sortOrder).toBe(0);
  });
  it('should fail without title', async () => {
    const { title: _, ...noTitle } = validArtwork;

    await expect(Artwork.create(noTitle)).rejects.toThrow(/title/i);
  });

  it('should fail without category', async () => {
    const { category: _, ...noCategory } = validArtwork;

    await expect(Artwork.create(noCategory)).rejects.toThrow(/category/i);
  });

  it('should fail without description', async () => {
    const { description: _, ...noDescription } = validArtwork;

    await expect(Artwork.create(noDescription)).rejects.toThrow(/description/i);
  });

  it('should fail without imageUrl', async () => {
    const { imageUrl: _, ...noImage } = validArtwork;

    await expect(Artwork.create(noImage)).rejects.toThrow(/image/i);
  });

  it('should fail without altText', async () => {
    const { altText: _, ...noAlt } = validArtwork;

    await expect(Artwork.create(noAlt)).rejects.toThrow(/alt/i);
  });
  it('should fail when title exceeds 200 characters', async () => {
    const artwork = { ...validArtwork, title: 'x'.repeat(201) };

    await expect(Artwork.create(artwork)).rejects.toThrow(/200/);
  });

  it('should fail when description exceeds 1000 characters', async () => {
    const artwork = { ...validArtwork, description: 'x'.repeat(1001) };

    await expect(Artwork.create(artwork)).rejects.toThrow(/1000/);
  });
  it('should return artworks sorted by sortOrder', async () => {
    await Artwork.create([
      { ...validArtwork, title: 'Third', sortOrder: 2 },
      { ...validArtwork, title: 'First', sortOrder: 0 },
      { ...validArtwork, title: 'Second', sortOrder: 1 },
    ]);

    const artworks = await Artwork.find().sort({ sortOrder: 1 });

    expect(artworks).toHaveLength(3);
    expect(artworks[0].title).toBe('First');
    expect(artworks[1].title).toBe('Second');
    expect(artworks[2].title).toBe('Third');
  });
  it('should update an artwork and change updatedAt', async () => {
    const artwork = await Artwork.create(validArtwork);
    const originalUpdatedAt = artwork.updatedAt;

    await new Promise((r) => setTimeout(r, 50));

    artwork.title = 'Updated Title';
    await artwork.save();

    expect(artwork.title).toBe('Updated Title');
    expect(artwork.updatedAt.getTime()).toBeGreaterThanOrEqual(originalUpdatedAt.getTime());
  });
  it('should delete an artwork by id', async () => {
    const artwork = await Artwork.create(validArtwork);
    await Artwork.findByIdAndDelete(artwork._id);

    const found = await Artwork.findById(artwork._id);
    expect(found).toBeNull();
  });
});
