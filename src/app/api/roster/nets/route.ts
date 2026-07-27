import { NextResponse } from "next/server";

import { AppError } from "@/domain/player";
import { createBalldontlieAdapter } from "@/nba/balldontlie/client";

/** GET /api/roster/nets — curated Nets roster for the home court view. */
export async function GET(): Promise<NextResponse> {
  try {
    const nba = createBalldontlieAdapter();
    const roster = await nba.getNetsRoster();
    return NextResponse.json({ roster });
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
