// File upload validation utilities

export interface FileValidationOptions {
  maxSize?: number; // in bytes
  allowedTypes?: string[];
  allowedExtensions?: string[];
  minWidth?: number;
  minHeight?: number;
  maxWidth?: number;
  maxHeight?: number;
}

export interface ValidationResult {
  isValid: boolean;
  error?: string;
}

export const FILE_SIZE_LIMITS = {
  IMAGE: 10 * 1024 * 1024, // 10MB
  DOCUMENT: 50 * 1024 * 1024, // 50MB
  APP_FILE: 500 * 1024 * 1024, // 500MB
  VIDEO: 100 * 1024 * 1024, // 100MB
};

export const ALLOWED_FILE_TYPES = {
  IMAGES: ['image/jpeg', 'image/png', 'image/webp', 'image/gif'],
  DOCUMENTS: [
    'application/pdf',
    'application/msword',
    'application/vnd.openxmlformats-officedocument.wordprocessingml.document',
    'text/plain',
  ],
  APP_FILES: {
    IOS: ['application/octet-stream', 'application/x-ios-app'],
    ANDROID: ['application/vnd.android.package-archive'],
    WEB: ['application/zip', 'application/x-zip-compressed'],
    MAC: ['application/zip', 'application/x-apple-diskimage'],
    PC: ['application/zip', 'application/x-msdownload', 'application/x-msdos-program'],
  },
  VIDEOS: ['video/mp4', 'video/webm', 'video/ogg'],
};

export const ALLOWED_EXTENSIONS = {
  IMAGES: ['.jpg', '.jpeg', '.png', '.webp', '.gif'],
  DOCUMENTS: ['.pdf', '.doc', '.docx', '.txt'],
  APP_FILES: {
    IOS: ['.ipa'],
    ANDROID: ['.apk'],
    WEB: ['.zip'],
    MAC: ['.dmg', '.zip'],
    PC: ['.exe', '.msi', '.zip'],
  },
  VIDEOS: ['.mp4', '.webm', '.ogg'],
};

export function formatFileSize(bytes: number): string {
  if (bytes === 0) return '0 Bytes';

  const k = 1024;
  const sizes = ['Bytes', 'KB', 'MB', 'GB'];
  const i = Math.floor(Math.log(bytes) / Math.log(k));

  return parseFloat((bytes / Math.pow(k, i)).toFixed(2)) + ' ' + sizes[i];
}

export function getFileExtension(filename: string): string {
  return filename.toLowerCase().substring(filename.lastIndexOf('.'));
}

export function validateFile(file: File, options: FileValidationOptions = {}): ValidationResult {
  const {
    maxSize = FILE_SIZE_LIMITS.DOCUMENT,
    allowedTypes = [],
    allowedExtensions = [],
  } = options;

  // Check file size
  if (file.size > maxSize) {
    return {
      isValid: false,
      error: `File size (${formatFileSize(file.size)}) exceeds maximum allowed size (${formatFileSize(maxSize)})`,
    };
  }

  // Check file type
  if (allowedTypes.length > 0 && !allowedTypes.includes(file.type)) {
    return {
      isValid: false,
      error: `File type "${file.type}" is not allowed. Allowed types: ${allowedTypes.join(', ')}`,
    };
  }

  // Check file extension
  if (allowedExtensions.length > 0) {
    const extension = getFileExtension(file.name);
    if (!allowedExtensions.includes(extension)) {
      return {
        isValid: false,
        error: `File extension "${extension}" is not allowed. Allowed extensions: ${allowedExtensions.join(', ')}`,
      };
    }
  }

  return { isValid: true };
}

export function validateImage(file: File, options: FileValidationOptions = {}): Promise<ValidationResult> {
  return new Promise((resolve) => {
    const {
      maxSize = FILE_SIZE_LIMITS.IMAGE,
      minWidth = 0,
      minHeight = 0,
      maxWidth = Infinity,
      maxHeight = Infinity,
    } = options;

    // First validate basic file properties
    const basicValidation = validateFile(file, {
      maxSize,
      allowedTypes: ALLOWED_FILE_TYPES.IMAGES,
      allowedExtensions: ALLOWED_EXTENSIONS.IMAGES,
    });

    if (!basicValidation.isValid) {
      resolve(basicValidation);
      return;
    }

    // Validate image dimensions
    const img = new Image();
    const url = URL.createObjectURL(file);

    img.onload = () => {
      URL.revokeObjectURL(url);

      if (img.width < minWidth || img.height < minHeight) {
        resolve({
          isValid: false,
          error: `Image dimensions (${img.width}x${img.height}) are too small. Minimum: ${minWidth}x${minHeight}`,
        });
        return;
      }

      if (img.width > maxWidth || img.height > maxHeight) {
        resolve({
          isValid: false,
          error: `Image dimensions (${img.width}x${img.height}) are too large. Maximum: ${maxWidth}x${maxHeight}`,
        });
        return;
      }

      resolve({ isValid: true });
    };

    img.onerror = () => {
      URL.revokeObjectURL(url);
      resolve({
        isValid: false,
        error: 'Invalid image file or corrupted data',
      });
    };

    img.src = url;
  });
}

export function validateAppFile(file: File, platform: string): ValidationResult {
  const platformUpper = platform.toUpperCase() as keyof typeof ALLOWED_FILE_TYPES.APP_FILES;
  
  if (!ALLOWED_FILE_TYPES.APP_FILES[platformUpper]) {
    return {
      isValid: false,
      error: `Unsupported platform: ${platform}`,
    };
  }

  return validateFile(file, {
    maxSize: FILE_SIZE_LIMITS.APP_FILE,
    allowedTypes: ALLOWED_FILE_TYPES.APP_FILES[platformUpper],
    allowedExtensions: ALLOWED_EXTENSIONS.APP_FILES[platformUpper],
  });
}

export function validateDocument(file: File): ValidationResult {
  return validateFile(file, {
    maxSize: FILE_SIZE_LIMITS.DOCUMENT,
    allowedTypes: ALLOWED_FILE_TYPES.DOCUMENTS,
    allowedExtensions: ALLOWED_EXTENSIONS.DOCUMENTS,
  });
}

export function validateVideo(file: File): ValidationResult {
  return validateFile(file, {
    maxSize: FILE_SIZE_LIMITS.VIDEO,
    allowedTypes: ALLOWED_FILE_TYPES.VIDEOS,
    allowedExtensions: ALLOWED_EXTENSIONS.VIDEOS,
  });
}

export function getUploadCategory(file: File): string {
  if (ALLOWED_FILE_TYPES.IMAGES.includes(file.type)) {
    return 'images';
  }
  
  if (ALLOWED_FILE_TYPES.DOCUMENTS.includes(file.type)) {
    return 'documents';
  }
  
  if (ALLOWED_FILE_TYPES.VIDEOS.includes(file.type)) {
    return 'videos';
  }
  
  // Check if it's an app file
  for (const [platform, types] of Object.entries(ALLOWED_FILE_TYPES.APP_FILES)) {
    if (types.includes(file.type)) {
      return 'app-files';
    }
  }
  
  return 'other';
}

export function generateUniqueFileName(originalName: string): string {
  const timestamp = Date.now();
  const random = Math.random().toString(36).substring(2, 8);
  const extension = getFileExtension(originalName);
  const nameWithoutExt = originalName.substring(0, originalName.lastIndexOf('.'));
  
  return `${nameWithoutExt}-${timestamp}-${random}${extension}`;
}
