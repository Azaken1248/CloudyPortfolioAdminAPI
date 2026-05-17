
import { describe, it, expect } from 'vitest';
import { FaqItem } from '../../src/models/index.js';

describe('FaqItem Model', () => {
  const validFaq = {
    question: 'How do I commission you?',
    answer: 'Reach out through the contact form or message me on Discord.',
    sortOrder: 0,
  };

  it('should create a FAQ with all valid fields', async () => {
    const faq = await FaqItem.create(validFaq);

    expect(faq._id).toBeDefined();
    expect(faq.question).toBe(validFaq.question);
    expect(faq.answer).toBe(validFaq.answer);
    expect(faq.sortOrder).toBe(0);
  });

  it('should fail without question', async () => {
    const { question: _, ...noQuestion } = validFaq;
    await expect(FaqItem.create(noQuestion)).rejects.toThrow(/question/i);
  });

  it('should fail without answer', async () => {
    const { answer: _, ...noAnswer } = validFaq;
    await expect(FaqItem.create(noAnswer)).rejects.toThrow(/answer/i);
  });

  it('should fail when question exceeds 500 characters', async () => {
    const faq = { ...validFaq, question: 'x'.repeat(501) };
    await expect(FaqItem.create(faq)).rejects.toThrow(/500/);
  });

  it('should fail when answer exceeds 2000 characters', async () => {
    const faq = { ...validFaq, answer: 'x'.repeat(2001) };
    await expect(FaqItem.create(faq)).rejects.toThrow(/2000/);
  });

  it('should default sortOrder to 0', async () => {
    const { sortOrder: _, ...noSort } = validFaq;
    const faq = await FaqItem.create(noSort);
    expect(faq.sortOrder).toBe(0);
  });

  it('should return FAQs sorted by sortOrder', async () => {
    await FaqItem.create([
      { ...validFaq, question: 'Third?', sortOrder: 2 },
      { ...validFaq, question: 'First?', sortOrder: 0 },
      { ...validFaq, question: 'Second?', sortOrder: 1 },
    ]);

    const faqs = await FaqItem.find().sort({ sortOrder: 1 });

    expect(faqs).toHaveLength(3);
    expect(faqs[0].question).toBe('First?');
    expect(faqs[1].question).toBe('Second?');
    expect(faqs[2].question).toBe('Third?');
  });
});
