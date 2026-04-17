import { useState, useRef } from "react";
import { storage } from "../firebase";
import { ref, uploadBytes } from "firebase/storage";
import { auth, } from "../firebase";

export default function UploadRunPage() {
    const [runFile, setRunFile] = useState(null);
    const [isDragging, setIsDragging] = useState(false);
    const fileInputRef = useRef(null);

    const isValidFile = (file) => {
        return file.name.endsWith(".run") || file.name.endsWith(".json"); //might have to change later after testing
    };

    const handleFileChange = (e) => {
        const selectedFile = e.target.files[0];
        if (!selectedFile) return;

        if (!isValidFile(selectedFile)) {
            alert("Only .run or .json files allowed!");
            return;
        }
        setRunFile(selectedFile);
    };

    const handleDragOver = (e) => {
        e.preventDefault();
        setIsDragging(true);
    };

    const handleDragLeave = () => {
        setIsDragging(false);
    };

    const handleDrop = (e) => {
        e.preventDefault();
        setIsDragging(false);
        const file = e.dataTransfer.files[0];
        if (!file) return;

        if (!isValidFile(file)) {
            alert("Only .run or .json files allowed!");
            return;
        }
        setRunFile(file);
    };

    const handleClick = () => {
        fileInputRef.current.click();
    };

    const handleUpload = async () => {
        if (!runFile) return alert("No file selected");

        if (!isValidFile(runFile)) {
            return alert("Only .run or .json files are allowed!");
        }

        try {
            const user = auth.currentUser;
            if (!user) {
                alert("You must be logged in to upload.");
                return;
            }
            const text = await runFile.text();
            const data = JSON.parse(text);
            console.log(data);

            //will observe if might need to change some of these
            const extracted = {
                //VITAL RUN INFO
                character: data.character_chosen,
                ascension: data.ascension_level,
                floorReached: data.floor_reached,
                victory: data.victory,
                playtime: data.playtime,
                playId: data.play_id,

                //NEOW BONUS
                neow: {
                    bonus: data.neow_bonus,
                    cost: data.neow_cost,
                    bonusLog: data.neow_bonus_log,
                    skippedBonuses: data.neow_bonuses_skipped_log,
                    skippedCosts: data.neow_costs_skipped_log,
                },

                //DECK
                deck: {
                    final: data.master_deck,
                    choices: data.card_choices,
                },

                //RELICS
                relics: {
                    final: data.relics,
                    obtained: data.relics_obtained,
                    bossChoices: data.boss_relics,
                },

                //POTIONS
                potions: {
                    obtained: data.potions_obtained,
                    spawnedPerFloor: data.potions_floor_spawned,
                    used: data.potions_floor_usage,
                    usagePerFloor: data.potion_use_per_floor,
                    discarded: data.potion_discard_per_floor,
                },

                //CAMPFIRES
                campfire: {
                    choices: data.campfire_choices,
                },

                //MERCHANT 
                shop: {
                    purchased: data.items_purchased,
                    purchaseFloors: data.item_purchase_floors,
                    purged: data.items_purged,
                    purgedFloors: data.items_purged_floors,
                    contents: data.shop_contents,
                },

                //PATHING
                path: {
                    taken: data.path_taken,
                    perFloor: data.path_per_floor,
                },

                //GOLD & HP per FLOOR
                stats: {
                    currentHpPerFloor: data.current_hp_per_floor,
                    maxHpPerFloor: data.max_hp_per_floor,
                    goldPerFloor: data.gold_per_floor,
                    finalGold: data.gold,
                },

                //COMBAT ENCOUNTERS
                combat: {
                    damageTaken: data.damage_taken,
                },

                //EVENTS
                events: data.event_choices,

                //ACT 4 KEYS
                keys: {
                    green: data.green_key_taken_log,
                    blue: data.blue_key_relic_skipped_log,
                },
            };
            console.log("EXTRACTED:", extracted);
            const storageRef = ref(
                storage,
                `runs/${user.uid}/${Date.now()}-${runFile.name}`
            );
            await uploadBytes(storageRef, runFile);
            alert("Upload successful!");
            setRunFile(null);
            fileInputRef.current.value = "";
            setIsDragging(false);
        } catch (err) {
            console.error(err);
            alert("Upload failed.");
        }
    };

    return (
        <div style={{ padding: "60px 20px", textAlign: "center" }}>
            <h1 style={{ color: "#f2c572" }}>Upload Run</h1>
            <p style={{ color: "#b0907a" }}>
                Upload your Slay the Spire run file below.
            </p>

            {/* upload file box */}
            <div
                onClick={handleClick}
                onDragOver={handleDragOver}
                onDragLeave={handleDragLeave}
                onDrop={handleDrop}
                style={{
                    margin: "30px auto",
                    padding: "40px",
                    maxWidth: "500px",
                    border: isDragging ? "2px solid #fff3d6" : "2px dashed #d4a373",
                    borderRadius: "10px",
                    background: isDragging ? "#f4e1c1" : "#fff8f0",
                    cursor: "pointer",
                    transition: "all 0.2s ease"
                }}
            >
                <p style={{ color: "#5a1e1e", marginBottom: "10px" }}>
                    {isDragging ? "Drop your file here." : "Drag & drop your run file here!"}
                </p>
                <p style={{ color: "#b0907a", fontSize: "0.9rem" }}>
                    Or click to upload.
                </p>
                <input
                    type="file"
                    ref={fileInputRef}
                    accept=".run,.json" //might have to change after testing
                    style={{ display: "none" }}
                    onChange={handleFileChange}
                />
                {runFile && (
                    <p style={{ marginTop: "15px", color: "#5a1e1e" }}>
                        Selected: {runFile.name}
                    </p>
                )}
            </div>
            <button
                className="btn btn-success mt-3"
                onClick={handleUpload}
                disabled={!runFile}
            >
                Submit Run
            </button>
        </div>
    );
}