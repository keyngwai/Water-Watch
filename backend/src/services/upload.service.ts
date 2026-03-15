import multer from 'multer';
import sharp from 'sharp';
import path from 'path';
import fs from 'fs/promises';
import { v4 as uuidv4 } from 'uuid';
import { query, queryOne } from '../config/database';
import { AppError } from '../middlewares/error.middleware';
import { logger } from '../utils/logger';

// ---------------------------------------------------------------------------
// Multer config: Store files in memory so we can process with Sharp
// before persisting to storage. Max 10 images per report, 10MB each.
// ---------------------------------------------------------------------------

const ALLOWED_MIME_TYPES = ['image/jpeg', 'image/png', 'image/webp'];
const MAX_FILE_SIZE = parseInt(process.env.MAX_FILE_SIZE_MB || '10') * 1024 * 1024;
const MAX_FILES = 5;

export const uploadMiddleware = multer({
  storage: multer.memoryStorage(),
  limits: {
    fileSize: MAX_FILE_SIZE,
    files: MAX_FILES,
  },
  fileFilter: (_req, file, cb) => {
    if (ALLOWED_MIME_TYPES.includes(file.mimetype)) {
      cb(null, true);
    } else {
      cb(new AppError(`Unsupported file type: ${file.mimetype}. Use JPEG, PNG, or WebP.`, 415));
    }
  },
});

// ---------------------------------------------------------------------------
// processAndStoreImage: Resizes, strips EXIF metadata (privacy), and saves.
// In production, replace local storage with Supabase Storage or S3.
// ---------------------------------------------------------------------------

interface StoredImage {
  storage_key: string;
  public_url: string;
  filename: string;
  file_size: number;
  mime_type: string;
  width: number;
  height: number;
}

async function processAndStoreImage(
  buffer: Buffer,
  originalName: string
): Promise<StoredImage> {
  const id = uuidv4();
  const ext = '.webp'; // Normalize all images to WebP for consistency
  const filename = `${id}${ext}`;

  // Strip EXIF data (removes GPS coordinates from photos — privacy)
  const processed = await sharp(buffer)
    .rotate()                          // Auto-orient from EXIF rotation
    .resize(1920, 1080, {              // Cap resolution
      fit: 'inside',
      withoutEnlargement: true,
    })
    .webp({ quality: 82 })            // Good balance of quality vs file size
    .withMetadata({ exif: {} })       // Strip all EXIF (privacy)
    .toBuffer({ resolveWithObject: true });

  const storageProvider = process.env.STORAGE_PROVIDER || 'local';

  if (storageProvider === 'supabase_storage') {
    return await uploadToSupabase(processed.data, filename, processed.info);
  }

  // Local storage fallback
  return await saveLocally(processed.data, filename, processed.info, originalName);
}

async function saveLocally(
  buffer: Buffer,
  filename: string,
  info: sharp.OutputInfo,
  originalName: string
): Promise<StoredImage> {
  const uploadDir = process.env.LOCAL_UPLOAD_PATH || './uploads';
  await fs.mkdir(uploadDir, { recursive: true });

  const filePath = path.join(uploadDir, filename);
  await fs.writeFile(filePath, buffer);

  const baseUrl = process.env.API_BASE_URL || 'http://localhost:3000';

  return {
    storage_key: `local:${filename}`,
    public_url: `${baseUrl}/uploads/${filename}`,
    filename: originalName,
    file_size: buffer.length,
    mime_type: 'image/webp',
    width: info.width,
    height: info.height,
  };
}

async function uploadToSupabase(
  buffer: Buffer,
  filename: string,
  info: sharp.OutputInfo
): Promise<StoredImage> {
  // Supabase Storage upload via REST API
  const supabaseUrl = process.env.SUPABASE_URL!;
  const serviceKey = process.env.SUPABASE_SERVICE_KEY!;
  const bucket = process.env.SUPABASE_STORAGE_BUCKET || 'report-images';
  const storagePath = `reports/${filename}`;

  const response = await fetch(
    `${supabaseUrl}/storage/v1/object/${bucket}/${storagePath}`,
    {
      method: 'POST',
      headers: {
        'Authorization': `Bearer ${serviceKey}`,
        'Content-Type': 'image/webp',
        'x-upsert': 'false',
      },
      body: buffer,
    }
  );

  if (!response.ok) {
    const err = await response.text();
    logger.error('Supabase upload failed', { error: err });
    throw new AppError('Image upload failed. Please try again.', 502);
  }

  const publicUrl = `${supabaseUrl}/storage/v1/object/public/${bucket}/${storagePath}`;

  return {
    storage_key: `supabase:${bucket}/${storagePath}`,
    public_url: publicUrl,
    filename,
    file_size: buffer.length,
    mime_type: 'image/webp',
    width: info.width,
    height: info.height,
  };
}

// ---------------------------------------------------------------------------
// saveReportImages: Processes all uploaded files and saves to DB.
// Returns the stored image records.
// ---------------------------------------------------------------------------
export async function saveReportImages(
  reportId: string,
  files: Express.Multer.File[]
): Promise<Record<string, unknown>[]> {
  if (!files || files.length === 0) return [];

  const results: Record<string, unknown>[] = [];

  for (let i = 0; i < files.length; i++) {
    const file = files[i];
    try {
      const stored = await processAndStoreImage(file.buffer, file.originalname);

      const row = await queryOne<Record<string, unknown>>(`
        INSERT INTO report_images (report_id, storage_key, public_url, filename, file_size, mime_type, width, height, is_primary)
        VALUES ($1, $2, $3, $4, $5, $6, $7, $8, $9)
        RETURNING id, public_url, filename, is_primary
      `, [
        reportId, stored.storage_key, stored.public_url,
        stored.filename, stored.file_size, stored.mime_type,
        stored.width, stored.height, i === 0,  // First image is primary
      ]);

      if (row) results.push(row);
    } catch (err) {
      logger.error('Failed to process image', { filename: file.originalname, error: (err as Error).message });
      // Non-fatal: continue processing remaining images
    }
  }

  return results;
}

// ---------------------------------------------------------------------------
// deleteReportImage: Removes from storage and DB
// ---------------------------------------------------------------------------
export async function deleteReportImage(imageId: string, reportId: string): Promise<void> {
  const image = await queryOne<{ storage_key: string }>(
    'SELECT storage_key FROM report_images WHERE id = $1 AND report_id = $2',
    [imageId, reportId]
  );

  if (!image) throw new AppError('Image not found.', 404);

  await query('DELETE FROM report_images WHERE id = $1', [imageId]);

  // Clean up from storage (non-fatal if it fails)
  try {
    if (image.storage_key.startsWith('local:')) {
      const filename = image.storage_key.replace('local:', '');
      const filePath = path.join(process.env.LOCAL_UPLOAD_PATH || './uploads', filename);
      await fs.unlink(filePath);
    }
    // Supabase cleanup would go here
  } catch (err) {
    logger.warn('Failed to delete file from storage', { storage_key: image.storage_key });
  }
}
