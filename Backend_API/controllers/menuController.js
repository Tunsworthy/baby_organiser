const Menu = require('../models/menu'); // Replace with the actual path to the menu model
const sanitize = require('mongoose-sanitize');

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

exports.getMenuByDate = async (req, res) => {
    try {
        // Assuming req.params.date is in the format 'YYYY-MM-DD'
        const dateString = req.params.date; 
        const date = new Date(dateString);
        
        // Set time to 00:00:00 for the beginning of the date
        date.setUTCHours(0, 0, 0, 0);

        // Create a new date object for the end of the day
        const nextDay = new Date(date);
        nextDay.setUTCHours(23, 59, 59, 999);

        // Find menus on the specified date
        const menus = await Menu.find({
            date: {
                $gte: date,
                $lte: nextDay
            }
        });

        if (!menus || menus.length === 0) {
            return res.status(404).json({ message: 'No menus found for the specified date' });
        }

        res.status(200).json(menus);
    } catch (error) {
        res.status(500).json({ error: error.message });
    }
};


exports.updateMenu = async (req, res) => {
    try {
        const sanitizedBody = sanitize(req.body);
        const updatedMenu = await Menu.findByIdAndUpdate(
            req.params.id,
            sanitizedBody,
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
