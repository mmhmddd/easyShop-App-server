const mongoose = require('mongoose');
require('dotenv').config();

const Product = require('../models/Product');
const Category = require('../models/Category');

const products = [
  {
    name: 'Wireless Headphones',
    slug: 'wireless-headphones-50',
    description: 'High-quality wireless headphones with clear sound.',
    price: 2000,
    discountPrice: 1000,
    stock: 25,
    sku: 'WH-001',
    rating: 4.5,
    reviewCount: 18,
    isBestSeller: true,
    isActive: true,
  },
  {
    name: 'Gaming Mouse',
    slug: 'gaming-mouse-50',
    description: 'Ergonomic gaming mouse with RGB lighting.',
    price: 1000,
    discountPrice: 500,
    stock: 40,
    sku: 'GM-002',
    rating: 4.6,
    reviewCount: 25,
    isBestSeller: true,
    isActive: true,
  },
  {
    name: 'Mechanical Keyboard',
    slug: 'mechanical-keyboard-50',
    description: 'Mechanical keyboard with RGB backlight.',
    price: 1800,
    discountPrice: 900,
    stock: 20,
    sku: 'MK-003',
    rating: 4.7,
    reviewCount: 31,
    isBestSeller: false,
    isActive: true,
  },
  {
    name: 'Smart Watch',
    slug: 'smart-watch-50',
    description: 'Modern smart watch with fitness tracking.',
    price: 3000,
    discountPrice: 1500,
    stock: 15,
    sku: 'SW-004',
    rating: 4.4,
    reviewCount: 14,
    isBestSeller: true,
    isActive: true,
  },
  {
    name: 'Bluetooth Speaker',
    slug: 'bluetooth-speaker-50',
    description: 'Portable Bluetooth speaker with powerful sound.',
    price: 1600,
    discountPrice: 800,
    stock: 30,
    sku: 'BS-005',
    rating: 4.3,
    reviewCount: 12,
    isBestSeller: false,
    isActive: true,
  },
  {
    name: 'Gaming Controller',
    slug: 'gaming-controller-50',
    description: 'Wireless controller for gaming.',
    price: 1400,
    discountPrice: 700,
    stock: 22,
    sku: 'GC-006',
    rating: 4.5,
    reviewCount: 20,
    isBestSeller: false,
    isActive: true,
  },
  {
    name: 'Laptop Stand',
    slug: 'laptop-stand-50',
    description: 'Adjustable aluminum laptop stand.',
    price: 800,
    discountPrice: 400,
    stock: 35,
    sku: 'LS-007',
    rating: 4.2,
    reviewCount: 9,
    isBestSeller: false,
    isActive: true,
  },
  {
    name: 'USB-C Hub',
    slug: 'usb-c-hub-50',
    description: 'Multi-port USB-C hub for laptops and tablets.',
    price: 1200,
    discountPrice: 600,
    stock: 28,
    sku: 'UH-008',
    rating: 4.4,
    reviewCount: 16,
    isBestSeller: false,
    isActive: true,
  },
  {
    name: 'Wireless Charger',
    slug: 'wireless-charger-50',
    description: 'Fast wireless charging pad.',
    price: 600,
    discountPrice: 300,
    stock: 45,
    sku: 'WC-009',
    rating: 4.1,
    reviewCount: 11,
    isBestSeller: false,
    isActive: true,
  },
  {
    name: 'Smart LED Lamp',
    slug: 'smart-led-lamp-50',
    description: 'Smart LED lamp with adjustable brightness.',
    price: 1000,
    discountPrice: 500,
    stock: 32,
    sku: 'SL-010',
    rating: 4.3,
    reviewCount: 13,
    isBestSeller: false,
    isActive: true,
  },
];

async function seedDiscountedProducts() {
  try {
    await mongoose.connect(process.env.MONGODB_URI);
    console.log('MongoDB connected.');

    const categories = await Category.find({ isActive: true }).sort({
      sortOrder: 1,
    });

    if (!categories.length) {
      console.log(
        'No active categories found. Run seedCategories.js first.'
      );
      process.exit(1);
    }

    const productsToInsert = products.map((product, index) => ({
      ...product,
      category: categories[index % categories.length]._id,
      images: [],
    }));

    // Remove products created by this seed if they already exist
    await Product.deleteMany({
      sku: { $in: products.map((product) => product.sku) },
    });

    const createdProducts = await Product.insertMany(productsToInsert);

    console.log(
      `Successfully created ${createdProducts.length} discounted products.`
    );

    createdProducts.forEach((product) => {
      console.log(
        `${product.name}: ${product.price} -> ${product.discountPrice}`
      );
    });

    process.exit(0);
  } catch (error) {
    console.error('Seed discounted products error:', error);
    process.exit(1);
  }
}

seedDiscountedProducts();