require('dotenv').config();
const express = require('express');
const fs = require('fs');
const https = require('https');
const path = require('path');
const bodyParser = require('body-parser');
const ensurepostgresTablesExists = require('./config/postgrestablecreation');

const { pool , feedsync } = require('./config/postgresConnection.js');

// Add error handling for both pools
pool.on('error', (err, client) => {
  console.error('Unexpected error on idle main pool client', err);
});

feedsync.on('error', (err, client) => {
  console.error('Unexpected error on idle feedsync pool client', err);
});
const app = express();

// Middleware for parsing JSON and form data
app.use(bodyParser.urlencoded({ extended: true,limit: '100mb' }));
app.use(bodyParser.json());

// Automatically load all route files from the routes directory
const routeFiles = fs.readdirSync('./routes').filter(file => file.endsWith('.js'));

routeFiles.forEach((file) => {
  const route = require(`./routes/${file}`);
  app.use('/api', route);
});
// ... error handling, start server, etc.

module.exports = app;

// API key middleware
//app.use(apiKeyMiddleware({ keyHeader: 'x-api-key', key: process.env.API_KEY }));

// Define routes here
// e.g., app.use('/api/items', itemsRouter);

// Run the function to make sure the "food" table exists
ensurepostgresTablesExists().then(() => {
  console.log('Table check is complete.');
}).catch(err => {
  console.error('Failed to check/create table:', err);
});

const PORT = process.env.PORT || 3000;
const HTTPS_PORT = process.env.HTTPS_PORT || PORT;
const SSL_KEY_PATH = process.env.SSL_KEY_PATH ? path.resolve(process.env.SSL_KEY_PATH) : null;
const SSL_CERT_PATH = process.env.SSL_CERT_PATH ? path.resolve(process.env.SSL_CERT_PATH) : null;
const SSL_CA_PATH = process.env.SSL_CA_PATH ? path.resolve(process.env.SSL_CA_PATH) : null;

const hasKey = SSL_KEY_PATH && fs.existsSync(SSL_KEY_PATH);
const hasCert = SSL_CERT_PATH && fs.existsSync(SSL_CERT_PATH);
const hasCa = SSL_CA_PATH && fs.existsSync(SSL_CA_PATH);

if (hasKey && hasCert) {
  const options = {
    key: fs.readFileSync(SSL_KEY_PATH),
    cert: fs.readFileSync(SSL_CERT_PATH),
  };
  if (hasCa) {
    options.ca = fs.readFileSync(SSL_CA_PATH);
  }
  https.createServer(options, app).listen(HTTPS_PORT, () => {
    console.log(`HTTPS server running on port ${HTTPS_PORT}`);
  });
} else {
  app.listen(PORT, () => console.log(`HTTP server running on port ${PORT}`));
}

//Comment to rebuild