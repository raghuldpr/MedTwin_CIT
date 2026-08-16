import { Request, Response, NextFunction } from 'express';
import multer, { FileFilterCallback } from 'multer';
import {
  DOCUMENTS_UPLOAD_DIR,
  MAX_FILE_SIZE_BYTES,
  isValidMimeType,
  generateSecureStoredFileName,
} from '../utils/storage.util';
import { AppError } from './error.middleware';

// Configure Multer disk storage
const storage = multer.diskStorage({
  destination: (_req, _file, cb) => {
    cb(null, DOCUMENTS_UPLOAD_DIR);
  },
  filename: (_req, file, cb) => {
    try {
      const secureName = generateSecureStoredFileName(file.mimetype, file.originalname);
      cb(null, secureName);
    } catch (error) {
      cb(error as Error, '');
    }
  },
});

// Configure Multer file filter
const fileFilter = (_req: Request, file: Express.Multer.File, cb: FileFilterCallback) => {
  if (!isValidMimeType(file.mimetype)) {
    return cb(
      new AppError(
        'Unsupported file type. Allowed formats are PDF, JPEG, and PNG.',
        400
      )
    );
  }
  cb(null, true);
};

// Raw multer instance
const upload = multer({
  storage,
  fileFilter,
  limits: {
    fileSize: MAX_FILE_SIZE_BYTES,
    files: 1,
  },
});

/**
 * Middleware for handling single file upload under 'file' or 'document' field names
 * with normalized error handling for size limits and unexpected fields.
 */
export const uploadMedicalDocument = (req: Request, res: Response, next: NextFunction): void => {
  // Support either 'file' or 'document' field name
  const uploadSingle = upload.single('file');

  uploadSingle(req, res, (err: unknown) => {
    if (err) {
      if (err instanceof multer.MulterError) {
        if (err.code === 'LIMIT_FILE_SIZE') {
          return next(
            new AppError(
              `File size exceeds the maximum allowed limit of ${MAX_FILE_SIZE_BYTES / (1024 * 1024)}MB.`,
              400
            )
          );
        }
        if (err.code === 'LIMIT_UNEXPECTED_FILE') {
          // If 'file' wasn't used, check if 'document' was supplied
          return upload.single('document')(req, res, (secondErr: unknown) => {
            if (secondErr) {
              if (secondErr instanceof multer.MulterError && secondErr.code === 'LIMIT_FILE_SIZE') {
                return next(
                  new AppError(
                    `File size exceeds the maximum allowed limit of ${MAX_FILE_SIZE_BYTES / (1024 * 1024)}MB.`,
                    400
                  )
                );
              }
              return next(new AppError(`File upload error: ${(secondErr as Error).message}`, 400));
            }
            next();
          });
        }
        return next(new AppError(`File upload error: ${err.message}`, 400));
      }
      return next(err);
    }
    next();
  });
};
