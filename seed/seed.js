
/**
 * Seed script: populates MongoDB with the 15 categories and 150 products.
 *
 * Usage:
 *   node seed/seed.js
 */

require('dotenv').config();

const mongoose = require('mongoose');
const path = require('path');

const Category = require(
  path.join(__dirname, '..', 'models', 'Category')
);

const Product = require(
  path.join(__dirname, '..', 'models', 'Product')
);

const categoriesData = require('./data/categories');
const generateProducts = require('./data/generateProducts');

async function seed() {
  const uri = process.env.MONGODB_URI;

  if (!uri) {
    throw new Error(
      'MONGODB_URI is not set. Add it to your .env file before running the seed.'
    );
  }

  console.log('Connecting to MongoDB...');

  await mongoose.connect(uri);

  console.log('Connected.');

  try {
    console.log('Clearing existing categories and products...');

    await Product.deleteMany({});
    await Category.deleteMany({});

    console.log('Inserting 15 categories...');

    const insertedCategories = await Category.insertMany(
      categoriesData
    );

    const categoryIdBySlug = {};

    insertedCategories.forEach((category) => {
      categoryIdBySlug[category.slug] = category._id;
    });

    console.log('Generating 150 products from catalog...');

    const products = await generateProducts(
      categoryIdBySlug
    );

    if (!Array.isArray(products)) {
      throw new Error(
        'generateProducts() did not return an array.'
      );
    }

    if (products.length !== 150) {
      throw new Error(
        `Expected exactly 150 products, generated ${products.length}.`
      );
    }

    const discountedProducts = products.filter(
      (product) => product.discountPrice !== null
    );

    if (discountedProducts.length !== 20) {
      throw new Error(
        `Expected exactly 20 discounted products, found ${discountedProducts.length}.`
      );
    }

    console.log('Inserting 150 products...');

    await Product.insertMany(products);

    console.log('');
    console.log('================================');
    console.log('Seed complete');
    console.log('================================');
    console.log(`Categories: ${insertedCategories.length}`);
    console.log(`Products:   ${products.length}`);
    console.log(`50% Deals:  ${discountedProducts.length}`);
    console.log(
      `No Discount: ${products.length - discountedProducts.length}`
    );
    console.log('================================');

  } finally {
    await mongoose.disconnect();
    console.log('Disconnected.');
  }
}

seed().catch((err) => {
  console.error('Seed failed:', err);
  process.exit(1);
});

