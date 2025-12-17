import WebSocket from 'ws';
import { appConfig } from '../config/app.config';
import { logger } from '../utils/logger';
import { ShipmentRequest } from '../models/summary.interface';

interface ApprovedSummary {
    emailGroupId: string;
    shipment_data: ShipmentRequest;
}

export class WebSocketClientService {
    private ws: WebSocket | null = null;
    private cache: Map<string, ApprovedSummary> = new Map();
    private reconnectInterval: NodeJS.Timeout | null = null;
    private readonly RECONNECT_DELAY = 5000;
    private isConnecting = false;

    constructor() {
        this.connect();
    }

    private connect(): void {
        if (this.isConnecting || (this.ws && this.ws.readyState === WebSocket.OPEN)) {
            return;
        }

        this.isConnecting = true;
        let wsUrl = appConfig.mainApi.baseUrl;
        if (wsUrl.includes('localhost') || wsUrl.includes('127.0.0.1')) {
            wsUrl = wsUrl.replace('http://', 'ws://').replace('https://', 'wss://');
        } else {
            wsUrl = wsUrl.replace('http://backend:', 'ws://backend:').replace('https://backend:', 'wss://backend:');
        }
        const wsPath = '/ws/approved-summaries';
        const fullUrl = `${wsUrl}${wsPath}`;

        logger.info(`Connecting to WebSocket: ${fullUrl}`);

        try {
            this.ws = new WebSocket(fullUrl);

            this.ws.on('open', () => {
                logger.info('WebSocket connected to backend');
                this.isConnecting = false;
                if (this.reconnectInterval) {
                    clearInterval(this.reconnectInterval);
                    this.reconnectInterval = null;
                }
            });

            this.ws.on('message', (data: WebSocket.Data) => {
                try {
                    const message = JSON.parse(data.toString());
                    
                    if (message.type === 'approved_summary' && message.data) {
                        const summary: ApprovedSummary = {
                            emailGroupId: message.data.emailGroupId,
                            shipment_data: message.data.shipment_data
                        };
                        
                        this.cache.set(summary.emailGroupId, summary);
                        logger.info(`Received approved summary for ${summary.emailGroupId}, cache size: ${this.cache.size}`);
                    }
                } catch (error) {
                    logger.error('Error parsing WebSocket message:', error);
                }
            });

            this.ws.on('close', () => {
                logger.warn('WebSocket connection closed, will reconnect...');
                this.isConnecting = false;
                this.ws = null;
                this.scheduleReconnect();
            });

            this.ws.on('error', (error: Error) => {
                logger.error('WebSocket error:', error);
                this.isConnecting = false;
                this.scheduleReconnect();
            });

        } catch (error) {
            logger.error('Error creating WebSocket connection:', error);
            this.isConnecting = false;
            this.scheduleReconnect();
        }
    }

    private scheduleReconnect(): void {
        if (this.reconnectInterval) {
            return;
        }

        this.reconnectInterval = setInterval(() => {
            if (!this.ws || this.ws.readyState === WebSocket.CLOSED) {
                logger.info('Attempting to reconnect WebSocket...');
                this.connect();
            }
        }, this.RECONNECT_DELAY);
    }

    public getCachedSummaries(): ApprovedSummary[] {
        return Array.from(this.cache.values());
    }

    public updateCache(summaries: ApprovedSummary[]): void {
        summaries.forEach(summary => {
            this.cache.set(summary.emailGroupId, summary);
        });
        logger.info(`Updated WebSocket cache with ${summaries.length} summaries, total cache size: ${this.cache.size}`);
    }

    public getCacheSize(): number {
        return this.cache.size;
    }

    public isConnected(): boolean {
        return this.ws !== null && this.ws.readyState === WebSocket.OPEN;
    }

    public disconnect(): void {
        if (this.reconnectInterval) {
            clearInterval(this.reconnectInterval);
            this.reconnectInterval = null;
        }
        if (this.ws) {
            this.ws.close();
            this.ws = null;
        }
    }
}

