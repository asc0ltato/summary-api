import { ApiClient } from '../utils/api-client';
import { IEmailGroup, IApiResponse, ShipmentRequest } from '../models/summary.interface';
import { logger } from '../utils/logger';
import { WebSocketClientService } from './websocket-client.service';

export class SummaryService {
    private apiClient: ApiClient;
    private wsClient: WebSocketClientService;

    constructor() {
        this.apiClient = new ApiClient();
        this.wsClient = new WebSocketClientService();
    }

    async getApprovedSummaries(): Promise<IApiResponse<Array<{ aiAnalysis: Omit<ShipmentRequest, 'is_ai_generated'> }>>> {
        try {
            const cachedSummaries = this.wsClient.getCachedSummaries();
            
            if (cachedSummaries.length > 0 && this.wsClient.isConnected()) {
                logger.info(`Returning ${cachedSummaries.length} approved summaries from WebSocket cache`);
                return {
                    success: true,
                    data: cachedSummaries.map(s => ({ aiAnalysis: s.aiAnalysis })),
                    message: `Found ${cachedSummaries.length} approved summaries (from WebSocket cache)`
                };
            }

            logger.info('Fetching approved summaries from main API (WebSocket cache empty or disconnected)');

            const response = await this.apiClient.get<any>('/api/internal/email-groups/approved');

            if (!response.success || !response.data?.emailGroups) {
                logger.error('Invalid response format from main API:', response);
                throw new Error('Invalid response format from main API');
            }

            const summaries = response.data.emailGroups
                .map((emailGroup: IEmailGroup) => {
                    let aiAnalysis: ShipmentRequest | null = null;
                    
                    if (emailGroup.summary && emailGroup.summary.status === 'approved') {
                        aiAnalysis = emailGroup.summary.aiAnalysis;
                    } else if (emailGroup.summaries) {
                        const approvedSummary = emailGroup.summaries.find(s => s.status === 'approved');
                        aiAnalysis = approvedSummary?.aiAnalysis || null;
                    }
                    
                    if (!aiAnalysis) {
                        return null;
                    }
                    
                    // Убираем is_ai_generated из aiAnalysis
                    const { is_ai_generated, ...aiAnalysisWithoutFlag } = aiAnalysis;
                    
                    return {
                        emailGroupId: emailGroup.emailGroupId,
                        aiAnalysis: aiAnalysisWithoutFlag
                    };
                })
                .filter((item: { emailGroupId: string; aiAnalysis: Omit<ShipmentRequest, 'is_ai_generated'> } | null) => item !== null);

            logger.info(`Retrieved ${summaries.length} approved summaries`);

            if (summaries.length > 0) {
                this.wsClient.updateCache(summaries);
            }

            return {
                success: true,
                data: summaries.map((s: { emailGroupId: string; aiAnalysis: Omit<ShipmentRequest, 'is_ai_generated'> }) => ({ aiAnalysis: s.aiAnalysis })),
                message: `Found ${summaries.length} approved summaries`
            };

        } catch (error: any) {
            let errorMessage = 'Unknown error';
            let errorDetails: any = {};

            if (error.response) {
                errorDetails = {
                    status: error.response.status,
                    statusText: error.response.statusText,
                    data: error.response.data
                };
                
                if (error.response.data) {
                    if (typeof error.response.data === 'string') {
                        errorMessage = error.response.data;
                    } else if (error.response.data.message) {
                        errorMessage = error.response.data.message;
                    } else if (error.response.data.error) {
                        errorMessage = error.response.data.error;
                    } else {
                        errorMessage = `Backend API error: ${error.response.status} ${error.response.statusText}`;
                    }
                } else {
                    errorMessage = `Backend API error: ${error.response.status} ${error.response.statusText}`;
                }
            } else if (error.message) {
                errorMessage = error.message;
            }

            logger.error('Error fetching approved summaries:', {
                errorMessage,
                errorDetails,
                errorStack: error.stack,
                errorName: error.name
            });

            return {
                success: false,
                message: 'Failed to fetch approved summaries',
                error: errorMessage
            };
        }
    }


    async healthCheck(): Promise<{ mainApi: boolean; service: boolean }> {
        try {
            const mainApiHealth = await this.apiClient.get('/api/internal/health');
            return {
                mainApi: !!mainApiHealth,
                service: true
            };
        } catch (error) {
            logger.error('Service health check failed:', error);
            return {
                mainApi: false,
                service: false
            };
        }
    }
}