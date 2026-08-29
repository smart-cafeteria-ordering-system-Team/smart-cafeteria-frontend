// utils/email.js

const { logger } = require("./logger");

const sendEmail = async ({ to, subject, htmlBody }) => {
    try {
        if (!to || typeof to !== 'string') {
            const error = new Error(
                'Email destination is required'
            );
            error.statusCode = 400;
            throw error;
        }

        if (!subject || typeof subject !== 'string') {
            const error = new Error(
                'Email subject is required'
            );
            error.statusCode = 400;
            throw error;
        }

        if (htmlBody !== undefined && typeof htmlBody !== 'string') {
            const error = new Error(
                'Email body must be a string'
            );
            error.statusCode = 400;
            throw error;
        }

        logger.info(
            `Email queued for ${to.trim()} | Subject: "${subject.trim()}"`
        );

        // Development placeholder.
        // Replace this section with a real email provider
        // when email delivery is required.

        return {
            success: true,
            messageId: `msg_${Date.now()}`,
            recipient: to.trim()
        };

    } catch (error) {
        logger.error('Failed to send email:', error);

        if (error.statusCode === 400) {
            throw error;
        }

        const emailError = new Error('Email dispatch failed');
        emailError.statusCode = 500;
        throw emailError;
    }
};
module.exports = { sendEmail };
