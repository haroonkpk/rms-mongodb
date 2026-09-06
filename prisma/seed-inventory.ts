import "dotenv/config";
import { prisma } from "../src/lib/prisma";
import { InventoryUnit, StockMovementType } from "./generated";

async function seedInventory() {
  console.log("🌱 Seeding Inventory, Recipes & Stock Management sample data...");

  // 1. Inventory Raw Material Categories
  const categoriesData = [
    { name: "Dairy & Eggs", description: "Mozzarella Cheese, Butter, Cream, Eggs, Milk" },
    { name: "Meat & Poultry", description: "Chicken Boneless, Beef Patty, Mince" },
    { name: "Fresh Produce", description: "Vegetables, Potatoes, Onions, Tomatoes, Lettuce" },
    { name: "Bakery & Buns", description: "Burger Buns, Pizza Dough, Sandwich Bread" },
    { name: "Spices & Condiments", description: "Salt, Black Pepper, Cooking Oils, Pizza Sauce, Mayonnaise" },
    { name: "Packaging & Disposable", description: "Burger Boxes, Cups, Straws, Napkins" },
  ];

  const categoryMap = new Map<string, string>();

  for (const cat of categoriesData) {
    const existing = await prisma.inventoryCategory.findUnique({
      where: { name: cat.name },
    });

    if (existing) {
      categoryMap.set(cat.name, existing.id);
    } else {
      const created = await prisma.inventoryCategory.create({
        data: cat,
      });
      categoryMap.set(cat.name, created.id);
    }
  }
  console.log(`✅ Created/verified ${categoryMap.size} inventory categories.`);

  // 2. Raw Material Items
  const itemsData = [
    {
      name: "Chicken Boneless",
      sku: "RAW-[CHK]-001",
      categoryName: "Meat & Poultry",
      unit: InventoryUnit.KG,
      quantity: 50.0,
      minStockLevel: 10.0,
      unitCost: 1200.0,
    },
    {
      name: "Mozzarella Cheese",
      sku: "RAW-[CHS]-002",
      categoryName: "Dairy & Eggs",
      unit: InventoryUnit.KG,
      quantity: 20.0,
      minStockLevel: 5.0,
      unitCost: 1900.0,
    },
    {
      name: "Burger Buns",
      sku: "RAW-[BUN]-003",
      categoryName: "Bakery & Buns",
      unit: InventoryUnit.PIECE,
      quantity: 100.0,
      minStockLevel: 20.0,
      unitCost: 40.0,
    },
    {
      name: "Potato Fries (Frozen)",
      sku: "RAW-[FRS]-004",
      categoryName: "Fresh Produce",
      unit: InventoryUnit.KG,
      quantity: 35.0,
      minStockLevel: 8.0,
      unitCost: 450.0,
    },
    {
      name: "Cooking Oil",
      sku: "RAW-[OIL]-005",
      categoryName: "Spices & Condiments",
      unit: InventoryUnit.LITER,
      quantity: 40.0,
      minStockLevel: 10.0,
      unitCost: 550.0,
    },
    {
      name: "Pizza Sauce & Mayo",
      sku: "RAW-[SAC]-006",
      categoryName: "Spices & Condiments",
      unit: InventoryUnit.KG,
      quantity: 15.0,
      minStockLevel: 3.0,
      unitCost: 650.0,
    },
    {
      name: "Flour / Dough Base",
      sku: "RAW-[FLR]-007",
      categoryName: "Bakery & Buns",
      unit: InventoryUnit.KG,
      quantity: 25.0,
      minStockLevel: 5.0,
      unitCost: 150.0,
    },
  ];

  const itemMap = new Map<string, string>();

  for (const item of itemsData) {
    const categoryId = categoryMap.get(item.categoryName);
    if (!categoryId) continue;

    const existing = await prisma.inventoryItem.findFirst({
      where: { name: item.name },
    });

    if (existing) {
      itemMap.set(item.name, existing.id);
    } else {
      const created = await prisma.inventoryItem.create({
        data: {
          name: item.name,
          sku: item.sku,
          categoryId,
          unit: item.unit,
          quantity: item.quantity,
          minStockLevel: item.minStockLevel,
          unitCost: item.unitCost,
        },
      });

      itemMap.set(item.name, created.id);

      await prisma.stockMovement.create({
        data: {
          inventoryItemId: created.id,
          type: StockMovementType.PURCHASE_IN,
          quantityChange: item.quantity,
          previousQuantity: 0,
          newQuantity: item.quantity,
          reason: "Initial Raw Material Seeding",
        },
      });
    }
  }
  console.log(`✅ Created/verified ${itemMap.size} inventory items.`);

  // 3. Create Sample Stock Intake Batch
  const existingBatch = await prisma.stockIntakeBatch.findFirst({
    where: { batchNumber: "INTAKE-SEED-001" },
  });

  if (!existingBatch) {
    const chickenId = itemMap.get("Chicken Boneless");
    const cheeseId = itemMap.get("Mozzarella Cheese");
    const bunsId = itemMap.get("Burger Buns");

    if (chickenId && cheeseId && bunsId) {
      await prisma.stockIntakeBatch.create({
        data: {
          batchNumber: "INTAKE-SEED-001",
          notes: "Initial Restaurant Stock Intake Batch",
          totalAmount: 50 * 1200 + 20 * 1900 + 100 * 40,
          items: {
            create: [
              { inventoryItemId: chickenId, quantity: 50, unitCost: 1200, totalPrice: 60000 },
              { inventoryItemId: cheeseId, quantity: 20, unitCost: 1900, totalPrice: 38000 },
              { inventoryItemId: bunsId, quantity: 100, unitCost: 40, totalPrice: 4000 },
            ],
          },
        },
      });
      console.log("✅ Created initial Stock Intake Batch INTAKE-SEED-001");
    }
  }

  // 4. Link Recipe Ingredients Directly to Menu Items (JSON Array)
  const menuItems = await prisma.menuItem.findMany();

  const chickenId = itemMap.get("Chicken Boneless");
  const cheeseId = itemMap.get("Mozzarella Cheese");
  const bunId = itemMap.get("Burger Buns");
  const friesId = itemMap.get("Potato Fries (Frozen)");
  const oilId = itemMap.get("Cooking Oil");

  for (const menuItem of menuItems) {
    const lowerName = menuItem.name.toLowerCase();

    const ingredientsToSave: Array<{ inventoryItemId: string; quantityRequired: number }> = [];

    if (lowerName.includes("burger") || lowerName.includes("zinger")) {
      if (bunId) ingredientsToSave.push({ inventoryItemId: bunId, quantityRequired: 1 });
      if (chickenId) ingredientsToSave.push({ inventoryItemId: chickenId, quantityRequired: 0.15 });
      if (oilId) ingredientsToSave.push({ inventoryItemId: oilId, quantityRequired: 0.05 });
      if (cheeseId) ingredientsToSave.push({ inventoryItemId: cheeseId, quantityRequired: 0.02 });
    } else if (lowerName.includes("pizza") || lowerName.includes("tikka")) {
      if (cheeseId) ingredientsToSave.push({ inventoryItemId: cheeseId, quantityRequired: 0.18 });
      if (chickenId) ingredientsToSave.push({ inventoryItemId: chickenId, quantityRequired: 0.12 });
    } else if (lowerName.includes("fries") || lowerName.includes("loaded")) {
      if (friesId) ingredientsToSave.push({ inventoryItemId: friesId, quantityRequired: 0.25 });
      if (oilId) ingredientsToSave.push({ inventoryItemId: oilId, quantityRequired: 0.05 });
      if (cheeseId) ingredientsToSave.push({ inventoryItemId: cheeseId, quantityRequired: 0.03 });
    }

    if (ingredientsToSave.length > 0) {
      await prisma.menuItem.update({
        where: { id: menuItem.id },
        data: {
          ingredients: ingredientsToSave,
        },
      });
      console.log(`🔗 Updated ${ingredientsToSave.length} JSON recipe ingredients on "${menuItem.name}"`);
    }
  }

  // 5. Seed AddOn Recipes
  const addOns = await prisma.addOn.findMany();
  for (const addon of addOns) {
    const lower = addon.name.toLowerCase();
    const addOnIngs: Array<{ inventoryItemId: string; quantityRequired: number }> = [];

    if (lower.includes("cheese") && cheeseId) {
      addOnIngs.push({ inventoryItemId: cheeseId, quantityRequired: 0.03 });
    } else if (lower.includes("patty") && chickenId) {
      addOnIngs.push({ inventoryItemId: chickenId, quantityRequired: 0.12 });
    }

    if (addOnIngs.length > 0) {
      await prisma.addOn.update({
        where: { id: addon.id },
        data: { ingredients: addOnIngs },
      });
      console.log(`🔗 Updated ${addOnIngs.length} JSON ingredients on AddOn "${addon.name}"`);
    }
  }

  console.log("🎉 Inventory & Recipe Seeding Completed Successfully!");
}

seedInventory()
  .catch((e) => {
    console.error("❌ Seeding failed:", e);
    process.exit(1);
  })
  .finally(async () => {
    await prisma.$disconnect();
  });
