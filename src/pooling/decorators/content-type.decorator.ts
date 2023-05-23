import { applyDecorators, UseInterceptors } from '@nestjs/common';
import { ContentTypeValidator } from '../interceptor/content-type-validator.interceptor';

export function AcceptFormURLEncoded() {
  const validator = new ContentTypeValidator('application/x-www-form-urlencoded');
  return applyDecorators(UseInterceptors(validator));
}

export function AcceptJSON() {
  const validator = new ContentTypeValidator('application/json');
  return applyDecorators(UseInterceptors(validator));
}
