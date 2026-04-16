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
            const extracted = {
                victory: data.victory,
                character: data.character_chosen,
                floorReached: data.floor_reached,
                cards: data.card_choices,
                relics: data.relics,
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