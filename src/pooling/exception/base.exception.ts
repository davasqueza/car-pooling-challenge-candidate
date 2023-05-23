export class BaseException extends Error {
  constructor(
    message: string,
    public code?: string,
    public details?: string,
    public internalError?: Error,
  ) {
    super(message);
    if (internalError) {
      this.stack = internalError.stack;
    }
  }
}
