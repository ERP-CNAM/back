import pino from 'pino';

/**
 * Logger instance for the application
 */
export const logger = pino({
    name: 'back',
    level: process.env.LOG_LEVEL || 'info',
    transport:
        process.env.NODE_ENV === 'production'
            ? undefined
            : {
                target: 'pino-pretty',
                options: {
                    colorize: true,
                    translateTime: 'SYS:standard',
                },
            },
});

export default logger;
