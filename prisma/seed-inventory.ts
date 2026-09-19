import "dotenv/config";
import { prisma } from "../src/lib/prisma";
import { InventoryUnit, StockMovementType } from "./generated";
import bcrypt from "bcryptjs";

async function seedAdmin() {
  const email = process.env.ADMIN_EMAIL || "admin@restaurant.local";
  const password = process.env.ADMIN_PASSWORD || "Admin@12345";
  const fullName = process.env.ADMIN_NAME || "Restaurant Admin";
  const existingAdmin = await prisma.user.findUnique({ where: { email } });

  if (existingAdmin) {
    await prisma.user.update({
      where: { id: existingAdmin.id },
      data: { role: "ADMIN", fullName },
    });
    console.log(`✅ Verified admin user: ${email}`);
    return;
  }

  await prisma.user.create({
    data: {
      email,
      fullName,
      password: await bcrypt.hash(password, 10),
      role: "ADMIN",
    },
  });
  console.log(`✅ Created admin user: ${email}`);
}

async function seedMenu() {
  const categoryNames = ["Burgers", "Pizza", "Sides", "Drinks"];
  const categoryMap = new Map<string, string>();

  for (const name of categoryNames) {
    const existing = await prisma.category.findUnique({ where: { name } });
    const category =
      existing || (await prisma.category.create({ data: { name } }));
    categoryMap.set(name, category.id);
  }

  const addOnData = [
    { name: "Extra Cheese", price: 180 },
    { name: "Extra Chicken", price: 300 },
    { name: "Jalapenos", price: 80 },
    { name: "Mushrooms", price: 120 },
    { name: "Extra Patty", price: 350 },
  ];
  const addOnMap = new Map<string, string>();

  for (const addOn of addOnData) {
    const existing = await prisma.addOn.findFirst({
      where: { name: addOn.name },
    });
    const record =
      existing ||
      (await prisma.addOn.create({
        data: { ...addOn, isAvailable: true, menuItemIds: [] },
      }));
    addOnMap.set(addOn.name, record.id);
  }

  const menuItems = [
    {
      name: "Classic Chicken Burger",
      category: "Burgers",
      basePrice: 650,
      description: "Crispy chicken fillet with lettuce and house sauce.",
      addOns: ["Extra Cheese", "Extra Chicken", "Jalapenos"],
    },
    {
      name: "Zinger Burger",
      category: "Burgers",
      basePrice: 750,
      description: "Spicy crispy chicken burger with signature sauce.",
      addOns: ["Extra Cheese", "Extra Patty", "Jalapenos"],
    },
    {
      name: "Beef Smash Burger",
      category: "Burgers",
      basePrice: 900,
      description: "Double beef smash patty with cheese and onions.",
      addOns: ["Extra Cheese", "Extra Patty", "Mushrooms"],
    },
    {
      name: "Chicken Tikka Pizza",
      category: "Pizza",
      basePrice: 1400,
      description: "Chicken tikka, mozzarella, onions and peppers.",
      hasSizes: true,
      sizes: [
        { name: "Small", price: 0 },
        { name: "Medium", price: 500 },
        { name: "Large", price: 1000 },
      ],
      addOns: ["Extra Cheese", "Extra Chicken", "Jalapenos"],
    },
    {
      name: "Fajita Pizza",
      category: "Pizza",
      basePrice: 1500,
      description: "Fajita chicken, mushrooms, peppers and mozzarella.",
      hasSizes: true,
      sizes: [
        { name: "Small", price: 0 },
        { name: "Medium", price: 550 },
        { name: "Large", price: 1100 },
      ],
      addOns: ["Extra Cheese", "Extra Chicken", "Mushrooms"],
    },
    {
      name: "Loaded Fries",
      category: "Sides",
      basePrice: 550,
      description: "Crispy fries loaded with cheese and chicken.",
      addOns: ["Extra Cheese", "Extra Chicken", "Jalapenos"],
    },
    {
      name: "Regular Fries",
      category: "Sides",
      basePrice: 300,
      description: "Golden crispy seasoned fries.",
      addOns: ["Jalapenos"],
    },
    {
      name: "Chicken Wings",
      category: "Sides",
      basePrice: 700,
      description: "Crispy chicken wings with your choice of sauce.",
      addOns: ["Extra Chicken", "Jalapenos"],
    },
    {
      name: "Mint Margarita",
      category: "Drinks",
      basePrice: 350,
      description: "Refreshing mint and lemon cooler.",
      addOns: [],
    },
    {
      name: "Cold Drink",
      category: "Drinks",
      basePrice: 180,
      description: "Chilled carbonated soft drink.",
      addOns: [],
    },
  ];

  const menuItemIdsByAddOn = new Map<string, string[]>();
  for (const item of menuItems) {
    const categoryId = categoryMap.get(item.category);
    if (!categoryId) continue;
    const addOnIds = item.addOns.flatMap((name) => {
      const id = addOnMap.get(name);
      if (!id) return [];
      const ids = menuItemIdsByAddOn.get(name) || [];
      menuItemIdsByAddOn.set(name, ids);
      return [id];
    });
    const existing = await prisma.menuItem.findFirst({
      where: { name: item.name },
    });
    const data = {
      categoryId,
      description: item.description,
      basePrice: item.basePrice,
      isAvailable: true,
      hasSizes: item.hasSizes ?? false,
      sizes: item.sizes ?? null,
      addOnIds,
    };
    const record = existing
      ? await prisma.menuItem.update({ where: { id: existing.id }, data })
      : await prisma.menuItem.create({ data: { name: item.name, ...data } });

    for (const addOnName of item.addOns) {
      const ids = menuItemIdsByAddOn.get(addOnName) || [];
      ids.push(record.id);
      menuItemIdsByAddOn.set(addOnName, ids);
    }
  }

  for (const [name, itemIds] of menuItemIdsByAddOn) {
    const addOnId = addOnMap.get(name);
    if (addOnId) {
      await prisma.addOn.update({
        where: { id: addOnId },
        data: { menuItemIds: [...new Set(itemIds)] },
      });
    }
  }

  console.log(
    `✅ Created/verified ${categoryMap.size} menu categories, ${addOnMap.size} add-ons, and ${menuItems.length} menu items.`,
  );
}

async function seedInventory() {
  console.log(
    "🌱 Seeding Inventory, Recipes & Stock Management sample data...",
  );

  await seedAdmin();

  // 1. Inventory Raw Material Categories
  const categoriesData = [
    { name: "Dairy & Eggs" },
    { name: "Meat & Poultry" },
    { name: "Fresh Produce" },
    { name: "Bakery & Buns" },
    { name: "Spices & Condiments" },
    { name: "Packaging & Disposable" },
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
      categoryName: "Meat & Poultry",
      unit: InventoryUnit.KG,
      quantity: 50.0,
      minStockLevel: 10.0,
      unitCost: 1200.0,
    },
    {
      name: "Mozzarella Cheese",
      categoryName: "Dairy & Eggs",
      unit: InventoryUnit.KG,
      quantity: 20.0,
      minStockLevel: 5.0,
      unitCost: 1900.0,
    },
    {
      name: "Burger Buns",
      categoryName: "Bakery & Buns",
      unit: InventoryUnit.PIECE,
      quantity: 100.0,
      minStockLevel: 20.0,
      unitCost: 40.0,
    },
    {
      name: "Potato Fries (Frozen)",
      categoryName: "Fresh Produce",
      unit: InventoryUnit.KG,
      quantity: 35.0,
      minStockLevel: 8.0,
      unitCost: 450.0,
    },
    {
      name: "Cooking Oil",
      categoryName: "Spices & Condiments",
      unit: InventoryUnit.LITER,
      quantity: 40.0,
      minStockLevel: 10.0,
      unitCost: 550.0,
    },
    {
      name: "Pizza Sauce & Mayo",
      categoryName: "Spices & Condiments",
      unit: InventoryUnit.KG,
      quantity: 15.0,
      minStockLevel: 3.0,
      unitCost: 650.0,
    },
    {
      name: "Flour / Dough Base",
      categoryName: "Bakery & Buns",
      unit: InventoryUnit.KG,
      quantity: 25.0,
      minStockLevel: 5.0,
      unitCost: 150.0,
    },
    {
      name: "Beef Mince",
      categoryName: "Meat & Poultry",
      unit: InventoryUnit.KG,
      quantity: 25.0,
      minStockLevel: 5.0,
      unitCost: 1500.0,
    },
    {
      name: "Basmati Rice",
      categoryName: "Fresh Produce",
      unit: InventoryUnit.KG,
      quantity: 30.0,
      minStockLevel: 8.0,
      unitCost: 350.0,
    },
    {
      name: "Onions",
      categoryName: "Fresh Produce",
      unit: InventoryUnit.KG,
      quantity: 25.0,
      minStockLevel: 5.0,
      unitCost: 180.0,
    },
    {
      name: "Tomatoes",
      categoryName: "Fresh Produce",
      unit: InventoryUnit.KG,
      quantity: 20.0,
      minStockLevel: 5.0,
      unitCost: 220.0,
    },
    {
      name: "Yogurt",
      categoryName: "Dairy & Eggs",
      unit: InventoryUnit.KG,
      quantity: 15.0,
      minStockLevel: 3.0,
      unitCost: 300.0,
    },
    {
      name: "Ginger Garlic Paste",
      categoryName: "Spices & Condiments",
      unit: InventoryUnit.KG,
      quantity: 8.0,
      minStockLevel: 2.0,
      unitCost: 500.0,
    },
    {
      name: "Green Chilies",
      categoryName: "Fresh Produce",
      unit: InventoryUnit.KG,
      quantity: 3.0,
      minStockLevel: 0.5,
      unitCost: 450.0,
    },
    {
      name: "Fresh Coriander",
      categoryName: "Fresh Produce",
      unit: InventoryUnit.KG,
      quantity: 2.0,
      minStockLevel: 0.5,
      unitCost: 300.0,
    },
    {
      name: "Red Chili Powder",
      categoryName: "Spices & Condiments",
      unit: InventoryUnit.KG,
      quantity: 3.0,
      minStockLevel: 0.5,
      unitCost: 650.0,
    },
    {
      name: "Cumin Seeds",
      categoryName: "Spices & Condiments",
      unit: InventoryUnit.KG,
      quantity: 2.0,
      minStockLevel: 0.5,
      unitCost: 900.0,
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

  await seedMenu();

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
              {
                inventoryItemId: chickenId,
                quantity: 50,
                unitCost: 1200,
                totalPrice: 60000,
              },
              {
                inventoryItemId: cheeseId,
                quantity: 20,
                unitCost: 1900,
                totalPrice: 38000,
              },
              {
                inventoryItemId: bunsId,
                quantity: 100,
                unitCost: 40,
                totalPrice: 4000,
              },
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

    const ingredientsToSave: Array<{
      inventoryItemId: string;
      quantityRequired: number;
    }> = [];

    if (lowerName.includes("burger") || lowerName.includes("zinger")) {
      if (bunId)
        ingredientsToSave.push({ inventoryItemId: bunId, quantityRequired: 1 });
      if (chickenId)
        ingredientsToSave.push({
          inventoryItemId: chickenId,
          quantityRequired: 0.15,
        });
      if (oilId)
        ingredientsToSave.push({
          inventoryItemId: oilId,
          quantityRequired: 0.05,
        });
      if (cheeseId)
        ingredientsToSave.push({
          inventoryItemId: cheeseId,
          quantityRequired: 0.02,
        });
    } else if (lowerName.includes("pizza") || lowerName.includes("tikka")) {
      if (cheeseId)
        ingredientsToSave.push({
          inventoryItemId: cheeseId,
          quantityRequired: 0.18,
        });
      if (chickenId)
        ingredientsToSave.push({
          inventoryItemId: chickenId,
          quantityRequired: 0.12,
        });
    } else if (lowerName.includes("fries") || lowerName.includes("loaded")) {
      if (friesId)
        ingredientsToSave.push({
          inventoryItemId: friesId,
          quantityRequired: 0.25,
        });
      if (oilId)
        ingredientsToSave.push({
          inventoryItemId: oilId,
          quantityRequired: 0.05,
        });
      if (cheeseId)
        ingredientsToSave.push({
          inventoryItemId: cheeseId,
          quantityRequired: 0.03,
        });
    }

    if (ingredientsToSave.length > 0) {
      await prisma.menuItem.update({
        where: { id: menuItem.id },
        data: {
          ingredients: ingredientsToSave,
        },
      });
      console.log(
        `🔗 Updated ${ingredientsToSave.length} JSON recipe ingredients on "${menuItem.name}"`,
      );
    }
  }

  // 5. Seed AddOn Recipes
  const addOns = await prisma.addOn.findMany();
  for (const addon of addOns) {
    const lower = addon.name.toLowerCase();
    const addOnIngs: Array<{
      inventoryItemId: string;
      quantityRequired: number;
    }> = [];

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
      console.log(
        `🔗 Updated ${addOnIngs.length} JSON ingredients on AddOn "${addon.name}"`,
      );
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
