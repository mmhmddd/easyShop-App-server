// Seeds categories + products matching the mock data already in the
// Flutter app's CategoryService / ProductService, so the API returns
// something meaningful the moment it's wired up.
//
// Usage:  npm run seed
require('dotenv').config();
const mongoose = require('mongoose');
const connectDB = require('../config/db');
const Category = require('../models/Category');
const Product = require('../models/Product');
const slugify = require('../utils/slugify');

const categories = [
  { name: 'Shoes', icon: 'directions_walk_rounded' },
  { name: 'Clothes', icon: 'checkroom_rounded' },
  { name: 'Electronics', icon: 'headphones_rounded' },
  { name: 'Accessories', icon: 'watch_rounded' },
];

const productsByCategory = {
  Shoes: [
    { name: 'Nike Air Max', price: 2500, isBestSeller: true, rating: 4.5, reviewCount: 120 },
    { name: 'Running Sneakers', price: 1900, rating: 4.1, reviewCount: 44 },
    { name: 'Leather Boots', price: 3200, rating: 4.7, reviewCount: 88 },
  ],
  Clothes: [
    { name: 'Classic T-Shirt', price: 700, rating: 4.2, reviewCount: 64 },
    { name: 'Denim Jacket', price: 1600, rating: 4.4, reviewCount: 37 },
    { name: 'Winter Hoodie', price: 1200, rating: 4.0, reviewCount: 29 },
  ],
  Electronics: [
    { name: 'Wireless Headphones', price: 1800, isBestSeller: true, rating: 4.6, reviewCount: 98 },
    { name: 'Bluetooth Speaker', price: 1400, rating: 4.3, reviewCount: 52 },
    { name: 'Smartphone Stand', price: 250, rating: 3.9, reviewCount: 18 },
  ],
  Accessories: [
    { name: 'Smart Watch', price: 2300, isBestSeller: true, rating: 4.3, reviewCount: 51 },
    { name: 'Leather Wallet', price: 550, rating: 4.5, reviewCount: 40 },
    { name: 'Sunglasses', price: 480, rating: 4.1, reviewCount: 33 },
  ],
};

async function run() {
  await connectDB();
  console.log('Seeding...');

  await Product.deleteMany({});
  await Category.deleteMany({});

  const categoryDocs = {};
  for (const [i, c] of categories.entries()) {
    const doc = await Category.create({
      name: c.name,
      slug: slugify(c.name),
      icon: c.icon,
      sortOrder: i,
    });
    categoryDocs[c.name] = doc;
  }

  for (const [categoryName, items] of Object.entries(productsByCategory)) {
    for (const item of items) {
      await Product.create({
        name: item.name,
        slug: slugify(item.name),
        description: `${item.name} — great quality, great price.`,
        price: item.price,
        category: categoryDocs[categoryName]._id,
        stock: 50,
        rating: item.rating,
        reviewCount: item.reviewCount,
        isBestSeller: !!item.isBestSeller,
        images: [],
      });
    }
  }

  console.log('Seed complete:', {
    categories: Object.keys(categoryDocs).length,
    products: Object.values(productsByCategory).flat().length,
  });

  await mongoose.disconnect();
  process.exit(0);
}

run().catch((err) => {
  console.error('Seed failed:', err);
  process.exit(1);
});
