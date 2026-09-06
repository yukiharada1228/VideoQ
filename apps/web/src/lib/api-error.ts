/** Application-level error shared by raw HTTP and tRPC clients. */
export class ApiError extends Error {
  code: string;
  params?: Record<string, unknown>;
  details?: unknown;

  constructor(message: string, code: string, params?: Record<string, unknown>, details?: unknown) {
    super(message);
    this.name = 'ApiError';
    this.code = code;
    this.params = params;
    this.details = details;
  }
}
