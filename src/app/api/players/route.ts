import { NextResponse } from "next/server";
import { z } from "zod";

import { toErrorResponse } from "@/lib/api/errorResponse";
import { searchQuerySchema } from "@/lib/api/schemas";
import { createBalldontlieAdapter } from "@/nba/balldontlie/client";

const querySchema = z.object({
  q: searchQuerySchema,
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
    return toErrorResponse(error);
  }
}
