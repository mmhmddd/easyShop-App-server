require('dotenv').config();
const mongoose = require('mongoose');

const Product = require('../models/Product');
const Category = require('../models/Category');

const MONGODB_URI = process.env.MONGODB_URI;

async function clearDatabase() {
  try {
    if (!MONGODB_URI) {
      throw new Error('MONGODB_URI is not set in .env');
    }

    await mongoose.connect(MONGODB_URI);

    console.log('MongoDB connected.');

    const productsResult = await Product.deleteMany({});
    console.log(`Deleted ${productsResult.deletedCount} products.`);

    const categoriesResult = await Category.deleteMany({});
    console.log(`Deleted ${categoriesResult.deletedCount} categories.`);

    console.log('Products and categories cleared successfully.');
  } catch (error) {
    console.error('Error clearing database:', error.message);
    process.exitCode = 1;
  } finally {
    await mongoose.disconnect();
    console.log('MongoDB disconnected.');
  }
}

clearDatabase();