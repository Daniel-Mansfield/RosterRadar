import { NextResponse } from "next/server";
import { z } from "zod";

import { toErrorResponse } from "@/lib/api/errorResponse";
import { loadDossier } from "@/nba/loadDossier";
import { LINEUP_SIZE, composeTeamFit } from "@/scoring/composeTeamFit";

const idsSchema = z
  .string()
  .min(1)
  .transform((raw) => raw.split(",").map((part) => Number(part.trim())))
  .pipe(
    z
      .array(z.number().int().positive())
      .min(1)
      .max(LINEUP_SIZE)
      .refine((ids) => new Set(ids).size === ids.length, {
        message: "ids must be unique",
      }),
  );

/**
 * Lineup-level fit read for up to five BALLDONTLIE player ids.
 * GET /api/team-fit?ids=1,2,3,4,5
 *
 * Each id resolves through the same cached dossier pipeline the drawer uses,
 * so a cold call also pre-warms the starters' individual dossiers.
 */
export async function GET(request: Request): Promise<NextResponse> {
  const { searchParams } = new URL(request.url);
  const parsed = idsSchema.safeParse(searchParams.get("ids") ?? "");
  if (!parsed.success) {
    return NextResponse.json(
      {
        error: {
          code: "validation_error" as const,
          message: `Query param ids must be 1–${LINEUP_SIZE} unique positive integers, comma-separated.`,
        },
      },
      { status: 400 },
    );
  }

  try {
    const dossiers = await Promise.all(
      parsed.data.map((id) => loadDossier(id)),
    );
    return NextResponse.json({ teamFit: composeTeamFit(dossiers) });
  } catch (error) {
    return toErrorResponse(error);
  }
}
