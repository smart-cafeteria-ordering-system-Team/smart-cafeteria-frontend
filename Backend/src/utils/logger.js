const LOG_LEVELS = {
    INFO: 'INFO',
    WARN: 'WARN',
    ERROR: 'ERROR'
};

const formatMessage = (level, message) => {
    const timestamp = new Date().toISOString();
    return `[${timestamp}] [${level}]: ${message}`;
};

export const logger = {
    info: (message, meta = '') => {
        console.log(formatMessage(LOG_LEVELS.INFO, message), meta ? JSON.stringify(meta) : '');
    },
    warn: (message, meta = '') => {
        console.warn(formatMessage(LOG_LEVELS.WARN, message), meta ? JSON.stringify(meta) : '');
    },
    error: (message, errorDetails = null) => {
        console.error(formatMessage(LOG_LEVELS.ERROR, message), errorDetails || '');
    }
};