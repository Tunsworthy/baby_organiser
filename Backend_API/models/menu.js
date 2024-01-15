const mongoose = require('mongoose');

const itemSchema = new mongoose.Schema({
    name: String,
    quantity: Number,
    id: Number
});

const menuSchema = new mongoose.Schema({
    date: {
        type: Date,
        required: true
    },
    Lunch: {
        items: [itemSchema]
    },
    Dinner: {
        items: [itemSchema]
    }
});

const Menu = mongoose.model('Menu', menuSchema);
module.exports = Menu;
