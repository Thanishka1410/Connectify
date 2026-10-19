const multer = require('multer');
const path = require('path');
const fs = require('fs');
const { cloudinary, isCloudinaryConfigured } = require('../config/cloudinary');

// Ensure uploads directory exists
const uploadDir = path.join(__dirname, '..', 'uploads');
if (!fs.existsSync(uploadDir)) {
  fs.mkdirSync(uploadDir, { recursive: true });
}

// Disk storage for local development or fallback
const storage = multer.diskStorage({
  destination: (req, file, cb) => {
    cb(null, uploadDir);
  },
  filename: (req, file, cb) => {
    const uniqueSuffix = `${Date.now()}-${Math.round(Math.random() * 1e9)}`;
    const ext = path.extname(file.originalname).toLowerCase();
    cb(null, `${file.fieldname}-${uniqueSuffix}${ext}`);
  },
});

// File filter to allow only image files
const fileFilter = (req, file, cb) => {
  const allowedMimeTypes = ['image/jpeg', 'image/png', 'image/webp', 'image/gif', 'image/svg+xml'];
  if (allowedMimeTypes.includes(file.mimetype)) {
    cb(null, true);
  } else {
    cb(new Error('Only image files (JPEG, PNG, WebP, GIF, SVG) are allowed.'), false);
  }
};

const upload = multer({
  storage,
  limits: {
    fileSize: 5 * 1024 * 1024, // 5MB max
  },
  fileFilter,
});

/**
 * Helper to upload a file to Cloudinary if configured, or return local relative URL
 */
const processUploadedFile = async (file, req) => {
  if (!file) return null;

  if (isCloudinaryConfigured) {
    try {
      const result = await cloudinary.uploader.upload(file.path, {
        folder: 'connectify',
        resource_type: 'auto',
      });
      // Optionally delete local temp file
      if (fs.existsSync(file.path)) {
        fs.unlinkSync(file.path);
      }
      return {
        url: result.secure_url,
        name: file.originalname,
        fileType: file.mimetype,
        size: file.size,
      };
    } catch (err) {
      console.error('[Cloudinary Upload Error]', err.message);
      // Fallback to local file if Cloudinary fails
    }
  }

  // Construct URL for locally served upload
  const baseUrl = `${req.protocol}://${req.get('host')}`;
  const localUrl = `${baseUrl}/uploads/${file.filename}`;

  return {
    url: localUrl,
    name: file.originalname,
    fileType: file.mimetype,
    size: file.size,
  };
};

module.exports = {
  upload,
  processUploadedFile,
};
