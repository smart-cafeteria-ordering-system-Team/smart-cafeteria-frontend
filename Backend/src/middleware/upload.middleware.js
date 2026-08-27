// middleware/upload.middleware.js

const DEFAULT_ALLOWED_TYPES = [
    'image/jpeg',
    'image/png',
    'image/webp'
];

export const uploadMiddleware = (
    allowedTypes = DEFAULT_ALLOWED_TYPES
) => {
    return (req, res, next) => {

        // Check whether Multer received a file
        if (!req.file) {
            return res.status(400).json({
                success: false,
                message: 'No file uploaded'
            });
        }

        // Validate MIME type
        if (!allowedTypes.includes(req.file.mimetype)) {
            return res.status(400).json({
                success: false,
                message: 'Invalid file type',
                allowedTypes
            });
        }

        next();
    };
};