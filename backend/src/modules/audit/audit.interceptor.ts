import { Injectable, NestInterceptor, ExecutionContext, CallHandler, Logger } from '@nestjs/common';
import { Observable } from 'rxjs';
import { tap, catchError } from 'rxjs/operators';
import { AuditService } from './audit.service';
import { Reflector } from '@nestjs/core';
import { AUDIT_ACTION_KEY, AUDIT_ENTITY_KEY } from './audit.decorator';

@Injectable()
export class AuditInterceptor implements NestInterceptor {
  private readonly logger = new Logger(AuditInterceptor.name);

  constructor(
    private readonly auditService: AuditService,
    private readonly reflector: Reflector,
  ) {}

  intercept(context: ExecutionContext, next: CallHandler): Observable<any> {
    const request = context.switchToHttp().getRequest();
    const handler = context.getHandler();
    const className = context.getClass();

    const action = this.reflector.getAllAndOverride<string>(AUDIT_ACTION_KEY, [handler, className]);
    const entity = this.reflector.getAllAndOverride<string>(AUDIT_ENTITY_KEY, [handler, className]);

    if (!action) return next.handle();

    const startTime = Date.now();
    const { user, method, url, ip, headers } = request;
    const userAgent = headers['user-agent'] || '';

    return next.handle().pipe(
      tap(async (response) => {
        const duration = Date.now() - startTime;
        await this.auditService.log({
          userId: user?.id,
          userEmail: user?.email,
          userRole: user?.role,
          action,
          entity,
          entityId: request.params?.id,
          ipAddress: ip,
          userAgent,
          endpoint: url,
          method,
          statusCode: 200,
          duration,
          status: 'success',
          newValues: typeof response === 'object' ? response : { data: response },
        });
      }),
      catchError(async (error) => {
        const duration = Date.now() - startTime;
        await this.auditService.log({
          userId: user?.id,
          userEmail: user?.email,
          userRole: user?.role,
          action: `${action}.failed`,
          entity,
          entityId: request.params?.id,
          ipAddress: ip,
          userAgent,
          endpoint: url,
          method,
          statusCode: error.status || 500,
          duration,
          status: 'error',
          errorMessage: error.message,
        });
        throw error;
      }),
    );
  }
}
