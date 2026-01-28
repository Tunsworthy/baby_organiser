const express = require('express');
const router = express.Router();
const menuController = require('../controllers/menuController');
const rateLimit = require('express-rate-limit');

const limiter = rateLimit({
    windowMs: 15 * 60 * 1000, // 15 minutes
    max: 100, // limit each IP to 100 requests per windowMs
});

router.use(limiter);

router.get('/', menuController.getAllMenus);
router.post('/', menuController.createMenu);
router.get('/:id', menuController.getMenuById);
router.get('/bydate/:date', menuController.getMenuByDate);
router.put('/:id', menuController.updateMenu);
router.delete('/:id', menuController.deleteMenu);

module.exports = router;
