require('dotenv').config();

const mongoose = require('mongoose');
const Category = require('../models/Category');

async function checkCategories() {
  try {
    await mongoose.connect(process.env.MONGODB_URI);

    console.log('MongoDB connected.\n');

    const categories = await Category.find({})
      .select('_id name slug icon isActive')
      .lean();

    console.log('Categories:');
    console.log(JSON.stringify(categories, null, 2));
  } catch (error) {
    console.error('Error:', error.message);
  } finally {
    await mongoose.disconnect();
  }
}

checkCategories();