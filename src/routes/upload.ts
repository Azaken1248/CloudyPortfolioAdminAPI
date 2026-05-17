import { Router, type Request, type Response } from 'express';
import sharp from 'sharp';
import { requireAuth } from '../middleware/auth.js';
import { upload } from '../middleware/upload.js';
import { cloudinary } from '../config/cloudinary.js';
import { ValidationError } from '../utils/errors.js';

const router = Router();

const MAX_WIDTH = 2000;
const WEBP_QUALITY = 85;
const UPLOAD_FOLDER = 'cloudy-portfolio';

router.post('/', requireAuth, upload.single('image'), async (req: Request, res: Response) => {
  if (!req.file) {
    throw new ValidationError('Image file is required');
  }

  const optimized = await sharp(req.file.buffer)
    .resize({ width: MAX_WIDTH, withoutEnlargement: true })
    .webp({ quality: WEBP_QUALITY })
    .toBuffer();

  const result = await new Promise<{ secure_url: string }>((resolve, reject) => {
    const stream = cloudinary.uploader.upload_stream(
      {
        folder: UPLOAD_FOLDER,
        format: 'webp',
        resource_type: 'image',
      },
      (error, result) => {
        if (error || !result) {
          reject(error ?? new Error('Cloudinary upload failed'));
        } else {
          resolve(result);
        }
      },
    );

    stream.end(optimized);
  });

  res.status(201).json({
    success: true,
    data: { url: result.secure_url },
  });
});

export { router as uploadRouter };
