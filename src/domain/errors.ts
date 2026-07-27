export type AppErrorCode =
  | "validation_error"
  | "not_found"
  | "upstream"
  | "rate_limited"
  | "invalid_payload"
  | "config_error";

export class AppError extends Error {
  readonly code: AppErrorCode;
  readonly status: number;

  constructor(code: AppErrorCode, message: string, status: number) {
    super(message);
    this.name = "AppError";
    this.code = code;
    this.status = status;
  }
}
