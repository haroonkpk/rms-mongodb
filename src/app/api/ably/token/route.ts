import Ably from "ably";
import { NextResponse } from "next/server";
import { getSession } from "@/lib/auth";

export async function POST() {
  const session = await getSession();
  if (!session || typeof session.userId !== "string") {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }

  const apiKey = process.env.ABLY_API_KEY;
  if (!apiKey) {
    return NextResponse.json(
      { error: "ABLY_API_KEY is not configured" },
      { status: 500 },
    );
  }

  const rest = new Ably.Rest(apiKey);
  const tokenRequest = await rest.auth.createTokenRequest({
    clientId: session.userId,
    capability: JSON.stringify({ restaurant: ["subscribe"] }),
  });

  return NextResponse.json(tokenRequest);
}
