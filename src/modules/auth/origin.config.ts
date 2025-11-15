export const getAllowedOrigins = (): string[] => {
    return process.env.ALLOWED_ORIGINS?.split(',') || [''];
};