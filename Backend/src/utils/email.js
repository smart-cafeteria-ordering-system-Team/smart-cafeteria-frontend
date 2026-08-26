import { logger } from './logger.js';

export const sendEmail = async ({ to, subject, htmlBody }) => {
    try {
        if (!to || !subject) {
            throw new Error('Email destination and subject are required');
        }

        // Simulating background SMTP transport sending process
        logger.info(`Sending email to: ${to} | Subject: "${subject}"`);

        return {
            success: true,
            messageId: `msg_${Date.now()}`,
            recipient: to
        };
    } catch (error) {
        logger.error('Failed to send email:', error);
        throw { status: 500, message: 'Email dispatch failed' };
    }
};