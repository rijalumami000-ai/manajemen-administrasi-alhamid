// Entry point shim for Node.js / PM2 runtime compatibility
require('tsx/cjs');
module.exports = require('./server.ts');
