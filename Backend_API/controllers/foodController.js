const { pool } = require('../config/postgresConnection');
const escapeHtml = require('escape-html');

exports.getAllItems = async (req, res) => {
    try {
        const groupId = req.user.groupId;
        const sql = 'SELECT id, name, quantity, dateprepared, type, lastallocated, createdBy FROM food WHERE groupId = $1 ORDER BY createddate DESC';
        const items = await pool.query(sql, [groupId]);

        res.status(200).json(items.rows);
    } catch (error) {
        console.error(error);
        res.status(500).json({ message: 'Error fetching items from the food table' });
    }
};


exports.getSingleItem = async (req, res) => {
    try {
        const itemId = req.params.id;
        const groupId = req.user.groupId;

        const sql = 'SELECT id, name, quantity, dateprepared, type, lastallocated, createdBy FROM food WHERE id = $1 AND groupId = $2';
        const items = await pool.query(sql, [itemId, groupId]);
        const item = items.rows.length > 0 ? items.rows[0] : null;

        if (item) {
            res.status(200).json(item);
        } else {
            res.status(404).json({ message: 'Item not found' });
        }
    } catch (error) {
        console.error(error);
        res.status(500).json({ message: 'Error fetching item' });
    }
};



exports.createItem = async (req, res) => {
  try {
    const { name, quantity, dateprepared, type, lastallocated } = req.body;
    const groupId = req.user.groupId;
    const userId = req.user.userId;

    if (!name || quantity === undefined) {
      return res.status(400).json({ error: 'Name and quantity are required' });
    }

    const result = await pool.query(
      'INSERT INTO food (name, quantity, dateprepared, type, lastallocated, groupId, createdBy) VALUES ($1, $2, $3, $4, $5, $6, $7) RETURNING id, name, quantity, dateprepared, type, lastallocated, groupId, createdBy',
      [name, quantity, dateprepared, type, lastallocated, groupId, userId]
    );
    res.status(201).json(result.rows[0]);
  } catch (error) {
    console.error('Error creating item:', error);
    res.status(500).json({ error: 'Failed to create item' });
  }
};

exports.updateItem = async (req, res) => {
    try {
        const id = req.params.id;
        const groupId = req.user.groupId;
        const { quantity, dateprepared, type, lastallocated } = req.body;
        let querySetParts = [];
        let queryValues = [];

        // Verify item belongs to group
        const itemResult = await pool.query(
          'SELECT id FROM food WHERE id = $1 AND groupId = $2',
          [id, groupId]
        );

        if (itemResult.rows.length === 0) {
          return res.status(404).json({ error: 'Item not found' });
        }

        // Check which fields are provided and prepare them for the SQL query
        if (quantity !== undefined) {
            queryValues.push(quantity);
            querySetParts.push(`quantity = $${queryValues.length}`);
        }
        if (dateprepared !== undefined) {
            queryValues.push(dateprepared);
            querySetParts.push(`dateprepared = $${queryValues.length}`);
        }
        if (type !== undefined) {
            queryValues.push(type);
            querySetParts.push(`type = $${queryValues.length}`);
        }
        if(lastallocated !== undefined){
            queryValues.push(lastallocated);
            querySetParts.push(`lastallocated = $${queryValues.length}`);
        }

        if (querySetParts.length === 0) {
            return res.status(400).json({ error: 'No valid fields provided for update' });
        }

        // Add groupId and id for WHERE clause
        queryValues.push(groupId);
        queryValues.push(id);

        const query = `UPDATE food SET ${querySetParts.join(', ')} WHERE groupId = $${queryValues.length - 1} AND id = $${queryValues.length} RETURNING *`;
        const result = await pool.query(query, queryValues);
        
        res.status(200).json(result.rows[0]);
    } catch (error) {
        console.error(error);
        res.status(500).json({ error: 'Failed to update item' });
    }
};



exports.deleteItem = async (req, res) => {
    try {
        const id = req.params.id;
        const groupId = req.user.groupId;

        const result = await pool.query(
          'DELETE FROM food WHERE id = $1 AND groupId = $2 RETURNING id',
          [id, groupId]
        );

        if (result.rows.length === 0) {
          return res.status(404).json({ error: 'Item not found' });
        }

        res.status(200).json({ message: `Item deleted with ID: ${escapeHtml(id)}` });
    } catch (error) {
        console.error(error);
        res.status(500).json({ error: 'Failed to delete item' });
    }
};


exports.deleteMultipleItems = async (req, res) => {
    try {
        const { ids } = req.body;
        const groupId = req.user.groupId;

        if (!ids || !Array.isArray(ids)) {
          return res.status(400).json({ error: 'ids must be an array' });
        }

        const result = await pool.query(
          'DELETE FROM food WHERE id = ANY($1) AND groupId = $2 RETURNING id',
          [ids, groupId]
        );

        if (result.rows.length === 0) {
          return res.status(404).json({ error: 'No items found to delete' });
        }

        res.status(200).json({ message: 'Items deleted successfully', deletedCount: result.rows.length });
    } catch (error) {
        console.error(error);
        res.status(500).json({ error: 'Failed to delete items' });
    }
}
