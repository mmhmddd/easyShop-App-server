const mongoose = require('mongoose');
require('dotenv').config();

const Product = require('../models/Product');
const Category = require('../models/Category');

const products = [
  {
    name: 'Wireless Headphones',
    slug: 'wireless-headphones',
    description: 'High-quality wireless headphones with clear sound and comfortable design.',
    price: 120,
    discountPrice: 99,
    categoryName: 'Electronics',
    stock: 25,
    sku: 'WH-001',
    rating: 4.5,
    reviewCount: 128,
    isBestSeller: true,
    isActive: true,
  },
  {
    name: 'Smart Watch Pro',
    slug: 'smart-watch-pro',
    description: 'Modern smart watch with fitness tracking and notifications.',
    price: 180,
    discountPrice: 149,
    categoryName: 'Electronics',
    stock: 18,
    sku: 'SW-002',
    rating: 4.4,
    reviewCount: 96,
    isBestSeller: true,
    isActive: true,
  },
  {
    name: 'Mechanical Keyboard',
    slug: 'mechanical-keyboard',
    description: 'RGB mechanical keyboard with responsive switches.',
    price: 95,
    discountPrice: 79,
    categoryName: 'Electronics',
    stock: 30,
    sku: 'MK-003',
    rating: 4.6,
    reviewCount: 74,
    isBestSeller: false,
    isActive: true,
  },
  {
    name: 'Running Shoes',
    slug: 'running-shoes',
    description: 'Lightweight running shoes designed for daily workouts.',
    price: 110,
    discountPrice: 89,
    categoryName: 'Fashion',
    stock: 40,
    sku: 'RS-004',
    rating: 4.3,
    reviewCount: 61,
    isBestSeller: true,
    isActive: true,
  },
  {
    name: 'Classic T-Shirt',
    slug: 'classic-t-shirt',
    description: 'Comfortable cotton t-shirt for everyday use.',
    price: 35,
    discountPrice: 29,
    categoryName: 'Fashion',
    stock: 60,
    sku: 'TS-005',
    rating: 4.2,
    reviewCount: 43,
    isBestSeller: false,
    isActive: true,
  },
  {
    name: 'Leather Backpack',
    slug: 'leather-backpack',
    description: 'Premium backpack suitable for work, university, and travel.',
    price: 85,
    discountPrice: 69,
    categoryName: 'Fashion',
    stock: 22,
    sku: 'LB-006',
    rating: 4.5,
    reviewCount: 52,
    isBestSeller: false,
    isActive: true,
  },
  {
    name: 'Coffee Maker',
    slug: 'coffee-maker',
    description: 'Compact coffee maker for fresh coffee at home.',
    price: 140,
    discountPrice: 119,
    categoryName: 'Home',
    stock: 15,
    sku: 'CM-007',
    rating: 4.4,
    reviewCount: 38,
    isBestSeller: true,
    isActive: true,
  },
  {
    name: 'Desk Lamp',
    slug: 'desk-lamp',
    description: 'Modern LED desk lamp with adjustable brightness.',
    price: 45,
    discountPrice: 35,
    categoryName: 'Home',
    stock: 35,
    sku: 'DL-008',
    rating: 4.1,
    reviewCount: 27,
    isBestSeller: false,
    isActive: true,
  },
  {
    name: 'Gaming Mouse',
    slug: 'gaming-mouse',
    description: 'Ergonomic gaming mouse with adjustable DPI.',
    price: 60,
    discountPrice: 49,
    categoryName: 'Gaming',
    stock: 28,
    sku: 'GM-009',
    rating: 4.7,
    reviewCount: 112,
    isBestSeller: true,
    isActive: true,
  },
  {
    name: 'USB-C Hub',
    slug: 'usb-c-hub',
    description: 'Multi-port USB-C hub for laptops and tablets.',
    price: 55,
    discountPrice: 45,
    categoryName: 'Electronics',
    stock: 32,
    sku: 'UH-010',
    rating: 4.3,
    reviewCount: 47,
    isBestSeller: false,
    isActive: true,
  },
];

async function seedProducts() {
  try {
    await mongoose.connect(process.env.MONGODB_URI);

    console.log('MongoDB connected.');

    const categories = await Category.find({
      name: { $in: ['Electronics', 'Fashion', 'Home', 'Gaming'] },
    });

    if (!categories.length) {
      throw new Error(
        'No matching categories found. Seed/create Categories first.'
      );
    }

    const categoryMap = new Map(
      categories.map((category) => [category.name.toLowerCase(), category._id])
    );

    const productsToInsert = products.map((product) => {
      const categoryId = categoryMap.get(product.categoryName.toLowerCase());

      if (!categoryId) {
        throw new Error(
          `Category "${product.categoryName}" not found.`
        );
      }

      const { categoryName, ...productData } = product;

      return {
        ...productData,
        category: categoryId,
        images: [],
      };
    });

    await Product.deleteMany({
      slug: { $in: products.map((product) => product.slug) },
    });

    await Product.insertMany(productsToInsert);

    console.log(`Successfully seeded ${productsToInsert.length} products.`);

    process.exit(0);
  } catch (error) {
    console.error('Seed failed:', error.message);
    process.exit(1);
  }
}

seedProducts();