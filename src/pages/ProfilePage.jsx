/* eslint-disable no-unused-vars */

import { useEffect, useState } from "react";
import { useParams } from "react-router-dom";
import { collection, query, where, getDocs, doc, updateDoc } from "firebase/firestore";
import { ref, uploadBytes, getDownloadURL } from "firebase/storage";
import { db, storage } from "../firebase";
import { useUser } from "../context/UserContext";
import { Modal, Button } from "react-bootstrap";
import "../styles/profilepage.css";

const defaultBanner = "/images/Slay-the-Spire-Banner.jpg";
const defaultPFP = "/images/Ironclad-PFP.png";

//the 4 characters
const characters = [
    { name: "THE_IRONCLAD", label: "Ironclad", image: "/images/Ironclad-Sprite.webp" },
    { name: "THE_SILENT", label: "The Silent", image: "/images/Silent-Sprite.webp" },
    { name: "DEFECT", label: "Defect", image: "/images/Defect-Sprite.webp" },
    { name: "WATCHER", label: "Watcher", image: "/images/Watcher-Sprite.webp" },
];

//formats playtime in seconds into visually appealing hours + minutes
function formatPlaytime(seconds) {
    if (!seconds) return "0m";
    const hours = Math.floor(seconds / 3600);
    const minutes = Math.floor((seconds % 3600) / 60);
    if (hours === 0) return `${minutes}m`;
    return `${hours}h ${minutes}m`;
}

export default function ProfilePage() {
    const { username } = useParams();
    const { user, userProfile } = useUser();

    const [profileData, setProfileData] = useState(null);
    const [profileUid, setProfileUid] = useState(null);
    const [runs, setRuns] = useState([]);
    const [loading, setLoading] = useState(true);
    const [notFound, setNotFound] = useState(false);

    //edit profile modal states
    const [showEditModal, setShowEditModal] = useState(false);
    const [newBannerFile, setNewBannerFile] = useState(null);
    const [newPFPFile, setNewPFPFile] = useState(null);
    const [bannerPreview, setBannerPreview] = useState(null);
    const [pfpPreview, setPFPPreview] = useState(null);
    const [isSaving, setIsSaving] = useState(false);
    const [saveMessage, setSaveMessage] = useState("");

    const isOwnProfile = userProfile?.username === username;
    const API_URL = import.meta.env.VITE_API_URL;

    useEffect(() => {
        const fetchProfile = async () => {
            setLoading(true);
            setNotFound(false);

            try {
                const usersRef = collection(db, "users");
                const userQuery = query(usersRef, where("username", "==", username));
                const querySnap = await getDocs(userQuery);

                if (querySnap.empty) {
                    setNotFound(true);
                    return;
                }

                const foundProfile = querySnap.docs[0].data();
                const foundUid = querySnap.docs[0].id;
                setProfileData(foundProfile);
                setProfileUid(foundUid);

                const response = await fetch(`${API_URL}/api/runs/user/${foundUid}`);
                const runsData = await response.json();
                setRuns(runsData);
            } catch (err) {
                console.error("Error fetching profile:", err);
            } finally {
                setLoading(false);
            }
        };
        fetchProfile();

        //eslint-disable-next-line react-hooks/exhaustive-deps
    }, [username]);

    //calculating general profile stats
    const totalRuns = runs.length;
    const totalWins = runs.filter((r) => r.victory).length;
    const totalLosses = totalRuns - totalWins;
    const overallWinRate = totalRuns > 0 ? ((totalWins / totalRuns) * 100).toFixed(1) : "0.0";
    const totalPlaytime = runs.reduce((sum, r) => sum + (r.playtime || 0), 0);

    //calculates win rate per character
    const characterStats = characters.map((char) => {
        const charRuns = runs.filter((r) => r.character === char.name);
        const charWins = charRuns.filter((r) => r.victory).length;
        const charWinRate = charRuns.length > 0
            ? ((charWins / charRuns.length) * 100).toFixed(1)
            : null;
        return {
            ...char,
            runs: charRuns.length,
            wins: charWins,
            winRate: charWinRate,
        };
    });

    //changing banner display a preview
    const handleBannerChange = (e) => {
        const file = e.target.files[0];
        if (!file) return;
        setNewBannerFile(file);
        setBannerPreview(URL.createObjectURL(file));
    };

    //changing pfp display a preview
    const handlePFPChange = (e) => {
        const file = e.target.files[0];
        if (!file) return;
        setNewPFPFile(file);
        setPFPPreview(URL.createObjectURL(file));
    };

    //uploads new image(s) to firebase storage and updates firestore with the new URL(s)
    const handleSaveProfile = async () => {
        if (!user) return;
        setIsSaving(true);
        setSaveMessage("");

        try {
            const updates = {};

            //for new banner
            if (newBannerFile) {
                const bannerRef = ref(storage, `banners/${user.uid}/banner`);
                await uploadBytes(bannerRef, newBannerFile);
                const bannerURL = await getDownloadURL(bannerRef);
                updates.bannerImage = bannerURL;
            }

            //for new pfp
            if (newPFPFile) {
                const pfpRef = ref(storage, `profilePictures/${user.uid}/pfp`);
                await uploadBytes(pfpRef, newPFPFile);
                const pfpURL = await getDownloadURL(pfpRef);
                updates.profilePicture = pfpURL;
            }

            //only runs if there are changes
            if (Object.keys(updates).length > 0) {
                const userDocRef = doc(db, "users", user.uid);
                await updateDoc(userDocRef, updates);
                setProfileData((prev) => ({ ...prev, ...updates }));
                setTimeout(() => window.location.reload(), 2000);
            }
            setSaveMessage("Profile updated successfully!");
            setNewBannerFile(null);
            setNewPFPFile(null);
            setBannerPreview(null);
            setPFPPreview(null);
        } catch (err) {
            console.error("Error saving profile:", err);
            setSaveMessage("Something went wrong. Please try again.");
        } finally {
            setIsSaving(false);
        }
    };

    //resets modal
    const handleCloseModal = () => {
        setShowEditModal(false);
        setNewBannerFile(null);
        setNewPFPFile(null);
        setBannerPreview(null);
        setPFPPreview(null);
        setSaveMessage("");
    };

    if (loading) {
        return (
            <div className="profile-loading">
                <p>Loading profile...</p>
            </div>
        );
    }

    if (notFound) {
        return (
            <div className="profile-loading">
                <p style={{ color: "#f2c572" }}>Profile not found.</p>
            </div>
        );
    }

    return (
        <div className="profile-wrapper">

            {/* Profile Banner */}
            <div className="profile-banner-section">
                <img
                    src={profileData?.bannerImage || defaultBanner}
                    alt="Profile Banner"
                    className="profile-banner-img"
                />
                <div className="profile-banner-overlay" />
                <div className="profile-identity">
                    <img
                        src={profileData?.profilePicture || defaultPFP}
                        alt="Profile Picture"
                        className="profile-pfp"
                    />
                    <div>
                        <h2 className="profile-username">{profileData?.username}</h2>
                        {isOwnProfile && (
                            <span className="profile-own-badge">Your Profile</span>
                        )}
                    </div>

                    {/* edit profile button only shows on own profile */}
                    {isOwnProfile && (
                        <Button
                            className="btn-edit-profile ms-3"
                            onClick={() => setShowEditModal(true)}
                        >
                            Edit Profile
                        </Button>
                    )}
                </div>
            </div>
            <div className="profile-divider" />

            {/* USER STATS SECTION */}
            <div className="container profile-stats-section">

                {/* general stats row */}
                <div className="row g-3 mb-4">
                    <div className="col-6 col-md-3">
                        <div className="stat-card">
                            <p className="stat-label">Total Runs</p>
                            <p className="stat-value">{totalRuns}</p>
                        </div>
                    </div>
                    <div className="col-6 col-md-3">
                        <div className="stat-card">
                            <p className="stat-label">Wins</p>
                            <p className="stat-value stat-wins">{totalWins}</p>
                        </div>
                    </div>
                    <div className="col-6 col-md-3">
                        <div className="stat-card">
                            <p className="stat-label">Losses</p>
                            <p className="stat-value stat-losses">{totalLosses}</p>
                        </div>
                    </div>
                    <div className="col-6 col-md-3">
                        <div className="stat-card">
                            <p className="stat-label">Overall Win Rate</p>
                            <p className="stat-value">{overallWinRate}%</p>
                        </div>
                    </div>
                    <div className="col-6 col-md-3">
                        <div className="stat-card">
                            <p className="stat-label">Total Playtime</p>
                            <p className="stat-value">{formatPlaytime(totalPlaytime)}</p>
                        </div>
                    </div>

                    {/* temporary placeholder, filled in later */}
                    <div className="col-6 col-md-3">
                        <div className="stat-card">
                            <p className="stat-label">Coming Soon</p>
                            <p className="stat-value">—</p>
                        </div>
                    </div>
                    <div className="col-6 col-md-3">
                        <div className="stat-card">
                            <p className="stat-label">Coming Soon</p>
                            <p className="stat-value">—</p>
                        </div>
                    </div>
                    <div className="col-6 col-md-3">
                        <div className="stat-card">
                            <p className="stat-label">Coming Soon</p>
                            <p className="stat-value">—</p>
                        </div>
                    </div>
                </div>

                {/* character win rates */}
                <h4 className="profile-section-title">Win Rate by Character</h4>
                <div className="row g-3">
                    {characterStats.map((char) => (
                        <div className="col-6 col-md-3" key={char.name}>
                            <div className="character-stat-card">
                                <img
                                    src={char.image}
                                    alt={char.label}
                                    className="char-stat-image"
                                />
                                <p className="char-stat-name">{char.label}</p>
                                <p className="char-stat-winrate">
                                    {char.winRate !== null ? `${char.winRate}%` : "No runs"}
                                </p>
                                <p className="char-stat-runs">
                                    {char.runs} run{char.runs !== 1 ? "s" : ""}
                                </p>
                            </div>
                        </div>
                    ))}
                </div>

            </div>

            {/* EDIT PROFILE MODAL */}
            <Modal show={showEditModal} onHide={handleCloseModal} centered size="lg">
                <Modal.Header closeButton>
                    <Modal.Title>Edit Profile</Modal.Title>
                </Modal.Header>
                <Modal.Body>

                    {/* banner image section */}
                    <p className="edit-section-label">Banner Image</p>
                    <div className="edit-banner-preview">
                        <img
                            src={bannerPreview || profileData?.bannerImage || defaultBanner}
                            alt="Banner Preview"
                            className="edit-banner-img"
                        />
                    </div>
                    <label className="btn-choose-image mt-2 mb-4">
                        Choose Banner Image
                        <input
                            type="file"
                            accept="image/*"
                            style={{ display: "none" }}
                            onChange={handleBannerChange}
                        />
                    </label>

                    {/* profile picture section */}
                    <p className="edit-section-label">Profile Picture</p>
                    <div className="edit-pfp-preview">
                        <img
                            src={pfpPreview || profileData?.profilePicture || defaultPFP}
                            alt="Profile Picture Preview"
                            className="edit-pfp-img"
                        />
                    </div>
                    <label className="btn-choose-image mt-2">
                        Choose Profile Picture
                        <input
                            type="file"
                            accept="image/*"
                            style={{ display: "none" }}
                            onChange={handlePFPChange}
                        />
                    </label>

                    {/* save result message */}
                    {saveMessage && (
                        <p style={{
                            color: saveMessage.includes("successfully") ? "#5cb85c" : "#d9534f",
                            marginTop: "15px",
                            fontWeight: "600",
                        }}>
                            {saveMessage}
                        </p>
                    )}
                </Modal.Body>
                <Modal.Footer>
                    <Button variant="secondary" onClick={handleCloseModal}>
                        Cancel
                    </Button>

                    {/* save changes button */}
                    <Button
                        className="btn-save-changes"
                        onClick={handleSaveProfile}
                        disabled={isSaving || (!newBannerFile && !newPFPFile)}
                    >
                        {isSaving ? "Saving..." : "Save Changes"}
                    </Button>
                </Modal.Footer>
            </Modal>
        </div>
    );
}