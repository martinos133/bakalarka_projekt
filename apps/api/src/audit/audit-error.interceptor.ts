import {
  Injectable,
  NestInterceptor,
  ExecutionContext,
  CallHandler,
  HttpException,
} from '@nestjs/common';
import { Observable, throwError } from 'rxjs';
import { catchError } from 'rxjs/operators';
import { AuditService } from './audit.service';

@Injectable()
export class AuditErrorInterceptor implements NestInterceptor {
  constructor(private readonly auditService: AuditService) {}

  intercept(context: ExecutionContext, next: CallHandler): Observable<any> {
    const req = context.switchToHttp().getRequest();
    const method = req.method;
    const url = req.url;

    return next.handle().pipe(
      catchError((error) => {
        const statusCode = error instanceof HttpException ? error.getStatus() : 500;

        if (statusCode >= 500) {
          const ip = this.resolveIp(req);
          const userAgent = req.headers?.['user-agent'];

          this.auditService.log({
            action: 'API_ERROR',
            severity: 'ERROR',
            userId: req.user?.userId,
            userEmail: req.user?.email,
            ip,
            userAgent,
            resource: `${method} ${url}`,
            success: false,
            errorMessage: error.message || 'Unknown server error',
            details: {
              statusCode,
              stack: error.stack?.split('\n').slice(0, 5),
              body: method !== 'GET' ? this.sanitizeBody(req.body) : undefined,
            },
          });
        }

        return throwError(() => error);
      }),
    );
  }

  private resolveIp(req: any): string {
    let raw = req.headers?.['x-forwarded-for'] || req.ip || req.connection?.remoteAddress || '';
    if (typeof raw === 'string' && raw.includes(',')) raw = raw.split(',')[0].trim();
    if (raw === '::1' || raw === '::ffff:127.0.0.1') raw = '127.0.0.1';
    if (raw.startsWith('::ffff:')) raw = raw.replace('::ffff:', '');
    return raw;
  }

  private sanitizeBody(body: any): any {
    if (!body) return undefined;
    const sanitized = { ...body };
    const sensitiveKeys = ['password', 'token', 'secret', 'authorization'];
    for (const key of Object.keys(sanitized)) {
      if (sensitiveKeys.some((s) => key.toLowerCase().includes(s))) {
        sanitized[key] = '***';
      }
    }
    return sanitized;
  }
}
