/**
 * Helper function to retrieve KOT (Kitchen Order Ticket) number.
 * Reads the KOT number directly fetched from the Database.
 */
export function getKotNumber(
  order: { kotNumber?: number | null }
): number {
  if (typeof order?.kotNumber === "number" && order.kotNumber > 0) {
    return order.kotNumber;
  }
  return 1;
}

/**
 * Formats the KOT display string for UI components (e.g., "KOT #01", "KOT #05", "KOT #12").
 */
export function formatKotDisplay(
  order: { kotNumber?: number | null }
): string {
  const kotNum = getKotNumber(order);
  const formattedNum = kotNum < 10 ? `0${kotNum}` : `${kotNum}`;
  return `KOT #${formattedNum}`;
}
