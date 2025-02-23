const express = require('express');
const router = express.Router();
const menuController = require('../controllers/menuController');
const rateLimit = require('express-rate-limit');

const limiter = rateLimit({
    windowMs: 15 * 60 * 1000, // 15 minutes
    max: 100, // limit each IP to 100 requests per windowMs
});

router.use(limiter);

router.get('/menus', menuController.getAllMenus);
router.post('/menus', menuController.createMenu);
router.get('/menus/:id', menuController.getMenuById);
router.get('/menus/bydate/:date', menuController.getMenuByDate);
router.put('/menus/:id', menuController.updateMenu);
router.delete('/menus/:id', menuController.deleteMenu);

module.exports = router;
