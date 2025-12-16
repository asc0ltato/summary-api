import jwt from 'jsonwebtoken';
import { logger } from './logger';

export interface JWTInternalPayload {
    iss: string;
    aud: string;
    sub: string;
    iat: number;
    exp: number;
}

export class JWTUtils {
    private static readonly SECRET = process.env.JWT_SECRET;
    private static readonly ISSUER = process.env.JWT_ISSUER;
    private static readonly AUDIENCE = process.env.JWT_AUDIENCE;
    private static readonly TOKEN_TTL = 15 * 60;

    static generateInternalToken(serviceName: string): string {
        if (!this.SECRET) {
            throw new Error('JWT_SECRET not configured');
        }

        const payload: JWTInternalPayload = {
            iss: this.ISSUER!,
            aud: this.AUDIENCE!,
            sub: serviceName,
            iat: Math.floor(Date.now() / 1000),
            exp: Math.floor(Date.now() / 1000) + this.TOKEN_TTL
        };

        logger.debug(`Generated JWT token for ${serviceName}`, {
            issuer: payload.iss,
            audience: payload.aud,
            expiresIn: `${this.TOKEN_TTL} seconds`
        });

        return jwt.sign(payload, this.SECRET, { algorithm: 'HS256' });
    }

    static verifyInternalToken(token: string, expectedIssuer?: string): JWTInternalPayload {
        if (!this.SECRET) {
            throw new Error('JWT_SECRET not configured');
        }

        try {
            const decoded = jwt.verify(token, this.SECRET, {
                algorithms: ['HS256'],
                audience: this.AUDIENCE,
                issuer: expectedIssuer
            }) as JWTInternalPayload;

            logger.debug('JWT token verified successfully', {
                issuer: decoded.iss,
                audience: decoded.aud,
                subject: decoded.sub,
                expiresAt: new Date(decoded.exp * 1000).toISOString()
            });

            return decoded;

        } catch (error) {
            logger.error('JWT token verification failed:', error);
            throw new Error('Invalid internal API token');
        }
    }
}