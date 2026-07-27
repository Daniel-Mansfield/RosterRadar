import { NextResponse } from "next/server";

import { toErrorResponse } from "@/lib/api/errorResponse";
import { loadNetsRoster } from "@/nba/loadNetsRoster";

/** GET /api/roster/nets — curated Nets roster for the home court view. */
export async function GET(): Promise<NextResponse> {
  try {
    const roster = await loadNetsRoster();
    return NextResponse.json({ roster });
  } catch (error) {
    return toErrorResponse(error);
  }
}
