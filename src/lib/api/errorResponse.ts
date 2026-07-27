import { NextResponse } from "next/server";

import { AppError } from "@/domain/errors";

type ApiErrorBody = {
  error: {
    code: string;
    message: string;
  };
};

/** Map thrown errors to the shared JSON error envelope. */
export function toErrorResponse(error: unknown): NextResponse<ApiErrorBody> {
  if (error instanceof AppError) {
    return NextResponse.json(
      {
        error: {
          code: error.code,
          message: error.message,
        },
      },
      { status: error.status },
    );
  }

  return NextResponse.json(
    {
      error: {
        code: "upstream",
        message: "Unexpected server error.",
      },
    },
    { status: 500 },
  );
}
