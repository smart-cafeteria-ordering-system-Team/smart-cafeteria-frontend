export const uploadMiddleware = (allowedTypes = ['image/jpeg', 'image/png', 'image/webp']) => {
    return (req, res, next) => {
        // In Express with Multer, req.file or req.files holds uploaded file details
        if (!req.file) {
            return res.status(400).json({
                success: false,
                message: 'No file uploaded'
            });
        }

        if (!allowedTypes.includes(req.file.mimetype)) {
            return res.status(400).json({
                success: false,
                message: `Invalid file type. Allowed formats: ${allowedTypes.join(', ')}`
            });
        }

        next();
    };
};