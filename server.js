require('dotenv').config();
const app = require('./app');

// Local / traditional-hosting entry point. On Vercel, api/index.js is
// used instead and this file is never executed.
const PORT = process.env.PORT || 5000;

app.listen(PORT, () => {
  console.log(`ShopEasy API listening on http://localhost:${PORT}`);
});
