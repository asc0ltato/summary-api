import './preload';
import app from './app';
import { appConfig } from './config/app.config';
import { logger } from './utils/logger';

app.listen(appConfig.port, () => {
    logger.info(`Server running on port ${appConfig.port}`);
    logger.info(`Environment: ${appConfig.env}`);
    logger.info(`Health check: http://summary-api:${appConfig.port}/api/summary`);
});