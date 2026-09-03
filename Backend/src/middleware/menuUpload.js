// middleware/menuUpload.js
// Multer disk-storage config for admin menu item image uploads.

const fs = require('fs');
const path = require('path');
const multer = require('multer');

const uploadDir = path.join(__dirname, '..', '..', 'uploads', 'menu');
if (!fs.existsSync(uploadDir)) {
  fs.mkdirSync(uploadDir, { recursive: true });
}

const storage = multer.diskStorage({
  destination: (req, file, cb) => cb(null, uploadDir),
  filename: (req, file, cb) => {
    const ext = path.extname(file.originalname || '').toLowerCase();
    cb(null, `${Date.now()}-${Math.round(Math.random() * 1e9)}${ext}`);
  }
});

const upload = multer({
  storage,
  limits: { fileSize: 2 * 1024 * 1024 }
});

/**
 * Parse JSON-stringified multipart fields (name / description) back into
 * objects before they reach the controller. Also converts the 'available'
 * boolean-like string into a real boolean.
 */
function parseFormFields(req, res, next) {
  try {
    if (typeof req.body.name === 'string') {
      const parsed = JSON.parse(req.body.name);
      req.body.name = parsed && typeof parsed === 'object' ? parsed : { en: req.body.name, am: req.body.name };
    }
    if (typeof req.body.description === 'string') {
      const parsed = JSON.parse(req.body.description);
      req.body.description = parsed && typeof parsed === 'object' ? parsed : { en: '', am: '' };
    }
    if (req.body.available === 'true' || req.body.available === true) req.body.available = true;
    else if (req.body.available === 'false' || req.body.available === false) req.body.available = false;
    if (req.body.isAvailable === 'true' || req.body.isAvailable === true) req.body.isAvailable = true;
    else if (req.body.isAvailable === 'false' || req.body.isAvailable === false) req.body.isAvailable = false;
  } catch (err) {
    return res.status(400).json({ success: false, error: 'Invalid form data' });
  }
  next();
}

module.exports = { upload, parseFormFields, uploadDir };
