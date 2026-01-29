const { pool } = require('../config/postgresConnection');

// Helper to normalize date to YYYY-MM-DD
function toDateOnly(dateInput) {
  if (!dateInput) return null;
  const d = new Date(dateInput);
  return d.toISOString().split('T')[0];
}

const baseMenuSelect = `
SELECT
  m.id,
  m.date,
  m.type,
  m.childId,
  m.groupId,
  m.createdBy,
  COALESCE(
    json_agg(
      json_build_object(
        'id', mi.id,
        'food_id', mi.food_id,
        'name', f.name,
        'quantity', mi.quantity,
        'allocated', mi.allocated,
        'active', mi.active
      )
      ORDER BY mi.id
    ) FILTER (WHERE mi.id IS NOT NULL), '[]'
  ) AS items
FROM menus m
LEFT JOIN menu_items mi ON mi.menu_id = m.id
LEFT JOIN food f ON f.id = mi.food_id
`;

function shapeMenuAggregates(row) {
    const normalizeItems = (arr) => {
        if (!arr) return [];
        try {
            const parsed = Array.isArray(arr) ? arr : JSON.parse(arr);
            return parsed.map((item) => ({
                id: item.id,
                food_id: item.food_id,
                name: item.name,
                quantity: item.quantity,
                allocated: Boolean(item.allocated),
                active: item.active !== false
            }));
        } catch (e) {
            return [];
        }
    };

    return {
        id: row.id,
        date: row.date,
        type: row.type,
        childId: row.childid,
        groupId: row.groupid,
        createdBy: row.createdby,
        items: normalizeItems(row.items)
    };
}

async function insertMenuItems(client, menuId, items) {
    if (!items || !Array.isArray(items) || !items.length) return;
    const values = [];
    const params = [];
    let idx = 1;

    items.forEach((item) => {
        values.push(`($${idx}, $${idx + 1}, $${idx + 2}, $${idx + 3}, $${idx + 4}, $${idx + 5})`);
        params.push(menuId);
        params.push(item.food_id ?? null);
        params.push(item.quantity ?? null);
        params.push(item.allocated ?? false);
        params.push(item.active ?? true);
        params.push(item.created_at ?? null);
        idx += 6;
    });

    await client.query(
        `INSERT INTO menu_items (menu_id, food_id, quantity, allocated, active, created_at)
         VALUES ${values.join(', ')}`,
        params
    );
}

// Get all menus for group
exports.getAllMenus = async (req, res) => {
    try {
        const groupId = req.user.groupId;
        const { rows } = await pool.query(
            `${baseMenuSelect} WHERE m.groupId = $1 GROUP BY m.id, m.date, m.type, m.childId, m.groupId, m.createdBy ORDER BY m.date DESC, m.type`,
            [groupId]
        );
        res.status(200).json(rows.map(shapeMenuAggregates));
    } catch (error) {
        res.status(400).json({ error: error.message });
    }
};

exports.createMenu = async (req, res) => {
    const client = await pool.connect();
    try {
        const groupId = req.user.groupId;
        const userId = req.user.userId;
        const dateStr = toDateOnly(req.body?.date);
        const type = req.body?.type;
        const childId = req.body?.childId;

        if (!dateStr) return res.status(400).json({ error: 'Invalid or missing date' });
        if (!type || !['Breakfast','Lunch','Dinner'].includes(type)) {
            return res.status(400).json({ error: 'Invalid or missing type (Breakfast, Lunch, Dinner)' });
        }

        // Verify child belongs to group if specified
        if (childId) {
            const childCheck = await client.query(
                'SELECT id FROM children WHERE id = $1 AND groupId = $2',
                [childId, groupId]
            );
            if (childCheck.rows.length === 0) {
                return res.status(404).json({ error: 'Child not found in your group' });
            }
        }

        await client.query('BEGIN');
        const { rows: menuRows } = await client.query(
            'INSERT INTO menus (date, type, childId, groupId, createdBy) VALUES ($1, $2, $3, $4, $5) RETURNING id, date, type, childId, groupId, createdBy',
            [dateStr, type, childId || null, groupId, userId]
        );
        const menuId = menuRows[0].id;

        await insertMenuItems(client, menuId, req.body?.items);

        const { rows } = await client.query(
            `${baseMenuSelect} WHERE m.id = $1 GROUP BY m.id, m.date, m.type, m.childId, m.groupId, m.createdBy`,
            [menuId]
        );

        await client.query('COMMIT');
        res.status(201).json(shapeMenuAggregates(rows[0]));
    } catch (error) {
        await client.query('ROLLBACK');
        res.status(400).json({ error: error.message });
    } finally {
        client.release();
    }
};

exports.getMenuById = async (req, res) => {
    try {
        const groupId = req.user.groupId;
        const { rows } = await pool.query(
            `${baseMenuSelect} WHERE m.id = $1 AND m.groupId = $2 GROUP BY m.id, m.date, m.type, m.childId, m.groupId, m.createdBy`,
            [req.params.id, groupId]
        );
        if (!rows.length) return res.status(404).json({ message: 'Menu not found' });
        res.status(200).json(shapeMenuAggregates(rows[0]));
    } catch (error) {
        res.status(400).json({ error: error.message });
    }
};

exports.getMenuByDate = async (req, res) => {
    try {
        const groupId = req.user.groupId;
        const dateStr = toDateOnly(req.params?.date);
        if (!dateStr) return res.status(400).json({ error: 'Invalid date format. Expected YYYY-MM-DD' });

        const { rows } = await pool.query(
            `${baseMenuSelect} WHERE m.date = $1 AND m.groupId = $2 GROUP BY m.id, m.date, m.type, m.childId, m.groupId, m.createdBy`,
            [dateStr, groupId]
        );
        if (!rows.length) return res.status(404).json({ message: 'No menus found for the specified date' });
        res.status(200).json(rows.map(shapeMenuAggregates));
    } catch (error) {
        res.status(500).json({ error: error.message });
    }
};

exports.updateMenu = async (req, res) => {
    const client = await pool.connect();
    try {
        const groupId = req.user.groupId;
        const menuId = req.params.id;

        // Verify menu belongs to group
        const menuCheck = await client.query(
            'SELECT id FROM menus WHERE id = $1 AND groupId = $2',
            [menuId, groupId]
        );
        if (menuCheck.rows.length === 0) {
            return res.status(404).json({ error: 'Menu not found' });
        }

        await client.query('BEGIN');

        if (req.body?.date) {
            const dateStr = toDateOnly(req.body.date);
            if (!dateStr) {
                await client.query('ROLLBACK');
                return res.status(400).json({ error: 'Invalid date' });
            }
            await client.query('UPDATE menus SET date = $1 WHERE id = $2', [dateStr, menuId]);
        }

        if (req.body?.type) {
            if (!['Breakfast','Lunch','Dinner'].includes(req.body.type)) {
                await client.query('ROLLBACK');
                return res.status(400).json({ error: 'Invalid type' });
            }
            await client.query('UPDATE menus SET type = $1 WHERE id = $2', [req.body.type, menuId]);
        }

        if (req.body?.childId !== undefined) {
            const childId = req.body.childId;
            // Verify child belongs to group if specified
            if (childId) {
                const childCheck = await client.query(
                    'SELECT id FROM children WHERE id = $1 AND groupId = $2',
                    [childId, groupId]
                );
                if (childCheck.rows.length === 0) {
                    await client.query('ROLLBACK');
                    return res.status(404).json({ error: 'Child not found in your group' });
                }
            }
            await client.query('UPDATE menus SET childId = $1 WHERE id = $2', [childId || null, menuId]);
        }

        if (req.body?.items && Array.isArray(req.body.items)) {
            await client.query('DELETE FROM menu_items WHERE menu_id = $1', [menuId]);
            await insertMenuItems(client, menuId, req.body.items);
        }

        const { rows } = await client.query(
            `${baseMenuSelect} WHERE m.id = $1 GROUP BY m.id, m.date, m.type, m.childId, m.groupId, m.createdBy`,
            [menuId]
        );

        await client.query('COMMIT');
        if (!rows.length) return res.status(404).json({ message: 'Menu not found' });
        res.status(200).json(shapeMenuAggregates(rows[0]));
    } catch (error) {
        await client.query('ROLLBACK');
        res.status(400).json({ error: error.message });
    } finally {
        client.release();
    }
};

exports.deleteMenu = async (req, res) => {
    try {
        const groupId = req.user.groupId;
        const { rowCount } = await pool.query(
            'DELETE FROM menus WHERE id = $1 AND groupId = $2',
            [req.params.id, groupId]
        );
        if (!rowCount) return res.status(404).json({ message: 'Menu not found' });
        res.status(200).json({ message: 'Menu deleted successfully' });
    } catch (error) {
        res.status(400).json({ error: error.message });
    }
};
