import fs from 'fs';
import path from 'path';
import crypto from 'crypto';
import { AppError } from '../middleware/error.middleware';

// Define base upload directory for medical documents outside public routes
export const DOCUMENTS_UPLOAD_DIR = path.resolve(process.cwd(), 'uploads', 'documents');

// Ensure base upload directory exists synchronously on startup
if (!fs.existsSync(DOCUMENTS_UPLOAD_DIR)) {
  fs.mkdirSync(DOCUMENTS_UPLOAD_DIR, { recursive: true });
}

// Allowed MIME types and mapping to standard safe extensions
export const ALLOWED_MIME_TYPES: Record<string, string> = {
  'application/pdf': '.pdf',
  'image/jpeg': '.jpg',
  'image/jpg': '.jpg',
  'image/png': '.png',
};

// Maximum file size: 10 MB (10 * 1024 * 1024 bytes)
export const MAX_FILE_SIZE_BYTES = 10 * 1024 * 1024;

/**
 * Validates whether a given MIME type is supported.
 */
export const isValidMimeType = (mimeType: string): boolean => {
  return Object.prototype.hasOwnProperty.call(ALLOWED_MIME_TYPES, mimeType.toLowerCase());
};

/**
 * Generates a unique, server-side secure stored filename with verified extension.
 */
export const generateSecureStoredFileName = (mimeType: string, originalFileName?: string): string => {
  const mimeExt = ALLOWED_MIME_TYPES[mimeType.toLowerCase()];
  let ext = mimeExt || '';

  if (originalFileName) {
    const rawExt = path.extname(originalFileName).toLowerCase();
    if (rawExt === '.pdf' && mimeType === 'application/pdf') {
      ext = '.pdf';
    } else if ((rawExt === '.jpg' || rawExt === '.jpeg') && (mimeType === 'image/jpeg' || mimeType === 'image/jpg')) {
      ext = rawExt;
    } else if (rawExt === '.png' && mimeType === 'image/png') {
      ext = '.png';
    }
  }

  const randomId = crypto.randomUUID();
  return `${randomId}${ext}`;
};

/**
 * Resolves a stored filename to its absolute path on disk and verifies against path traversal.
 */
export const getSafeFilePath = (storedFileName: string): string => {
  if (!storedFileName || typeof storedFileName !== 'string') {
    throw new AppError('Invalid file identifier', 400);
  }

  // Path traversal check
  const safeName = path.basename(storedFileName);
  if (safeName !== storedFileName || storedFileName.includes('..') || storedFileName.includes('/') || storedFileName.includes('\\')) {
    throw new AppError('Invalid file path request', 400);
  }

  const resolvedPath = path.resolve(DOCUMENTS_UPLOAD_DIR, safeName);

  // Ensure resolved path is strictly within DOCUMENTS_UPLOAD_DIR
  if (!resolvedPath.startsWith(DOCUMENTS_UPLOAD_DIR)) {
    throw new AppError('Access to the specified file path is forbidden', 403);
  }

  return resolvedPath;
};

/**
 * Verifies that the file content matches authentic magic bytes (file signature)
 * for the specified or allowed MIME types to prevent extension/MIME spoofing.
 */
export const verifyFileMagicBytes = async (filePath: string, claimedMimeType: string): Promise<boolean> => {
  try {
    const handle = await fs.promises.open(filePath, 'r');
    const buffer = Buffer.alloc(8);
    const { bytesRead } = await handle.read(buffer, 0, 8, 0);
    await handle.close();

    if (bytesRead < 4) {
      return false;
    }

    const mime = claimedMimeType.toLowerCase();

    // PDF Magic Bytes: %PDF (0x25 0x50 0x44 0x46)
    if (mime === 'application/pdf') {
      return buffer[0] === 0x25 && buffer[1] === 0x50 && buffer[2] === 0x44 && buffer[3] === 0x46;
    }

    // JPEG Magic Bytes: 0xFF 0xD8 0xFF
    if (mime === 'image/jpeg' || mime === 'image/jpg') {
      return buffer[0] === 0xFF && buffer[1] === 0xD8 && buffer[2] === 0xFF;
    }

    // PNG Magic Bytes: 0x89 0x50 0x4E 0x47 0x0D 0x0A 0x1A 0x0A
    if (mime === 'image/png') {
      return (
        bytesRead >= 8 &&
        buffer[0] === 0x89 &&
        buffer[1] === 0x50 &&
        buffer[2] === 0x4E &&
        buffer[3] === 0x47 &&
        buffer[4] === 0x0D &&
        buffer[5] === 0x0A &&
        buffer[6] === 0x1A &&
        buffer[7] === 0x0A
      );
    }

    return false;
  } catch (error) {
    console.warn(`[Storage] Failed to read magic bytes for ${filePath}:`, error);
    return false;
  }
};

/**
 * Deletes a stored file from disk safely without throwing unhandled exceptions.
 */
export const deleteStoredFile = async (storedFileName: string): Promise<boolean> => {
  try {
    const filePath = getSafeFilePath(storedFileName);
    if (fs.existsSync(filePath)) {
      await fs.promises.unlink(filePath);
      return true;
    }
    return false;
  } catch (error) {
    // Log non-blocking warning and return false
    console.warn(`[Storage] Failed to delete file ${storedFileName}:`, error);
    return false;
  }
};
