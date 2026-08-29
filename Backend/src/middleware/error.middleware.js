// middleware/error.middleware.js

const errorHandler = (err, req, res, next) => {
    console.error('Backend Error:', err);

    // Default status code
    let statusCode = err.statusCode || err.status || 500;

    // Make sure status code is valid
    if (statusCode < 400 || statusCode > 599) {
        statusCode = 500;
    }

    // Default error message
    let message = err.message || 'Internal Server Error';

    // Mongoose validation error
    if (err.name === 'ValidationError') {
        statusCode = 400;
        message = 'Validation failed';
    }

    // MongoDB duplicate key error
    if (err.code === 11000) {
        statusCode = 409;

        const duplicateField = Object.keys(err.keyValue || {})[0];

        message = duplicateField
            ? `${duplicateField} already exists`
            : 'Duplicate value already exists';
    }

    // Invalid MongoDB ObjectId
    if (err.name === 'CastError') {
        statusCode = 400;
        message = 'Invalid resource ID';
    }

    // JWT errors
    if (err.name === 'JsonWebTokenError') {
        statusCode = 403;
        message = 'Invalid access token';
    }

    if (err.name === 'TokenExpiredError') {
        statusCode = 401;
        message = 'Access token expired';
    }

    // Response
    return res.status(statusCode).json({
        success: false,
        message,
        ...(process.env.NODE_ENV === 'development' && {
            error: err.message
        })
    });
};
module.exports = { errorHandler };
