import Ably from "ably";

const channelName = "restaurant";
let ably: Ably.Rest | undefined;

function getAbly() {
  if (!ably) {
    const apiKey = process.env.ABLY_API_KEY;
    if (!apiKey) throw new Error("ABLY_API_KEY is not configured");
    ably = new Ably.Rest(apiKey);
  }
  return ably;
}

export async function emitDataChanged(scope: string) {
  try {
    await getAbly()
      .channels.get(channelName)
      .publish("restaurant:data-changed", { scope });
  } catch (error: unknown) {
    console.error("Ably publish error:", error);
  }
}
