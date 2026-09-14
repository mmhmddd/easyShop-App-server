require('dotenv').config();
const app = require('../app');

// Vercel serverless entry point. Express apps are just
// `(req, res) => {}` functions under the hood, so exporting it
// directly is all @vercel/node needs.
module.exports = app;
