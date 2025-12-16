import axios, { AxiosInstance } from 'axios';
import { appConfig } from '../config/app.config';
import { JWTUtils } from './jwt-utils';
import { logger } from './logger';

export class ApiClient {
    private client: AxiosInstance;
    private currentToken: string | null = null;
    private tokenExpiry: number = 0;
    private readonly TOKEN_REFRESH_BUFFER = 2 * 60 * 1000;

    constructor() {
        this.client = axios.create({
            baseURL: appConfig.mainApi.baseUrl,
            headers: {
                'Content-Type': 'application/json',
                'User-Agent': 'Summary-API/1.0'
            }
        });

        this.setupInterceptors();
    }

    private async getFreshToken(): Promise<string> {
        const timeUntilExpiry = this.tokenExpiry - Date.now();

        if (this.currentToken && timeUntilExpiry > this.TOKEN_REFRESH_BUFFER) {
            logger.debug('Using cached JWT token', {
                timeUntilExpiry: `${Math.round(timeUntilExpiry / 1000)}s`
            });
            return this.currentToken;
        }

        this.currentToken = JWTUtils.generateInternalToken('summary-api');

        const payload = JWTUtils.verifyInternalToken(this.currentToken, process.env.JWT_ISSUER);
        this.tokenExpiry = payload.exp * 1000;

        logger.info('Generated new JWT token for internal API', {
            tokenLength: this.currentToken.length,
            expiresAt: new Date(this.tokenExpiry).toISOString()
        });

        return this.currentToken;
    }

    private setupInterceptors(): void {
        this.client.interceptors.request.use(
            async (config) => {
                try {
                    const token = await this.getFreshToken();
                    config.headers.Authorization = `Bearer ${token}`;

                    const fullUrl = `${config.baseURL}${config.url}`;
                    logger.info(`Making authenticated request to: ${fullUrl}`, {
                        method: config.method,
                        baseURL: config.baseURL,
                        url: config.url,
                        fullUrl
                    });
                } catch (error) {
                    logger.error('Failed to get JWT token:', error);
                    throw error;
                }
                return config;
            },
            (error) => {
                logger.error('Request interceptor error:', error);
                return Promise.reject(error);
            }
        );

        this.client.interceptors.response.use(
            (response) => {
                logger.debug(`Response received: ${response.status}`, {
                    url: response.config.url,
                    status: response.status
                });
                return response;
            },
            (error) => {
                logger.error('API Response error:', {
                    url: error.config?.url,
                    status: error.response?.status,
                    statusText: error.response?.statusText,
                    responseData: error.response?.data,
                    message: error.message,
                    code: error.code
                });

                if (error.response?.status === 401) {
                    logger.warn('Authentication failed, resetting token cache');
                    this.currentToken = null;
                    this.tokenExpiry = 0;
                }

                return Promise.reject(error);
            }
        );
    }

    async get<T>(url: string): Promise<T> {
        try {
            const response = await this.client.get<T>(url);
            return response.data;
        } catch (error: any) {
            if (error.response) {
                logger.error('Axios error with response:', {
                    url,
                    status: error.response.status,
                    statusText: error.response.statusText,
                    data: error.response.data
                });
                if (error.response.data && typeof error.response.data === 'object') {
                    throw error.response.data;
                }
            }
            throw error;
        }
    }
}