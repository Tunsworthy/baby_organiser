const Menu = require('../models/menu'); // Replace with the actual path to the menu model

exports.getAllMenus = async (req, res) => {
    try {
        const menus = await Menu.find({});
        res.status(200).json(menus);
    } catch (error) {
        res.status(400).json({ error: error.message });
    }
};

exports.createMenu = async (req, res) => {
    try {
        const newMenu = new Menu(req.body);
        const savedMenu = await newMenu.save();
        res.status(201).json(savedMenu);
    } catch (error) {
        res.status(400).json({ error: error.message });
    }
};

exports.getMenuById = async (req, res) => {
    try {
        const menu = await Menu.findById(req.params.id);
        if (!menu) {
            return res.status(404).json({ message: 'Menu not found' });
        }
        res.status(200).json(menu);
    } catch (error) {
        res.status(400).json({ error: error.message });
    }
};

exports.updateMenu = async (req, res) => {
    try {
        const updatedMenu = await Menu.findByIdAndUpdate(
            req.params.id,
            req.body,
            { new: true }
        );
        if (!updatedMenu) {
            return res.status(404).json({ message: 'Menu not found' });
        }
        res.status(200).json(updatedMenu);
    } catch (error) {
        res.status(400).json({ error: error.message });
    }
};

exports.deleteMenu = async (req, res) => {
    try {
        const deletedMenu = await Menu.findByIdAndDelete(req.params.id);
        if (!deletedMenu) {
            return res.status(404).json({ message: 'Menu not found' });
        }
        res.status(200).json({ message: 'Menu deleted successfully' });
    } catch (error) {
        res.status(400).json({ error: error.message });
    }
};
