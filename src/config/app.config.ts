export const appConfig = {
    port: parseInt(process.env.SUMMARY_API_PORT || '3002'),
    env: process.env.NODE_ENV || 'development',
    mainApi: {
        baseUrl: process.env.MAIN_API_URL || 'http://localhost:3001'
    },
    apiToken: process.env.INTERNAL_API_TOKEN || 'default-internal-token'
};