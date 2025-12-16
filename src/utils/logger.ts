export class Logger {
    private readonly level: string;

    constructor(level: string = 'info') {
        this.level = level;
    }

    private shouldLog(level: string): boolean {
        const levels = ['error', 'warn', 'info', 'debug'];
        return levels.indexOf(level) <= levels.indexOf(this.level);
    }

    public info(message: string, meta?: any): void {
        if (this.shouldLog('info')) {
            console.log(`[INFO] ${message}`, meta || '');
        }
    }

    public error(message: string, error?: any): void {
        if (this.shouldLog('error')) {
            console.error(`[ERROR] ${message}`, error || '');
        }
    }

    public warn(message: string, meta?: any): void {
        if (this.shouldLog('warn')) {
            console.warn(`[WARN] ${message}`, meta || '');
        }
    }

    public debug(message: string, meta?: any): void {
        if (this.shouldLog('debug')) {
            console.debug(`[DEBUG] ${message}`, meta || '');
        }
    }
}

export const logger = new Logger(process.env.LOG_LEVEL || 'info');