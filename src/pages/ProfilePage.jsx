/* eslint-disable no-unused-vars */
import { useEffect, useState } from "react";
import { useParams } from "react-router-dom";
import { collection, query, where, getDocs, doc, updateDoc } from "firebase/firestore";
import { ref, uploadBytes, getDownloadURL } from "firebase/storage";
import { db, storage } from "../firebase";
import { useUser } from "../context/UserContext";
import { Modal, Button, Row, Col, Card, Spinner } from "react-bootstrap";
import "../styles/profilepage.css";

const defaultBanner = "/images/Slay-the-Spire-Banner.jpg";
const defaultPFP = "/images/Ironclad-PFP.png";
const cardPlaceholder = "/images/temp_missing_card.png";
const SPIRE_BASE = "https://spire-codex.com";
const API_URL = import.meta.env.VITE_API_URL;

//the 4 characters
const characters = [
    { name: "THE_IRONCLAD", label: "Ironclad", image: "/images/Ironclad-Sprite.webp" },
    { name: "THE_SILENT", label: "The Silent", image: "/images/Silent-Sprite.webp" },
    { name: "DEFECT", label: "Defect", image: "/images/Defect-Sprite.webp" },
    { name: "WATCHER", label: "Watcher", image: "/images/Watcher-Sprite.webp" },
];

//formats playtime in seconds into hours + minutes
function formatPlaytime(seconds) {
    if (!seconds) return "0m";
    const hours = Math.floor(seconds / 3600);
    const minutes = Math.floor((seconds % 3600) / 60);
    if (hours === 0) return `${minutes}m`;
    return `${hours}h ${minutes}m`;
}

//converts STS thing name to spire-codex id format for use
const toSpireId = (name) => {
    return name
        .replace(/\+\d+$/, "")
        .trim()
        .replace(/([a-z])([A-Z])/g, "$1_$2")
        .toUpperCase()
        .replace(/\s+/g, "_")
        .replace(/-/g, "_");
};

//removes [gold] tags from spire-codex card descriptions
const cleanDesc = (desc) => {
    if (!desc) return "";
    return desc
        .replace(/\[\/?\w+\]/g, "")
        .replace(/\\n/g, " ")
        .trim();
};

export default function ProfilePage() {
    const { username } = useParams();
    const { user, userProfile } = useUser();

    const [profileData, setProfileData] = useState(null);
    const [profileUid, setProfileUid] = useState(null);
    const [runs, setRuns] = useState([]);
    const [loading, setLoading] = useState(true);
    const [notFound, setNotFound] = useState(false);

    const [favourites, setFavourites] = useState([]);
    const [favouriteCardData, setFavouriteCardData] = useState({});

    //edit profile modal states
    const [showEditModal, setShowEditModal] = useState(false);
    const [newBannerFile, setNewBannerFile] = useState(null);
    const [newPFPFile, setNewPFPFile] = useState(null);
    const [bannerPreview, setBannerPreview] = useState(null);
    const [pfpPreview, setPFPPreview] = useState(null);
    const [isSaving, setIsSaving] = useState(false);
    const [saveMessage, setSaveMessage] = useState("");

    const [newFavName, setNewFavName] = useState("");
    const [newFavType, setNewFavType] = useState("card");
    const [favError, setFavError] = useState("");
    const [isAddingFav, setIsAddingFav] = useState(false);

    const isOwnProfile = userProfile?.username === username;

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

                //fetch runs AND favourites at the same time
                const [runsRes, favsRes] = await Promise.all([
                    fetch(`${API_URL}/api/runs/user/${foundUid}`),
                    fetch(`${API_URL}/api/favourites/${foundUid}`),
                ]);

                const runsData = await runsRes.json();

                //safety protocol - experienced crashes
                let safeFavsData = [];
                try {
                    if (favsRes.ok) {
                        const favsData = await favsRes.json();
                        safeFavsData = Array.isArray(favsData) ? favsData : [];
                    }
                } catch {
                    safeFavsData = [];
                }
                setRuns(runsData);
                setFavourites(safeFavsData);

                //fetch spire-codex data for each favourite item
                const spireData = {};
                await Promise.all(
                    safeFavsData.map(async (fav) => {
                        const spireId = toSpireId(fav.item_name);
                        const endpoint = fav.item_type === "card"
                            ? `${SPIRE_BASE}/api/cards/${spireId}`
                            : `${SPIRE_BASE}/api/relics/${spireId}`;
                        try {
                            const res = await fetch(endpoint);
                            if (res.ok) {
                                const data = await res.json();
                                spireData[fav.id] = data;
                            }
                        } catch {
                            //silent fail
                        }
                    })
                );
                setFavouriteCardData(spireData);
            } catch (err) {
                console.error("Error fetching profile:", err);
            } finally {
                setLoading(false);
            }
        };
        fetchProfile();
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
        return { ...char, runs: charRuns.length, wins: charWins, winRate: charWinRate };
    });

    const favouriteCards = favourites.filter((f) => f.item_type === "card");
    const favouriteRelics = favourites.filter((f) => f.item_type === "relic");

    //adds a new favourite card OR relic
    const handleAddFavourite = async () => {
        setFavError("");

        if (!newFavName.trim()) return setFavError("Please enter a name.");

        const limit = newFavType === "card" ? 4 : 4;
        const current = newFavType === "card" ? favouriteCards.length : favouriteRelics.length;

        if (current >= limit) {
            return setFavError(`You can only have 4 favourite ${newFavType}s.`);
        }

        setIsAddingFav(true);
        try {
            const response = await fetch(`${API_URL}/api/favourites`, {
                method: "POST",
                headers: { "Content-Type": "application/json" },
                body: JSON.stringify({
                    user_id: user.uid,
                    item_name: newFavName.trim(),
                    item_type: newFavType,
                }),
            });

            const result = await response.json();
            console.log("Add favourite response:", response.status, result); //temporary log debugging
            if (!response.ok) {
                setFavError(result.error || "Failed to add favourite.");
                setIsAddingFav(false);
                return;
            }

            const newFav = result.favorite;

            //fetch spire-codex data for the added item
            const spireId = toSpireId(newFav.item_name);
            const endpoint = newFavType === "card"
                ? `${SPIRE_BASE}/api/cards/${spireId}`
                : `${SPIRE_BASE}/api/relics/${spireId}`;
            try {
                const spireRes = await fetch(endpoint);
                if (spireRes.ok) {
                    const spireData = await spireRes.json();
                    setFavouriteCardData((prev) => ({ ...prev, [newFav.id]: spireData }));
                }
            } catch {
                //silently fail..?
            }
            setFavourites((prev) => [...prev, newFav]);
            setNewFavName("");
        } catch (err) {
            setFavError("Something went wrong.");
        }
        setIsAddingFav(false);
    };

    //remove a favourite item
    const handleRemoveFavourite = async (favId) => {
        try {
            await fetch(`${API_URL}/api/favourites/${favId}`, { method: "DELETE" });
            setFavourites((prev) => prev.filter((f) => f.id !== favId));
            setFavouriteCardData((prev) => {
                const updated = { ...prev };
                delete updated[favId];
                return updated;
            });
        } catch (err) {
            console.error("Error removing favourite:", err);
        }
    };

    //handles banner image selection and preview
    const handleBannerChange = (e) => {
        const file = e.target.files[0];
        if (!file) return;
        setNewBannerFile(file);
        setBannerPreview(URL.createObjectURL(file));
    };

    //handles profile picture selection and preview
    const handlePFPChange = (e) => {
        const file = e.target.files[0];
        if (!file) return;
        setNewPFPFile(file);
        setPFPPreview(URL.createObjectURL(file));
    };

    //saves images to firebase storage and updates firestore
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
        setNewFavName("");
        setFavError("");
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
                <div className="row g-3 mb-5">
                    {characterStats.map((char) => (
                        <div className="col-6 col-md-3" key={char.name}>
                            <div className="character-stat-card">
                                <img src={char.image} alt={char.label} className="char-stat-image" />
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

                {/* FAVOURITES SECTION */}

                {/* favourite card(s) */}
                <h4 className="profile-section-title">Favourite Cards</h4>
                {favouriteCards.length === 0 ? (
                    <p className="profile-empty-fav">No favourite cards added yet.</p>
                ) : (
                    <Row className="g-3 mb-4">
                        {favouriteCards.map((fav) => {
                            const spireData = favouriteCardData[fav.id];
                            return (
                                <Col xs={6} md={3} key={fav.id}>
                                    <Card className="fav-card">
                                        <div className="fav-img-wrapper">
                                            <img
                                                src={spireData?.image_url ? `${SPIRE_BASE}${spireData.image_url}` : cardPlaceholder}
                                                alt=""
                                                className="fav-img"
                                                onError={(e) => { e.target.src = cardPlaceholder; }}
                                            />
                                        </div>
                                        <Card.Body className="fav-body">
                                            <p className="fav-name">{fav.item_name}</p>
                                            {spireData?.description && (
                                                <p className="fav-desc">{cleanDesc(spireData.description)}</p>
                                            )}
                                        </Card.Body>
                                    </Card>
                                </Col>
                            );
                        })}
                    </Row>
                )}

                {/* favourite relic(s) */}
                <h4 className="profile-section-title">Favourite Relics</h4>
                {favouriteRelics.length === 0 ? (
                    <p className="profile-empty-fav">No favourite relics added yet.</p>
                ) : (
                    <Row className="g-3 mb-4">
                        {favouriteRelics.map((fav) => {
                            const spireData = favouriteCardData[fav.id];
                            return (
                                <Col xs={6} md={3} key={fav.id}>
                                    <Card className="fav-card">
                                        <div className="fav-img-wrapper">
                                            <img
                                                src={spireData?.image_url ? `${SPIRE_BASE}${spireData.image_url}` : cardPlaceholder}
                                                alt=""
                                                className="fav-img"
                                                onError={(e) => { e.target.src = cardPlaceholder; }}
                                            />
                                        </div>
                                        <Card.Body className="fav-body">
                                            <p className="fav-name">{fav.item_name}</p>
                                            {spireData?.description && (
                                                <p className="fav-desc">{cleanDesc(spireData.description)}</p>
                                            )}
                                        </Card.Body>
                                    </Card>
                                </Col>
                            );
                        })}
                    </Row>
                )}

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
                        <input type="file" accept="image/*" style={{ display: "none" }} onChange={handleBannerChange} />
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
                    <label className="btn-choose-image mt-2 mb-4">
                        Choose Profile Picture
                        <input type="file" accept="image/*" style={{ display: "none" }} onChange={handlePFPChange} />
                    </label>

                    {/* save result message */}
                    {saveMessage && (
                        <p style={{ color: saveMessage.includes("successfully") ? "#5cb85c" : "#d9534f", marginBottom: "15px", fontWeight: "600" }}>
                            {saveMessage}
                        </p>
                    )}

                    <hr style={{ borderColor: "#b26a4a" }} />

                    {/* FAVOURITES SECTION IN MODAL */}
                    <p className="edit-section-label">Favourite Cards & Relics</p>
                    <p style={{ fontSize: "0.85rem", color: "#b26a4a" }}>
                        Up to 4 favourite cards and 4 favourite relics. Type the exact name as it appears in game.
                    </p>

                    {/* add new favourite input */}
                    <div className="d-flex gap-2 mb-3 flex-wrap">
                        <input
                            type="text"
                            className="form-control"
                            placeholder={`Enter ${newFavType} name e.g. ${newFavType === "card" ? "Footwork" : "Burning Blood"}`}
                            value={newFavName}
                            onChange={(e) => setNewFavName(e.target.value)}
                            style={{ maxWidth: "260px" }}
                        />
                        {/* toggle between card and relic */}
                        <select
                            className="form-select"
                            value={newFavType}
                            onChange={(e) => setNewFavType(e.target.value)}
                            style={{ maxWidth: "110px" }}
                        >
                            <option value="card">Card</option>
                            <option value="relic">Relic</option>
                        </select>
                        <button
                            className="btn-choose-image"
                            onClick={handleAddFavourite}
                            disabled={isAddingFav}
                        >
                            {isAddingFav ? "Adding..." : "Add"}
                        </button>
                    </div>
                    <p style={{ color: "#b26a4a", fontSize: "0.8rem", fontStyle: "italic", marginBottom: "8px" }}>
                        ⚠️ Name must match exactly as it appears in game e.g. Footwork, Burning Blood
                    </p>
                    {favError && <p style={{ color: "#d9534f", fontSize: "0.85rem" }}>{favError}</p>}

                    {/* current favourite cards list */}
                    <p style={{ fontWeight: "700", color: "#5a2d1f", marginBottom: "6px" }}>
                        Favourite Cards ({favouriteCards.length}/4)
                    </p>
                    {favouriteCards.length === 0 ? (
                        <p style={{ color: "#b26a4a", fontSize: "0.85rem", marginBottom: "10px" }}>None added yet.</p>
                    ) : (
                        <div className="fav-list mb-3">
                            {favouriteCards.map((fav) => (
                                <div key={fav.id} className="fav-list-item">
                                    <span>{fav.item_name}</span>
                                    <button className="fav-remove-btn" onClick={() => handleRemoveFavourite(fav.id)}>✕</button>
                                </div>
                            ))}
                        </div>
                    )}

                    {/* current favourite relics list */}
                    <p style={{ fontWeight: "700", color: "#5a2d1f", marginBottom: "6px" }}>
                        Favourite Relics ({favouriteRelics.length}/4)
                    </p>
                    {favouriteRelics.length === 0 ? (
                        <p style={{ color: "#b26a4a", fontSize: "0.85rem" }}>None added yet.</p>
                    ) : (
                        <div className="fav-list">
                            {favouriteRelics.map((fav) => (
                                <div key={fav.id} className="fav-list-item">
                                    <span>{fav.item_name}</span>
                                    <button className="fav-remove-btn" onClick={() => handleRemoveFavourite(fav.id)}>✕</button>
                                </div>
                            ))}
                        </div>
                    )}
                </Modal.Body>
                <Modal.Footer>
                    <Button variant="secondary" onClick={handleCloseModal}>
                        Close
                    </Button>
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