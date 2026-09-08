import dotenv from 'dotenv';

dotenv.config();

// Database connection and the models.
import { sequelize } from './config/database.js';
import './models/index.js';
import Business from './models/Business.js';
import Product from './models/Product.js';
import CustomerGroup from './models/CustomerGroup.js';

// Fill a fresh database with starting data. Safe to run twice.
async function seed() {
  // Make sure the tables exist first.
  await sequelize.sync();

  // 1. Create the default business.
  const businessName = process.env.BUSINESS_NAME || "Kiran's Grocery Store";
  const [business] = await Business.findOrCreate({
    where: { name: businessName },
    defaults: { name: businessName },
  });

  // 2. Create sample products.
  // Note how thin milk's margin is (50 vs 48) - that is why
  // discounting milk is dangerous.
  const productsData = [
    { name: 'Milk', sellingPrice: 50, costPrice: 48 },
    { name: 'Biscuits', sellingPrice: 50, costPrice: 30 },
    { name: 'Juice', sellingPrice: 100, costPrice: 60 },
    { name: 'Chocolate', sellingPrice: 60, costPrice: 38 },
  ];

  for (const data of productsData) {
    await Product.findOrCreate({
      where: { businessId: business.id, name: data.name },
      defaults: { ...data, businessId: business.id },
    });
  }

  // 3. Create the customer groups.
  const groupsData = [
    { name: 'Regular', description: 'Customers who buy frequently and consistently.' },
    { name: 'New', description: 'Customers who recently made their first purchase.' },
    { name: 'Inactive', description: 'Customers who have not purchased in a while.' },
    { name: 'High Spending', description: 'Customers who spend more than the average customer.' },
    { name: 'All Customers', description: 'Every customer who walks in.' },
  ];

  for (const data of groupsData) {
    await CustomerGroup.findOrCreate({ where: { name: data.name }, defaults: data });
  }

  console.log('Seed complete.');
  // Close the program successfully.
  process.exit(0);
}

// Run the seed; on failure, show the error and exit with failure.
seed().catch((err) => {
  console.error('Seed failed:', err);
  process.exit(1);
});