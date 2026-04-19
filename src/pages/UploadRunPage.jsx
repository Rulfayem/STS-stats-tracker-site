import { useState, useRef } from "react";
import { Container } from "react-bootstrap";
import { storage } from "../firebase";
import { ref, uploadBytes } from "firebase/storage";
import { auth } from "../firebase";

//the URL of our backend stored in .env so its easy to change when we deploy
const API_URL = import.meta.env.VITE_API_URL;

export default function UploadRunPage() {
    const [isDragging, setIsDragging] = useState(false);
    const [isUploading, setIsUploading] = useState(false);
    const [message, setMessage] = useState("");
    const [progress, setProgress] = useState({ current: 0, total: 0 });

    const fileInputRef = useRef(null);
    const folderInputRef = useRef(null);

    const isValidFile = (file) => {
        return file.name.endsWith(".run") || file.name.endsWith(".json");
    };

    const extractRunData = (data, userId) => ({
        user_id: userId,

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
    });

    //handles uploading only SINGLE FILES
    const uploadSingleFile = async (file, user) => {
        const text = await file.text();
        const data = JSON.parse(text);
        const extracted = extractRunData(data, user.uid);

        //sends extracted data to backend to store in neon database
        const response = await fetch(`${API_URL}/api/runs`, {
            method: "POST",
            headers: { "Content-Type": "application/json" },
            body: JSON.stringify(extracted),
        });

        const result = await response.json();

        if (response.status === 409) return "duplicate";
        if (!response.ok) throw new Error(result.error || "Failed to save run.");

        //backup file sent to firebase storage
        const storageRef = ref(storage, `runs/${user.uid}/${Date.now()}-${file.name}`);
        await uploadBytes(storageRef, file);

        return "success";
    };

    //handles uploading MULTIPLE FILES
    const handleUploadFiles = async (files) => {
        const user = auth.currentUser;
        if (!user) return setMessage("You must be logged in to upload.");

        const validFiles = files.filter(isValidFile);
        if (validFiles.length === 0) return setMessage("No valid .run or .json files found.");

        setIsUploading(true);
        setMessage("");
        setProgress({ current: 0, total: validFiles.length });

        let successCount = 0;
        let duplicateCount = 0;
        let errorCount = 0;

        //loops through each file in a batch
        for (let i = 0; i < validFiles.length; i++) {
            setProgress({ current: i + 1, total: validFiles.length });
            try {
                const result = await uploadSingleFile(validFiles[i], user);
                if (result === "success") successCount++;
                if (result === "duplicate") duplicateCount++;
            } catch (err) {
                console.error(`Error uploading ${validFiles[i].name}:`, err);
                errorCount++;
            }
        }

        //summary message generation after all files processed
        let summary = "";
        if (successCount > 0) summary += `${successCount} run${successCount !== 1 ? "s" : ""} file(s) uploaded successfully! `;
        if (duplicateCount > 0) summary += `${duplicateCount} file(s) already uploaded (skipped). `;
        if (errorCount > 0) summary += `${errorCount} file(s) failed.`;

        setMessage(summary.trim());
        setIsUploading(false);
        setProgress({ current: 0, total: 0 });
    };

    const handleFileChange = (e) => {
        const files = Array.from(e.target.files);
        if (files.length === 0) return;
        handleUploadFiles(files);
    };

    const handleDrop = async (e) => {
        e.preventDefault();
        setIsDragging(false);

        const items = e.dataTransfer.items;
        const files = [];

        //for folders, it reads each file... RECURSIVELY 
        const readEntry = (entry) => {
            return new Promise((resolve) => {
                if (entry.isFile) {
                    entry.file((file) => { files.push(file); resolve(); });
                } else if (entry.isDirectory) {
                    const reader = entry.createReader();
                    reader.readEntries(async (entries) => {
                        for (const subEntry of entries) await readEntry(subEntry);
                        resolve();
                    });
                }
            });
        };

        for (const item of items) {
            const entry = item.webkitGetAsEntry();
            if (entry) await readEntry(entry);
        }
        handleUploadFiles(files);
    };

    const handleDragOver = (e) => {
        e.preventDefault();
        setIsDragging(true);
    };

    const handleDragLeave = () => setIsDragging(false);

    return (
        <Container style={{ padding: "60px 20px", textAlign: "center", maxWidth: "600px" }}>
            <h1 style={{ color: "#f2c572" }}>Upload Runs</h1>
            <p style={{ color: "#b0907a" }}>
                Drop a single file, multiple files, or an entire folder of runs below.
            </p>

            {/* drag and drop upload box */}
            <div
                onDragOver={handleDragOver}
                onDragLeave={handleDragLeave}
                onDrop={handleDrop}
                style={{
                    margin: "30px auto",
                    padding: "40px",
                    border: isDragging ? "2px solid #fff3d6" : "2px dashed #d4a373",
                    borderRadius: "10px",
                    background: isDragging ? "rgba(244, 225, 193, 0.15)" : "rgba(255, 248, 240, 0.07)",
                    transition: "all 0.2s ease",
                    cursor: "default",
                }}
            >
                <p style={{ color: "#fff3d6", fontSize: "2rem", margin: "0 0 10px" }}>
                    {isDragging ? "📂" : "🗂️"}
                </p>
                <p style={{ color: isDragging ? "#fff3d6" : "#d4a373", marginBottom: "6px", fontWeight: "600" }}>
                    {isDragging ? "Drop your files or folder here!" : "Drag & drop files or a folder here"}
                </p>
                <p style={{ color: "#b0907a", fontSize: "0.85rem", marginBottom: "20px" }}>
                    Accepts .run and .json files
                </p>

                {/* buttons to select files or folder */}
                <div className="d-flex gap-2 justify-content-center">
                    <button
                        className="btn btn-upload-run"
                        onClick={() => fileInputRef.current.click()}
                        disabled={isUploading}
                    >
                        Select File(s)
                    </button>
                    <button
                        className="btn btn-upload-run"
                        onClick={() => folderInputRef.current.click()}
                        disabled={isUploading}
                    >
                        Select Folder
                    </button>
                </div>

                {/* hidden input for selecting multiple individual files */}
                <input
                    type="file"
                    ref={fileInputRef}
                    accept=".run,.json"
                    multiple
                    style={{ display: "none" }}
                    onChange={handleFileChange}
                />

                {/* hidden input for selecting a whole folder */}
                <input
                    type="file"
                    ref={folderInputRef}
                    webkitdirectory="true"
                    style={{ display: "none" }}
                    onChange={handleFileChange}
                />
            </div>

            {/* progress bar shown while uploading multiple files */}
            {isUploading && progress.total > 0 && (
                <div style={{ marginTop: "15px" }}>
                    <p style={{ color: "#f2c572", fontWeight: "600" }}>
                        Uploading {progress.current} of {progress.total}...
                    </p>
                    <div className="progress" style={{ height: "10px", borderRadius: "5px" }}>
                        <div
                            className="progress-bar bg-warning"
                            style={{
                                width: `${(progress.current / progress.total) * 100}%`,
                                transition: "width 0.3s ease",
                            }}
                        />
                    </div>
                </div>
            )}

            {/* success or error message */}
            {message && !isUploading && (
                <p style={{
                    color: message.includes("successfully") ? "#5cb85c" : "#f2c572",
                    marginTop: "15px",
                    fontWeight: "600",
                }}>
                    {message}
                </p>
            )}

        </Container>
    );
}