// middleware/validation.middleware.js

const validateBody = (validatorFunction) => {
    return (req, res, next) => {

        if (typeof validatorFunction !== 'function') {
            return res.status(500).json({
                success: false,
                message: 'Validation configuration error'
            });
        }

        const validationResult = validatorFunction(req.body);

        if (!validationResult || !validationResult.isValid) {
            return res.status(400).json({
                success: false,
                message: 'Validation failed',
                errors: validationResult?.errors || []
            });
        }

        next();
    };
};

module.exports = { validateBody };