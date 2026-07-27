import { z } from "zod";
import { NextResponse } from "next/server";

import { AppError } from "@/domain/player";
import { createBalldontlieAdapter } from "@/nba/balldontlie/client";

const querySchema = z.object({
  q: z.string().trim().min(2).max(64),
});

/**
 * Acquisition search: non-Nets players only (IDENTITY.md).
 * GET /api/players?q=
 */
export async function GET(request: Request): Promise<NextResponse> {
  const { searchParams } = new URL(request.url);
  const parsedQuery = querySchema.safeParse({ q: searchParams.get("q") ?? "" });

  if (!parsedQuery.success) {
    return NextResponse.json(
      {
        error: {
          code: "validation_error" as const,
          message: "Query param q is required (2–64 characters).",
        },
      },
      { status: 400 },
    );
  }

  try {
    const nba = createBalldontlieAdapter();
    const players = await nba.searchPlayers({
      query: parsedQuery.data.q,
      excludeNets: true,
    });
    return NextResponse.json({ players });
  } catch (error) {
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
          code: "upstream" as const,
          message: "Unexpected server error.",
        },
      },
      { status: 500 },
    );
  }
}
