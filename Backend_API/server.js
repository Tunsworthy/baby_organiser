require('dotenv').config();
const express = require('express');
const fs = require('fs');
const bodyParser = require('body-parser');
const mongoose = require('mongoose');
const ensurepostgresTablesExists = require('./config/postgrestablecreation'); // Adjust the path as needed


const { connectMongoDB } = require('./config/mongoConnection.js');
const {pool , feedsync} = require('./config/postgresConnection.js');

// Now you can make queries using the pool object
async function query(text, params) {
  const res = await postgresPool.query(text, params);
  return res;
}

// Add error handling for both pools
pool.on('error', (err, client) => {
  console.error('Unexpected error on idle main pool client', err);
});

feedsync.on('error', (err, client) => {
  console.error('Unexpected error on idle feedsync pool client', err);
});

connectMongoDB(process.env.MONGO_URI).catch((error) => {
  console.error('MongoDB connection error:', error);
  process.exit(1); // Optionally exit the application if connection completely fails
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
app.listen(PORT, () => console.log(`Server running on port ${PORT}`));

//Comment to rebuild