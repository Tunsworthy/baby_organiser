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
  COALESCE(
    json_agg(
      json_build_object(
        'id', mi.id,
        'item_id', mi.item_id,
        'name', mi.name,
        'quantity', mi.quantity,
        'allocated', mi.allocated,
        'active', mi.active
      )
      ORDER BY mi.id
    ) FILTER (WHERE mi.id IS NOT NULL), '[]'
  ) AS items
FROM menus m
LEFT JOIN menu_items mi ON mi.menu_id = m.id
`;

function shapeMenuAggregates(row) {
    const normalizeItems = (arr) => {
        if (!arr) return [];
        try {
            const parsed = Array.isArray(arr) ? arr : JSON.parse(arr);
            return parsed.map((item) => ({
                id: item.id,
                item_id: item.item_id,
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
        items: normalizeItems(row.items)
    };
}

async function insertMenuItems(client, menuId, items) {
    if (!items || !Array.isArray(items) || !items.length) return;
    const values = [];
    const params = [];
    let idx = 1;

    items.forEach((item) => {
        values.push(`($${idx}, $${idx + 1}, $${idx + 2}, $${idx + 3}, $${idx + 4}, $${idx + 5}, $${idx + 6})`);
        params.push(menuId);
        params.push(item.item_id ?? null);
        params.push(item.name ?? null);
        params.push(item.quantity ?? null);
        params.push(item.allocated ?? false);
        params.push(item.active ?? true);
        params.push(item.created_at ?? null);
        idx += 7;
    });

    await client.query(
        `INSERT INTO menu_items (menu_id, item_id, name, quantity, allocated, active, created_at)
         VALUES ${values.join(', ')}`,
        params
    );
}

// Get all menus
exports.getAllMenus = async (req, res) => {
    try {
        const { rows } = await pool.query(
            `${baseMenuSelect} GROUP BY m.id, m.date, m.type ORDER BY m.date DESC, m.type`
        );
        res.status(200).json(rows.map(shapeMenuAggregates));
    } catch (error) {
        res.status(400).json({ error: error.message });
    }
};

exports.createMenu = async (req, res) => {
    const client = await pool.connect();
    try {
        const dateStr = toDateOnly(req.body?.date);
        const type = req.body?.type;
        if (!dateStr) return res.status(400).json({ error: 'Invalid or missing date' });
        if (!type || !['Breakfast','Lunch','Dinner'].includes(type)) {
            return res.status(400).json({ error: 'Invalid or missing type (Breakfast, Lunch, Dinner)' });
        }

        await client.query('BEGIN');
        const { rows: menuRows } = await client.query(
            'INSERT INTO menus (date, type) VALUES ($1, $2) RETURNING id, date, type',
            [dateStr, type]
        );
        const menuId = menuRows[0].id;

        await insertMenuItems(client, menuId, req.body?.items);

        const { rows } = await client.query(
            `${baseMenuSelect} WHERE m.id = $1 GROUP BY m.id, m.date, m.type`,
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
        const { rows } = await pool.query(
            `${baseMenuSelect} WHERE m.id = $1 GROUP BY m.id, m.date, m.type`,
            [req.params.id]
        );
        if (!rows.length) return res.status(404).json({ message: 'Menu not found' });
        res.status(200).json(shapeMenuAggregates(rows[0]));
    } catch (error) {
        res.status(400).json({ error: error.message });
    }
};

exports.getMenuByDate = async (req, res) => {
    try {
        const dateStr = toDateOnly(req.params?.date);
        if (!dateStr) return res.status(400).json({ error: 'Invalid date format. Expected YYYY-MM-DD' });

        const { rows } = await pool.query(
            `${baseMenuSelect} WHERE m.date = $1 GROUP BY m.id, m.date, m.type`,
            [dateStr]
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
        await client.query('BEGIN');

        if (req.body?.date) {
            const dateStr = toDateOnly(req.body.date);
            if (!dateStr) {
                await client.query('ROLLBACK');
                return res.status(400).json({ error: 'Invalid date' });
            }
            await client.query('UPDATE menus SET date = $1 WHERE id = $2', [dateStr, req.params.id]);
        }

        if (req.body?.type) {
            if (!['Breakfast','Lunch','Dinner'].includes(req.body.type)) {
                await client.query('ROLLBACK');
                return res.status(400).json({ error: 'Invalid type' });
            }
            await client.query('UPDATE menus SET type = $1 WHERE id = $2', [req.body.type, req.params.id]);
        }

        if (req.body?.items && Array.isArray(req.body.items)) {
            await client.query('DELETE FROM menu_items WHERE menu_id = $1', [req.params.id]);
            await insertMenuItems(client, req.params.id, req.body.items);
        }

        const { rows } = await client.query(
            `${baseMenuSelect} WHERE m.id = $1 GROUP BY m.id, m.date, m.type`,
            [req.params.id]
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
        const { rowCount } = await pool.query('DELETE FROM menus WHERE id = $1', [req.params.id]);
        if (!rowCount) return res.status(404).json({ message: 'Menu not found' });
        res.status(200).json({ message: 'Menu deleted successfully' });
    } catch (error) {
        res.status(400).json({ error: error.message });
    }
};
