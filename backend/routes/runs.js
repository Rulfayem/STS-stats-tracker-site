const express = require("express");
const router = express.Router();
const pool = require("../db");


//receives parsed run data from frontend and saves it into the neon database
router.post("/", async (req, res) => {
    const {
        user_id,
        play_id,
        character,
        ascension,
        floor_reached,
        victory,
        playtime,
        neow,
        deck,
        relics,
        potions,
        campfire,
        shop,
        path,
        stats,
        combat,
        events,
        keys,
    } = req.body;

    //make sure the important fields are present
    if (!user_id || !play_id || !character) {
        return res.status(400).json({ error: "Missing required fields." });
    }

    try {
        //inserts requested run data in neon database (unless duplicate play_id, same run)
        const result = await pool.query(
            `INSERT INTO runs 
                (user_id, play_id, character, ascension, floor_reached, victory, playtime, neow, deck, relics, potions, campfire, shop, path, stats, combat, events, keys)
             VALUES 
                ($1, $2, $3, $4, $5, $6, $7, $8, $9, $10, $11, $12, $13, $14, $15, $16, $17, $18)
             ON CONFLICT (play_id) DO NOTHING
             RETURNING *`,
            [
                user_id,
                play_id,
                character,
                ascension,
                floor_reached,
                victory,
                playtime,
                JSON.stringify(neow),
                JSON.stringify(deck),
                JSON.stringify(relics),
                JSON.stringify(potions),
                JSON.stringify(campfire),
                JSON.stringify(shop),
                JSON.stringify(path),
                JSON.stringify(stats),
                JSON.stringify(combat),
                JSON.stringify(events),
                JSON.stringify(keys),
            ]
        );

        //if run was uploaded previously
        if (result.rows.length === 0) {
            return res.status(409).json({ error: "This run has already been uploaded." });
        }
        res.status(201).json({ message: "Run saved successfully!", run: result.rows[0] });
    } catch (err) {
        console.error("Error saving run:", err);
        res.status(500).json({ error: "Something went wrong saving your run." });
    }
});


//fetches all runs for a specific character
router.get("/:character", async (req, res) => {
    const { character } = req.params;

    try {
        const result = await pool.query(
            "SELECT * FROM runs WHERE character = $1",
            [character]
        );
        res.json(result.rows);
    } catch (err) {
        console.error("Error fetching runs:", err);
        res.status(500).json({ error: "Something went wrong fetching runs." });
    }
});


//fetches all runs uploaded by a specific user
router.get("/user/:user_id", async (req, res) => {
    const { user_id } = req.params;

    try {
        const result = await pool.query(
            "SELECT * FROM runs WHERE user_id = $1 ORDER BY uploaded_at DESC",
            [user_id]
        );
        res.json(result.rows);
    } catch (err) {
        console.error("Error fetching user runs:", err);
        res.status(500).json({ error: "Something went wrong fetching user runs." });
    }
});

module.exports = router;