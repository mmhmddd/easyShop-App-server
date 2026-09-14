const multer = require('multer');
const streamifier = require('streamifier');
const cloudinary = require('../config/cloudinary');

// Memory storage only — Vercel's filesystem is read-only (except
// /tmp, which is wiped between invocations), so we never touch disk.
// Files are buffered in memory, then streamed straight to Cloudinary.
const storage = multer.memoryStorage();

const fileFilter = (req, file, cb) => {
  if (file.mimetype.startsWith('image/')) return cb(null, true);
  cb(new Error('Only image files are allowed'));
};

const upload = multer({
  storage,
  fileFilter,
  limits: { fileSize: 5 * 1024 * 1024 }, // 5MB per file
});

/**
 * Streams a single in-memory file buffer to Cloudinary.
 * @param {Buffer} buffer
 * @param {string} folder Cloudinary folder, e.g. "shopeasy/products"
 * @returns {Promise<{url: string, publicId: string}>}
 */
function uploadBufferToCloudinary(buffer, folder) {
  return new Promise((resolve, reject) => {
    const uploadStream = cloudinary.uploader.upload_stream(
      { folder, resource_type: 'image' },
      (error, result) => {
        if (error) return reject(error);
        resolve({ url: result.secure_url, publicId: result.public_id });
      }
    );
    streamifier.createReadStream(buffer).pipe(uploadStream);
  });
}

function deleteFromCloudinary(publicId) {
  if (!publicId) return Promise.resolve();
  return cloudinary.uploader.destroy(publicId);
}

module.exports = { upload, uploadBufferToCloudinary, deleteFromCloudinary };
