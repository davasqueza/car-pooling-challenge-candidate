import { ArgumentsHost, Catch, ExceptionFilter, HttpStatus, NotFoundException } from '@nestjs/common';
import { Request, Response } from 'express';

@Catch(NotFoundException)
export class MethodNotAllowedFilter implements ExceptionFilter {
  catch(exception: NotFoundException, host: ArgumentsHost) {
    const ctx = host.switchToHttp();
    const response = ctx.getResponse<Response>();
    const request = ctx.getRequest<Request>();

    const expectedMessage = `Cannot ${request.method.toUpperCase()}`;
    const currentMessage = exception.getResponse()['message'];

    if (currentMessage?.includes(expectedMessage)) {
      response.status(HttpStatus.METHOD_NOT_ALLOWED).send();
      return;
    }

    response.status(exception.getStatus()).send();
  }
}
