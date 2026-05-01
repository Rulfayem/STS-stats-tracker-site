const express = require("express");
const router = express.Router();
const pool = require("../db");

//add favourite card or relic for user
router.post("/", async (req, res) => {
    const { user_id, item_name, item_type } = req.body;

    //makes sure all fields are valid
    if (!user_id || !item_name || !item_type) {
        return res.status(400).json({ error: "Missing required fields." });
    }

    //item_type must be either CARD or RELIC
    if (item_type !== "card" && item_type !== "relic") {
        return res.status(400).json({ error: "item_type must be 'card' or 'relic'." });
    }

    try {
        const result = await pool.query(
            `INSERT INTO favourites (user_id, favourite_name, favourite_type)
             VALUES ($1, $2, $3)
             RETURNING *`,
            [user_id, item_name, item_type]
        );

        const row = result.rows[0];
        res.status(201).json({
            message: "Favourite added!",
            favorite: {
                id: row.id,
                user_id: row.user_id,
                item_name: row.favourite_name,
                item_type: row.favourite_type,
                created_at: row.created_at,
            }
        });
    } catch (err) {
        console.error("Error adding favourite:", err);
        res.status(500).json({ error: "Something went wrong adding your favourite." });
    }
});


//gets all favourites from user
router.get("/:user_id", async (req, res) => {
    const { user_id } = req.params;

    try {
        const result = await pool.query(
            "SELECT * FROM favourites WHERE user_id = $1 ORDER BY created_at DESC",
            [user_id]
        );

        const rows = result.rows.map((row) => ({
            id: row.id,
            user_id: row.user_id,
            item_name: row.favourite_name,
            item_type: row.favourite_type,
            created_at: row.created_at,
        }));
        res.json(rows);
    } catch (err) {
        console.error("Error fetching favourites:", err);
        res.status(500).json({ error: "Something went wrong fetching your favourites." });
    }
});


//updates user's favourite item
router.put("/:id", async (req, res) => {
    const { id } = req.params;
    const { item_name } = req.body;

    if (!item_name) {
        return res.status(400).json({ error: "item_name is required." });
    }

    try {
        const result = await pool.query(
            `UPDATE favourites SET favourite_name = $1 WHERE id = $2 RETURNING *`,
            [item_name, id]
        );

        //checks if favourite exists
        if (result.rows.length === 0) {
            return res.status(404).json({ error: "Favourite not found." });
        }

        const row = result.rows[0];
        res.json({
            message: "Favourite updated!",
            favorite: {
                id: row.id,
                user_id: row.user_id,
                item_name: row.favourite_name,
                item_type: row.favourite_type,
                created_at: row.created_at,
            }
        });
    } catch (err) {
        console.error("Error updating favourite:", err);
        res.status(500).json({ error: "Something went wrong updating your favourite." });
    }
});


//remove user's favourite item
router.delete("/:id", async (req, res) => {
    const { id } = req.params;

    try {
        const result = await pool.query(
            "DELETE FROM favourites WHERE id = $1 RETURNING *",
            [id]
        );
        if (result.rows.length === 0) {
            return res.status(404).json({ error: "Favourite not found." });
        }
        res.json({ message: "Favourite deleted!" });
    } catch (err) {
        console.error("Error deleting favourite:", err);
        res.status(500).json({ error: "Something went wrong deleting your favourite." });
    }
});

module.exports = router;