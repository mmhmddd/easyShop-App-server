require('dotenv').config();

const mongoose = require('mongoose');
const Category = require('../models/Category');

const categories = [
  {
    name: 'Electronics',
    slug: 'electronics',
    icon: 'devices_rounded',
    sortOrder: 1,
  },
  {
    name: 'Fashion',
    slug: 'fashion',
    icon: 'checkroom_rounded',
    sortOrder: 2,
  },
  {
    name: 'Home',
    slug: 'home',
    icon: 'home_rounded',
    sortOrder: 3,
  },
  {
    name: 'Gaming',
    slug: 'gaming',
    icon: 'sports_esports_rounded',
    sortOrder: 4,
  },
];

async function seedCategories() {
  try {
    await mongoose.connect(process.env.MONGODB_URI);

    console.log('MongoDB connected.');

    await Category.deleteMany({});

    const created = await Category.insertMany(categories);

    console.log(`Created ${created.length} categories.`);

    created.forEach((category) => {
      console.log(`- ${category.name} (${category._id})`);
    });
  } catch (error) {
    console.error('Category seed failed:', error.message);
  } finally {
    await mongoose.disconnect();
  }
}

seedCategories();