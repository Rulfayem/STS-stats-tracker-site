import { useEffect, useState } from "react";
import { useParams } from "react-router-dom";
import { collection, query, where, getDocs } from "firebase/firestore";
import { db } from "../firebase";
import { useUser } from "../context/UserContext";
import "../styles/profilepage.css";

const defaultBanner = "/images/Slay-the-Spire-Banner.jpg";
const defaultPFP = "/images/Ironclad-PFP.png";

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
    const { userProfile } = useUser();
    const [profileData, setProfileData] = useState(null);
    const [runs, setRuns] = useState([]);
    const [loading, setLoading] = useState(true);
    const [notFound, setNotFound] = useState(false);

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

        // eslint-disable-next-line react-hooks/exhaustive-deps
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
                    <h2 className="profile-username">{profileData?.username}</h2>
                    {isOwnProfile && (
                        <span className="profile-own-badge">Your Profile</span>
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
        </div>
    );
}