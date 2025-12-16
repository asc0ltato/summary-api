import { Request, Response, Router } from 'express';
import { SummaryService } from '../services/summary.service';
import { logger } from '../utils/logger';

export class SummaryController {
    private summaryService: SummaryService;

    constructor(summaryService?: SummaryService) {
        this.summaryService = summaryService || new SummaryService();
    }

    public getApprovedSummaries = async (_req: Request, res: Response): Promise<Response> => {
        try {
            logger.info('GET /api/email-groups - fetching all approved summaries');

            const result = await this.summaryService.getApprovedSummaries();

            if (!result.success) {
                return res.status(500).json(result);
            }

            return res.json(result);

        } catch (error: any) {
            logger.error('Error in getApprovedSummaries:', error);
            return res.status(500).json({
                success: false,
                message: 'Internal server error',
                error: error.message
            });
        }
    };

    public healthCheck = async (_req: Request, res: Response): Promise<Response> => {
        try {
            const health = await this.summaryService.healthCheck();

            return res.json({
                success: true,
                data: {
                    service: 'summary-api',
                    status: health.service ? 'healthy' : 'unhealthy',
                    mainApi: health.mainApi ? 'connected' : 'disconnected',
                    timestamp: new Date().toISOString()
                }
            });

        } catch (error: any) {
            logger.error('Health check error:', error);
            return res.status(500).json({
                success: false,
                message: 'Service unhealthy',
                error: error.message
            });
        }
    };

    public getRoutes(): Router {
        const router = Router();

        router.get('/health', this.healthCheck);
        router.get('/approved', this.getApprovedSummaries);

        return router;
    }
}