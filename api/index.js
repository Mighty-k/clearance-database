// Explicit require so Vercel NFT bundles db.json with this serverless function
require('../db.json');
const app = require('../server.js');

module.exports = app;

