/**
 * Checks every product image URL already sitting in MongoDB and reports
 * any that don't resolve to a real image (non-2xx status, non-image
 * content-type, or network error).
 *
 * Run this AFTER seed.js:
 *   node seed/verifyImages.js
 *
 * Why this exists: the seed data uses Wikimedia Commons Special:FilePath
 * links. Filenames for iconic products (iPhone, MacBook, PS5, etc.) were
 * confirmed against live Commons search results while building this seed;
 * the rest follow Commons' standard naming convention but were not each
 * individually fetch-verified. This script closes that gap - it checks
 * all 300 for you and prints exactly which product/SKU to fix if any
 * filename doesn't match what's actually on Commons.
 */

require('dotenv').config();
const mongoose = require('mongoose');
const path = require('path');

const Product = require(path.join(__dirname, '..', 'models', 'Product'));

const CONCURRENCY = 10;

async function checkUrl(url) {
  try {
    const res = await fetch(url, { method: 'HEAD', redirect: 'follow' });
    const contentType = res.headers.get('content-type') || '';
    if (!res.ok) return { ok: false, reason: `HTTP ${res.status}` };
    if (!contentType.startsWith('image/')) return { ok: false, reason: `Non-image content-type: ${contentType}` };
    return { ok: true };
  } catch (err) {
    return { ok: false, reason: err.message };
  }
}

async function run() {
  const uri = process.env.MONGODB_URI;
  if (!uri) throw new Error('MONGODB_URI is not set.');

  await mongoose.connect(uri);
  const products = await Product.find({}, 'name sku images').lean();
  console.log(`Checking ${products.length} products' images (concurrency ${CONCURRENCY})...\n`);

  const broken = [];
  let checked = 0;

  for (let i = 0; i < products.length; i += CONCURRENCY) {
    const batch = products.slice(i, i + CONCURRENCY);
    await Promise.all(
      batch.map(async (p) => {
        const url = p.images?.[0]?.url;
        checked += 1;
        if (!url) {
          broken.push({ sku: p.sku, name: p.name, reason: 'No image URL' });
          return;
        }
        const result = await checkUrl(url);
        if (!result.ok) {
          broken.push({ sku: p.sku, name: p.name, url, reason: result.reason });
        }
      })
    );
    process.stdout.write(`  checked ${Math.min(checked, products.length)}/${products.length}\r`);
  }

  console.log('\n');
  if (broken.length === 0) {
    console.log('All product images resolved successfully.');
  } else {
    console.log(`${broken.length} product(s) with a broken/non-image URL:\n`);
    broken.forEach((b) => {
      console.log(`  [${b.sku}] ${b.name}${b.url ? ` -> ${b.url}` : ''}`);
      console.log(`      reason: ${b.reason}`);
    });
    console.log('\nFix these by updating the image filename in seed/data/productCatalog.js');
    console.log('(or swapping in your own Cloudinary-hosted photo), then re-run seed/seed.js.');
  }

  await mongoose.disconnect();
  process.exit(broken.length === 0 ? 0 : 1);
}

run().catch((err) => {
  console.error('Verification failed:', err);
  process.exit(1);
});