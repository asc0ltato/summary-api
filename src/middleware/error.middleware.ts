import { Request, Response, NextFunction } from 'express';
import { logger } from '../utils/logger';

export const errorHandler = (
    error: Error,
    _req: Request,
    res: Response,
    _next: NextFunction
): Response => {
    logger.error('Unhandled error:', error);

    return res.status(500).json({
        success: false,
        message: 'Internal server error',
        error: process.env.NODE_ENV === 'development' ? error.message : 'Something went wrong'
    });
};

export const notFoundHandler = (_req: Request, res: Response): Response => {
    return res.status(404).json({
        success: false,
        message: 'Route not found'
    });
};