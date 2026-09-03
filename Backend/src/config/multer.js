const multer = require('multer');
const path = require('path');
const fs = require('fs');

// ================================================================
//  MULTER CONFIGURATION FOR FILE UPLOADS
// ================================================================

/**
 * Configure multer storage for different file types
 * @param {string} folder - Subdirectory in uploads/ (e.g., 'menu', 'feedback')
 * @returns {object} multer storage configuration
 */
const createStorage = (folder) => {
  const uploadPath = path.join(__dirname, '../../uploads', folder);
  
  // Create directory if it doesn't exist
  if (!fs.existsSync(uploadPath)) {
    fs.mkdirSync(uploadPath, { recursive: true });
  }

  return multer.diskStorage({
    destination: (req, file, cb) => {
      cb(null, uploadPath);
    },
    filename: (req, file, cb) => {
      // Generate unique filename: fieldname-timestamp-random.ext
      const uniqueSuffix = Date.now() + '-' + Math.round(Math.random() * 1E9);
      const ext = path.extname(file.originalname);
      const name = path.basename(file.originalname, ext);
      cb(null, `${name}-${uniqueSuffix}${ext}`);
    }
  });
};

/**
 * File filter for image uploads
 * @param {object} req - Express request object
 * @param {object} file - Multer file object
 * @param {function} cb - Callback function
 */
const imageFileFilter = (req, file, cb) => {
  const allowedMimes = ['image/jpeg', 'image/png', 'image/webp'];
  if (allowedMimes.includes(file.mimetype)) {
    cb(null, true);
  } else {
    cb(new Error(`Invalid file type. Allowed types: ${allowedMimes.join(', ')}`));
  }
};

/**
 * Create multer upload instance for menu item images
 * Max file size: 5MB
 * Allowed fields: 'image'
 */
const menuUpload = multer({
  storage: createStorage('menu'),
  fileFilter: imageFileFilter,
  limits: {
    fileSize: 5 * 1024 * 1024 // 5MB
  }
});

/**
 * Create multer upload instance for feedback images
 * Max file size: 3MB
 * Allowed fields: 'image'
 */
const feedbackUpload = multer({
  storage: createStorage('feedback'),
  fileFilter: imageFileFilter,
  limits: {
    fileSize: 3 * 1024 * 1024 // 3MB
  }
});

module.exports = {
  menuUpload,
  feedbackUpload,
  createStorage,
  imageFileFilter
};
