const cloudinary = require('cloudinary').v2;
const https = require('https');

function configureCloudinary() {
  const cloudName = process.env.CLOUDINARY_CLOUD_NAME;
  const apiKey = process.env.CLOUDINARY_API_KEY;
  const apiSecret = process.env.CLOUDINARY_API_SECRET;

  if (!cloudName || !apiKey || !apiSecret) {
    throw new Error(
      'Cloudinary configuration is missing. Check CLOUDINARY_CLOUD_NAME, CLOUDINARY_API_KEY and CLOUDINARY_API_SECRET in .env'
    );
  }

  cloudinary.config({
    cloud_name: cloudName,
    api_key: apiKey,
    api_secret: apiSecret,
    secure: true,
  });
}

function requestJson(url) {
  return new Promise((resolve, reject) => {
    const request = https.get(
      url,
      {
        headers: {
          'User-Agent': 'easyShop-seeder/1.0',
          Accept: 'application/json',
        },
      },
      (response) => {
        let body = '';

        response.on('data', (chunk) => {
          body += chunk;
        });

        response.on('end', () => {
          if (
            response.statusCode < 200 ||
            response.statusCode >= 300
          ) {
            reject(
              new Error(
                `Request failed with HTTP ${response.statusCode}`
              )
            );
            return;
          }

          try {
            resolve(JSON.parse(body));
          } catch {
            reject(new Error('Invalid JSON response'));
          }
        });
      }
    );

    request.setTimeout(15000, () => {
      request.destroy(new Error('Request timeout'));
    });

    request.on('error', reject);
  });
}

/**
 * Searches Wikimedia Commons for a real image.
 * Tries multiple search variations so products with
 * model numbers can still be resolved.
 */
async function searchWikimedia(query) {
  const params = new URLSearchParams({
    action: 'query',
    generator: 'search',
    gsrsearch: query,
    gsrnamespace: '6',
    gsrlimit: '10',
    prop: 'imageinfo',
    iiprop: 'url|mime',
    iiurlwidth: '1200',
    format: 'json',
    origin: '*',
  });

  const url =
    `https://commons.wikimedia.org/w/api.php?${params}`;

  const data = await requestJson(url);

  const pages = Object.values(
    data?.query?.pages || {}
  );

  for (const page of pages) {
    const imageInfo = page.imageinfo?.[0];

    if (!imageInfo) continue;

    const imageUrl =
      imageInfo.thumburl || imageInfo.url;

    const mime = imageInfo.mime || '';

    if (
      imageUrl &&
      mime.startsWith('image/')
    ) {
      return imageUrl;
    }
  }

  return null;
}

async function findWikimediaImage(productName) {
  const searches = [];

  // 1. Exact product name
  searches.push(productName);

  // 2. Remove model number / size information
  const withoutNumbers = productName
    .replace(/\b\d+([a-zA-Z]+)?\b/g, '')
    .replace(/\s+/g, ' ')
    .trim();

  if (
    withoutNumbers &&
    withoutNumbers !== productName
  ) {
    searches.push(withoutNumbers);
  }

  // 3. Remove common size/model suffixes
  const simplified = productName
    .replace(/\b\d{2,4}\b/g, '')
    .replace(/\b(m2|m3|m4|pro|max|plus|ultra|air)\b/gi, '')
    .replace(/\s+/g, ' ')
    .trim();

  if (
    simplified &&
    !searches.includes(simplified)
  ) {
    searches.push(simplified);
  }

  for (const query of searches) {
    console.log(`    Searching Wikimedia: ${query}`);

    try {
      const image = await searchWikimedia(query);

      if (image) {
        return image;
      }
    } catch (error) {
      console.log(
        `    ⚠ Search failed for "${query}": ${error.message}`
      );
    }
  }

  return null;
}

function slugify(value) {
  return value
    .toLowerCase()
    .replace(/[^a-z0-9]+/g, '-')
    .replace(/^-+|-+$/g, '');
}

async function uploadToCloudinary(
  imageUrl,
  productName
) {
  configureCloudinary();

  const publicId =
    `easyShop/products/${slugify(productName)}`;

  const result =
    await cloudinary.uploader.upload(
      imageUrl,
      {
        public_id: publicId,
        overwrite: true,
        resource_type: 'image',
      }
    );

  if (!result?.secure_url) {
    throw new Error(
      `Cloudinary did not return a secure URL for "${productName}"`
    );
  }

  return {
    url: result.secure_url,
    publicId: result.public_id,
  };
}

async function resolveProductImage(productName) {
  console.log(`  → ${productName}`);

  const sourceImage = await findWikimediaImage(productName);

  if (!sourceImage) {
    console.log(
      `    ⚠ No image found for "${productName}" — continuing without image`
    );

    return null;
  }

  console.log('    ✓ source image found');

  try {
    const uploaded = await uploadToCloudinary(
      sourceImage,
      productName
    );

    console.log('    ✓ uploaded to Cloudinary');

    return uploaded;
  } catch (error) {
    console.log(
      `    ⚠ Upload failed for "${productName}" — continuing without image`
    );
    console.log(`    ${error.message}`);

    return null;
  }
}

module.exports = {
  resolveProductImage,
};

