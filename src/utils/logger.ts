const isDevelopment = process.env.NODE_ENV === 'development';
const isProduction = process.env.NODE_ENV === 'production';

export class Logger {
    private readonly level: string;

    constructor(level: string = 'info') {
        this.level = level;
    }

    private shouldLog(level: string): boolean {
        const levels = ['error', 'warn', 'info', 'debug'];
        return levels.indexOf(level) <= levels.indexOf(this.level);
    }

    private shouldOutput(): boolean {
        // В production показываем только error и warn
        if (isProduction) {
            return false; // Логи будут выводиться только через shouldLog для error/warn
        }
        // В development показываем все логи
        return isDevelopment;
    }

    public info(message: string, meta?: any): void {
        if (this.shouldLog('info') && this.shouldOutput()) {
            console.log(`[INFO] ${message}`, meta || '');
        }
    }

    public error(message: string, error?: any): void {
        // Error всегда логируем, но в production без конфиденциальных данных
        if (this.shouldLog('error')) {
            if (isProduction) {
                // В production логируем только сообщение без метаданных
                console.error(`[ERROR] ${message}`);
            } else {
                console.error(`[ERROR] ${message}`, error || '');
            }
        }
    }

    public warn(message: string, meta?: any): void {
        // Warn логируем в production, но без метаданных
        if (this.shouldLog('warn')) {
            if (isProduction) {
                console.warn(`[WARN] ${message}`);
            } else {
                console.warn(`[WARN] ${message}`, meta || '');
            }
        }
    }

    public debug(message: string, meta?: any): void {
        // Debug только в development
        if (this.shouldLog('debug') && isDevelopment) {
            console.debug(`[DEBUG] ${message}`, meta || '');
        }
    }
}

export const logger = new Logger(process.env.LOG_LEVEL || 'info');