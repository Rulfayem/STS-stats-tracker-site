import { useState, useRef } from "react";
import { storage } from "../firebase";
import { ref, uploadBytes } from "firebase/storage";
import { auth } from "../firebase";

//the URL of our backend stored in .env so its easy to change when we deploy
const API_URL = import.meta.env.VITE_API_URL;

export default function UploadRunPage() {
    const [runFile, setRunFile] = useState(null);
    const [isDragging, setIsDragging] = useState(false);
    const [isUploading, setIsUploading] = useState(false);
    const [message, setMessage] = useState("");
    const fileInputRef = useRef(null);

    const isValidFile = (file) => {
        return file.name.endsWith(".run") || file.name.endsWith(".json");
    };

    const handleFileChange = (e) => {
        const selectedFile = e.target.files[0];
        if (!selectedFile) return;
        if (!isValidFile(selectedFile)) {
            setMessage("Only .run or .json files allowed!");
            return;
        }
        setRunFile(selectedFile);
        setMessage("");
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
            setMessage("Only .run or .json files allowed!");
            return;
        }
        setRunFile(file);
        setMessage("");
    };

    const handleClick = () => {
        fileInputRef.current.click();
    };

    const handleUpload = async () => {
        if (!runFile) return setMessage("No file selected.");
        if (!isValidFile(runFile)) return setMessage("Only .run or .json files are allowed!");

        const user = auth.currentUser;
        if (!user) return setMessage("You must be logged in to upload.");
        setIsUploading(true);
        setMessage("");

        try {
            //reads and parses files
            const text = await runFile.text();
            const data = JSON.parse(text);

            //extracts certain desired data (can always update)
            const extracted = {
                user_id: user.uid,

                //VITAL RUN INFO
                play_id: data.play_id,
                character: data.character_chosen,
                ascension: data.ascension_level,
                floor_reached: data.floor_reached,
                victory: data.victory,
                playtime: data.playtime,

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

                //GOLD & HP PER FLOOR
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

            //sends extracted data to backend to store in neon database
            const response = await fetch(`${API_URL}/api/runs`, {
                method: "POST",
                headers: {
                    "Content-Type": "application/json",
                },
                body: JSON.stringify(extracted),
            });

            const result = await response.json();

            if (!response.ok) {
                setMessage(result.error || "Failed to save run.");
                setIsUploading(false);
                return;
            }

            //backup file sent to firebase storage
            const storageRef = ref(storage, `runs/${user.uid}/${Date.now()}-${runFile.name}`);
            await uploadBytes(storageRef, runFile);


            setMessage("Run uploaded successfully!");
            setRunFile(null);
            fileInputRef.current.value = "";
            setIsDragging(false);
        } catch (err) {
            console.error(err);
            setMessage("Something went wrong. Please try again.");
        }
        setIsUploading(false);
    };

    return (
        <div style={{ padding: "60px 20px", textAlign: "center" }}>
            <h1 style={{ color: "#f2c572" }}>Upload Run</h1>
            <p style={{ color: "#b0907a" }}>
                Upload your Slay the Spire run file below.
            </p>

            {/* drag and drop upload box */}
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
                    transition: "all 0.2s ease",
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
                    accept=".run,.json"
                    style={{ display: "none" }}
                    onChange={handleFileChange}
                />
                {/* show selected file name */}
                {runFile && (
                    <p style={{ marginTop: "15px", color: "#5a1e1e" }}>
                        Selected: {runFile.name}
                    </p>
                )}
            </div>

            {/* success or error message */}
            {message && (
                <p style={{
                    color: message.includes("successfully") ? "#5cb85c" : "#d9534f",
                    marginTop: "10px",
                    fontWeight: "600",
                }}>
                    {message}
                </p>
            )}

            {/* submit button — disabled while uploading or no file selected */}
            <button
                className="btn btn-success mt-3"
                onClick={handleUpload}
                disabled={!runFile || isUploading}
            >
                {isUploading ? "Uploading..." : "Submit Run"}
            </button>
        </div>
    );
}