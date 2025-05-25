const express = require('express');
const router = express.Router();
const feedsyncController = require('../controllers/feedsyncController');
const rateLimit = require('express-rate-limit');

const limiter = rateLimit({
    windowMs: 15 * 60 * 1000, // 15 minutes
    max: 100, // limit each IP to 100 requests per windowMs
});

router.use(limiter);


// GET endpoint to retrieve all items
router.get('/feed/latest', feedsyncController.latest);

module.exports = router;
