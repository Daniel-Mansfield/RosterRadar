import { NextResponse } from "next/server";
import { z } from "zod";

import { toErrorResponse } from "@/lib/api/errorResponse";
import { loadDossier } from "@/nba/loadDossier";

const paramsSchema = z.object({
  id: z.coerce.number().int().positive(),
});

const querySchema = z.object({
  season: z.coerce.number().int().min(2015).max(2030).optional(),
});

type RouteContext = {
  params: Promise<{ id: string }>;
};

/**
 * Role-fit dossier for an acquisition (or any) BALLDONTLIE player id.
 * GET /api/dossier/[id]?season=
 */
export async function GET(
  request: Request,
  context: RouteContext,
): Promise<NextResponse> {
  const rawParams = await context.params;
  const parsedParams = paramsSchema.safeParse(rawParams);
  if (!parsedParams.success) {
    return NextResponse.json(
      {
        error: {
          code: "validation_error" as const,
          message: "Path param id must be a positive integer.",
        },
      },
      { status: 400 },
    );
  }

  const { searchParams } = new URL(request.url);
  const parsedQuery = querySchema.safeParse({
    season: searchParams.get("season") ?? undefined,
  });
  if (!parsedQuery.success) {
    return NextResponse.json(
      {
        error: {
          code: "validation_error" as const,
          message: "Query param season must be a valid year.",
        },
      },
      { status: 400 },
    );
  }

  try {
    const dossier = await loadDossier(
      parsedParams.data.id,
      parsedQuery.data.season,
    );
    return NextResponse.json({ dossier });
  } catch (error) {
    return toErrorResponse(error);
  }
}
