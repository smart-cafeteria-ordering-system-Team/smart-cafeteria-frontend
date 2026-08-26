export const validateBody = (validatorFunction) => {
    return (req, res, next) => {
        const validationResult = validatorFunction(req.body);

        if (!validationResult.isValid) {
            return res.status(400).json({
                success: false,
                message: 'Validation failed',
                errors: validationResult.errors
            });
        }

        next();
    };
};