import express from 'express';
import cors from 'cors';
import { SummaryController } from './controllers/summary.controller';
import { errorHandler, notFoundHandler } from './middleware/error.middleware';
import { SummaryService } from './services/summary.service';

const app = express();

const summaryService = new SummaryService();

app.use(cors({
    origin: [
        'http://localhost:3000',
        'http://frontend:3000',
        'http://127.0.0.1:3000'
    ],
    credentials: true
}));

app.use(express.json());

const summaryController = new SummaryController(summaryService);

app.use('/api/summary', summaryController.getRoutes());

app.use(notFoundHandler);
app.use(errorHandler);

export default app;