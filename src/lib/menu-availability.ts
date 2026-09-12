export function isMenuItemAvailable(
  manuallyAvailable: boolean,
  rawIngredients: unknown,
  stockByInventoryId: ReadonlyMap<string, number>,
) {
  if (!manuallyAvailable) return false;
  if (rawIngredients === null || rawIngredients === undefined) return true;
  if (!Array.isArray(rawIngredients)) return false;
  if (rawIngredients.length === 0) return true;

  return rawIngredients.every((ingredient) => {
    if (!ingredient || typeof ingredient !== "object") return false;

    const inventoryItemId = (ingredient as { inventoryItemId?: unknown })
      .inventoryItemId;
    const quantityRequired = Number(
      (
        ingredient as {
          quantityRequired?: unknown;
        }
      ).quantityRequired,
    );

    if (
      typeof inventoryItemId !== "string" ||
      !inventoryItemId ||
      !Number.isFinite(quantityRequired) ||
      quantityRequired <= 0
    ) {
      return false;
    }

    const availableQuantity = stockByInventoryId.get(inventoryItemId);
    return (
      availableQuantity !== undefined &&
      Number.isFinite(availableQuantity) &&
      availableQuantity >= quantityRequired
    );
  });
}
