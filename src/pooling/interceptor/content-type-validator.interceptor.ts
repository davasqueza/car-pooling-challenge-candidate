import { BadRequestException, CallHandler, ExecutionContext, NestInterceptor } from '@nestjs/common';
import { Observable } from 'rxjs';

export class ContentTypeValidator implements NestInterceptor {
  constructor(private acceptedContentType: string) {}

  intercept(context: ExecutionContext, next: CallHandler): Observable<any> {
    const headers = context.switchToHttp().getRequest().headers;
    const requestContentType = headers['content-type'];

    if (requestContentType !== this.acceptedContentType) {
      const message = `Expected content-type equals to ${this.acceptedContentType}, received ${requestContentType}`;
      throw new BadRequestException(message);
    }

    return next.handle();
  }

}
