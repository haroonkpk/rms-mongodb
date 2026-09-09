export function isMenuItemAvailable(
  manuallyAvailable: boolean,
  rawIngredients: unknown,
  stockByInventoryId: ReadonlyMap<string, number>,
) {
  if (!manuallyAvailable) return false;
  if (!rawIngredients) return true;
  if (!Array.isArray(rawIngredients)) return false;

  return rawIngredients.every((ingredient) => {
    if (!ingredient || typeof ingredient !== "object") return false;

    const inventoryItemId = (ingredient as { inventoryItemId?: unknown })
      .inventoryItemId;
    const quantityRequired = Number(
      (ingredient as { quantityRequired?: unknown }).quantityRequired,
    );

    if (
      typeof inventoryItemId !== "string" ||
      !inventoryItemId ||
      quantityRequired <= 0
    ) {
      return false;
    }

    const availableQuantity = stockByInventoryId.get(inventoryItemId);
    return (
      availableQuantity !== undefined && availableQuantity >= quantityRequired
    );
  });
}
