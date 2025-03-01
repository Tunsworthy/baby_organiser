const db = require('../config/postgresConnection'); // Update with path to your database connection setup
const escapeHtml = require('escape-html');

exports.getAllItems = async (req, res) => {
    try {
        // Assuming 'db' is your database instance and it has a method 'query'
        const sql = 'SELECT * FROM food'; // SQL statement to select everything from 'food' table
        const items = await db.query(sql); // Execute the query and get the results

        res.status(200).json(items);
    } catch (error) {
        console.error(error); // It's a good practice to log the actual error
        res.status(500).json({ message: 'Error fetching items from the food table' });
    }
};


exports.getSingleItem = async (req, res) => {
    console.log(req.params)
    try {
        const itemid = req.params.id;
        
        // Correct SQL statement with a placeholder for PostgreSQL
        const sql = 'SELECT * FROM food WHERE id = $1'; // Use $1 for the first parameter

        // Execute the query with the correct parameter placeholder
        const items = await db.query(sql, [itemid]); 
        console.log(items)
        const item = items.rows.length > 0 ? items.rows[0] : null; // Assuming the query returns an object with a 'rows' array

        if (item) {
            res.status(200).json(item);
        } else {
            res.status(404).json({ message: 'Item not found' });
        }
    } catch (error) {
        console.error(error); // It's good practice to log the actual error.
        res.status(500).json({ message: 'Error fetching item' });
    }
};



exports.createItem = (req, res) => {
    console.log(req.body)
    const { name, quantity, dateprepared, type, lastallocated} = req.body;
    
    // Add SQL query to insert a new item into the food inventory table
    const query = 'INSERT INTO food(name, quantity, dateprepared, type, lastallocated) VALUES($1, $2, $3, $4, $5)';
    db.query(query, [name, quantity, dateprepared, type, lastallocated], (error, results) => {
        if (error) {
            return res.status(400).json({ error });
        }
        res.status(201).send(`Item added with NAME: ${escapeHtml(name)}`);
    });
};

exports.updateItem = (req, res) => {
    const id = req.params.id;
    let { quantity, dateprepared, type,lastallocated } = req.body;
    let fieldsToUpdate = [];
    let queryValues = [];
    let querySetParts = [];

    // Check which fields are provided and prepare them for the SQL query
    if (quantity !== undefined) {
        fieldsToUpdate.push('quantity');
        queryValues.push(quantity);
        querySetParts.push(`quantity = $${queryValues.length}`);
    }
    if (dateprepared !== undefined) {
        fieldsToUpdate.push('dateprepared');
        queryValues.push(dateprepared);
        querySetParts.push(`dateprepared = $${queryValues.length}`);
    }
    if (type !== undefined) {
        fieldsToUpdate.push('type');
        queryValues.push(type);
        querySetParts.push(`type = $${queryValues.length}`);
    }

    if(lastallocated !== undefined){
        fieldsToUpdate.push('lastallocated');
        queryValues.push(lastallocated);
        querySetParts.push(`lastallocated = $${queryValues.length}`);
    }

    if (fieldsToUpdate.length === 0) {
        return res.status(400).json({ error: 'No valid fields provided for update' });
    }

    // Add the 'id' as the last parameter for the WHERE clause
    queryValues.push(id);

    // Construct the SQL query with the fields to be updated
    const query = `UPDATE food SET ${querySetParts.join(', ')} WHERE id = $${queryValues.length}`;
    db.query(query, queryValues, (error, results) => {
        if (error) {
            return res.status(400).json({ error });
        }
        res.status(200).send(`Item updated with ID: ${escapeHtml(id)}`);
    });
};



exports.deleteItem = (req, res) => {
    const id = req.params.id; // Use 'id' instead of 'name'

    // SQL query to delete the item by id
    const query = 'DELETE FROM food WHERE id = $1';
    db.query(query, [id], (error, results) => {
        if (error) {
            return res.status(400).json({ error });
        }
        const escape = require('escape-html');
        res.status(200).send(`Item deleted with ID: ${escape(id)}`);
    });
};


exports.deleteMultipleItems = (req, res) => {
    const { ids } = req.body;  // Expecting an array of ids to delete

    // SQL query to delete multiple items by their ids
    const query = 'DELETE FROM food WHERE id = ANY($1)';
    db.query(query, [ids], (error, results) => {
        if (error) {
            return res.status(400).json({ error });
        }
        res.status(200).send(`Items deleted`);
    });
};

