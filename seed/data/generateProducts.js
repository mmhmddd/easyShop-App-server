const catalog = require('./productCatalog');
const { resolveProductImage } = require('./images');

const CATEGORY_SKU_PREFIX = {
  laptops: 'LAP',
  phones: 'PHN',
  tablets: 'TAB',
  ipads: 'IPD',
  airpods: 'APD',
  headphones: 'HPH',
  'smart-watches': 'SWT',
  gaming: 'GAM',
  monitors: 'MON',
  keyboards: 'KEY',
  mice: 'MCE',
  cameras: 'CAM',
  speakers: 'SPK',
  chargers: 'CHG',
  accessories: 'ACC',
};

function slugify(str) {
  return str
    .toLowerCase()
    .replace(/["'()]/g, '')
    .replace(/[^a-z0-9]+/g, '-')
    .replace(/^-+|-+$/g, '');
}

function seededRandom(seed) {
  let s = seed % 2147483647;

  if (s <= 0) {
    s += 2147483646;
  }

  return function next() {
    s = (s * 16807) % 2147483647;
    return (s - 1) / 2147483646;
  };
}

function round1(n) {
  return Math.round(n * 10) / 10;
}

/**
 * Generates exactly 10 products per category.
 *
 * Total:
 * 15 categories × 10 products = 150 products.
 *
 * Exactly 20 products receive a 50% discount.
 * The remaining 130 products have no discount.
 */
async function generateProducts(categoryIdBySlug) {
  const products = [];
  const usedSlugs = new Set();

  const rand = seededRandom(20260915);

  // ---------------------------------------------------------
  // Generate 10 products per category
  // ---------------------------------------------------------
  for (const [categorySlug, items] of Object.entries(catalog)) {
    const categoryId = categoryIdBySlug[categorySlug];

    if (!categoryId) {
      throw new Error(
        `Missing category id for slug "${categorySlug}" - check categories.js matches productCatalog.js`
      );
    }

    const prefix = CATEGORY_SKU_PREFIX[categorySlug];

    if (!prefix) {
      throw new Error(
        `Missing SKU prefix for category "${categorySlug}"`
      );
    }

    // Only the first 10 products from each category
    for (let idx = 0; idx < Math.min(items.length, 10); idx++) {
      const [name, price, imageFilename, description] = items[idx];

      const position = idx + 1;

      let baseSlug = slugify(name);

      if (usedSlugs.has(baseSlug)) {
        baseSlug = `${baseSlug}-${categorySlug}`;
      }

      usedSlugs.add(baseSlug);

      const isHero = position <= 3;

      const stock = isHero
        ? Math.floor(40 + rand() * 160)
        : Math.floor(3 + rand() * 97);

      const rating = round1(
        3.6 + rand() * 1.4
      );

      const reviewCount = Math.floor(
        (isHero ? 400 : 20) +
        rand() * (isHero ? 4000 : 900)
      );

      const isBestSeller =
        isHero && rand() < 0.7;

      const isActive =
        stock === 0
          ? false
          : rand() > 0.04;

      console.log(
        `  → Resolving image: ${name}`
      );

      const image =
        await resolveProductImage(name);

      products.push({
        name,
        slug: baseSlug,
        description,
        price,

        // No discount initially.
        discountPrice: null,

        category: categoryId,

        // If no image is found, continue with an empty images array.
        images: image
          ? [
              {
                url: image.url,
                publicId: image.publicId,
              },
            ]
          : [],

        stock,
        sku: `${prefix}-${String(position).padStart(3, '0')}`,
        rating,
        reviewCount,
        isBestSeller,
        isActive,
      });
    }
  }

  // ---------------------------------------------------------
  // Validate total product count
  // ---------------------------------------------------------
  if (products.length !== 150) {
    throw new Error(
      `Expected exactly 150 products, but generated ${products.length}`
    );
  }

  // ---------------------------------------------------------
  // Pick exactly 20 random products for 50% discount
  // ---------------------------------------------------------
  const discountIndexes = new Set();

  while (discountIndexes.size < 20) {
    const index = Math.floor(
      rand() * products.length
    );

    discountIndexes.add(index);
  }

  discountIndexes.forEach((index) => {
    const product = products[index];

    product.discountPrice =
      Math.round(
        product.price * 0.5 * 100
      ) / 100;
  });

  // ---------------------------------------------------------
  // Final discount validation
  // ---------------------------------------------------------
  const discountedCount =
    products.filter(
      (product) =>
        product.discountPrice !== null
    ).length;

  if (discountedCount !== 20) {
    throw new Error(
      `Expected exactly 20 discounted products, but found ${discountedCount}`
    );
  }

  console.log(
    '----------------------------------------'
  );
  console.log(
    `Products generated: ${products.length}`
  );
  console.log(
    `50% discounts: ${discountedCount}`
  );
  console.log(
    `No discount: ${products.length - discountedCount}`
  );
  console.log(
    '----------------------------------------'
  );

  return products;
}

module.exports = generateProducts;