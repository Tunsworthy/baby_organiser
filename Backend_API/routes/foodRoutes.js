const express = require('express');
const router = express.Router();
const foodController = require('../controllers/foodController');
const rateLimit = require('express-rate-limit');

const limiter = rateLimit({
    windowMs: 15 * 60 * 1000, // 15 minutes
    max: 100, // limit each IP to 100 requests per windowMs
});

router.use(limiter);

// POST endpoint to create a new item
router.post('/items', foodController.createItem);

// GET endpoint to retrieve all items
router.get('/items', foodController.getAllItems);

// GET endpoint to retrieve a single item by name
router.get('/items/:id', foodController.getSingleItem);

// PUT endpoint to update an existing item by name
router.patch('/items/:id', foodController.updateItem);

// DELETE endpoint to delete an item by name
router.delete('/items/:id', foodController.deleteItem);

// DELETE endpoint to delete multiple items
router.delete('/items', foodController.deleteMultipleItems);

module.exports = router;
