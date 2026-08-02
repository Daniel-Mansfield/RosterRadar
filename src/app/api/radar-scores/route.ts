import { NextResponse } from "next/server";
import { z } from "zod";

import { RADAR_POOL } from "@/nba/radar/radarPool";
import { pillarIdSchema } from "@/lib/api/dossierSchema";
import { toErrorResponse } from "@/lib/api/errorResponse";
import { loadPillarScores } from "@/nba/loadPillarScores";
import { PILLAR_LABELS } from "@/scoring/composeDossier";

const MAX_RADAR_SCORE_IDS = RADAR_POOL.length;

const querySchema = z.object({
  pillar: pillarIdSchema,
  ids: z
    .string()
    .min(1)
    .transform((raw) => raw.split(",").map((part) => Number(part.trim())))
    .pipe(
      z
        .array(z.number().int().positive())
        .min(1)
        .max(MAX_RADAR_SCORE_IDS)
        .refine((ids) => new Set(ids).size === ids.length, {
          message: "ids must be unique",
        }),
    ),
});

/**
 * Lightweight pillar percentiles for the current Radar shortlist.
 * GET /api/radar-scores?pillar=disruption&ids=1,2,3,…
 *
 * Season-line only (no game-log evidence) so pillar sort stays cheap.
 */
export async function GET(request: Request): Promise<NextResponse> {
  const { searchParams } = new URL(request.url);
  const parsed = querySchema.safeParse({
    pillar: searchParams.get("pillar") ?? "",
    ids: searchParams.get("ids") ?? "",
  });

  if (!parsed.success) {
    return NextResponse.json(
      {
        error: {
          code: "validation_error" as const,
          message: `Query needs pillar=<PillarId> and ids=1–${MAX_RADAR_SCORE_IDS} unique positive integers.`,
        },
      },
      { status: 400 },
    );
  }

  try {
    const { pillar, ids } = parsed.data;
    const scores = await loadPillarScores(ids, pillar);
    return NextResponse.json({
      pillar: { id: pillar, label: PILLAR_LABELS[pillar] },
      scores,
    });
  } catch (error) {
    return toErrorResponse(error);
  }
}
