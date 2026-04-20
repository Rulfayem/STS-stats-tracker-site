import { useEffect, useState } from "react";
import { Link } from "react-router-dom";
import { Container, Row, Col, Card, Table, Spinner } from "react-bootstrap";
import { doc, getDoc } from "firebase/firestore";
import { db } from "../firebase";
import "../styles/characterstats.css";

const API_URL = import.meta.env.VITE_API_URL;
const CHARACTER = "THE_IRONCLAD";
const SPIRE_BASE = "https://spire-codex.com";
const cardPlaceholder = "/images/temp_missing_card.png";

//converts card name from run file to spire-codex card id
const toCardId = (cardName) => {
    return cardName
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

export default function IroncladStatsPage() {
    const [runs, setRuns] = useState([]);
    const [cardData, setCardData] = useState({});
    const [leaderboard, setLeaderboard] = useState([]);
    const [topPickedCards, setTopPickedCards] = useState([]);
    const [topWinrateCards, setTopWinrateCards] = useState([]);
    const [loading, setLoading] = useState(true);

    useEffect(() => {
        const fetchData = async () => {
            try {
                //fetch IRONCLAD runs from backend
                const runsRes = await fetch(`${API_URL}/api/runs/${CHARACTER}`);
                const runsData = await runsRes.json();
                setRuns(runsData);

                //fetch cards from external API
                const cardsRes = await fetch(`${SPIRE_BASE}/api/cards`);
                const cardsArray = await cardsRes.json();

                const cardsMap = {};
                cardsArray.forEach((card) => {
                    cardsMap[card.id] = card;
                });
                setCardData(cardsMap);

                const cardStats = {};
                runsData.forEach((run) => {
                    const choices = run.deck?.choices || [];
                    choices.forEach((choice) => {
                        if (choice.picked === "SKIP") return;
                        const cardId = toCardId(choice.picked);
                        if (!cardStats[cardId]) {
                            cardStats[cardId] = {
                                picks: 0,
                                wins: 0,
                                originalName: choice.picked.replace(/\+\d+$/, "").trim(),
                            };
                        }
                        cardStats[cardId].picks++;
                        if (run.victory) cardStats[cardId].wins++;
                    });
                });

                //most picked cards
                const sortedByPicks = Object.entries(cardStats)
                    .sort((a, b) => b[1].picks - a[1].picks)
                    .slice(0, 8);
                setTopPickedCards(sortedByPicks);

                //highest winrate cards
                const sortedByWinrate = Object.entries(cardStats)
                    .sort((a, b) => (b[1].wins / b[1].picks) - (a[1].wins / a[1].picks))
                    .slice(0, 8);
                setTopWinrateCards(sortedByWinrate);

                //act 4 leaderboard
                const userStats = {};
                runsData.forEach((run) => {
                    if (!userStats[run.user_id]) {
                        userStats[run.user_id] = { totalRuns: 0, act4Clears: 0 };
                    }
                    userStats[run.user_id].totalRuns++;
                    if (run.victory && run.floor_reached >= 57) {
                        userStats[run.user_id].act4Clears++;
                    }
                });

                const sortedUsers = Object.entries(userStats)
                    .filter(([, stats]) => stats.act4Clears > 0)
                    .sort((a, b) => (b[1].act4Clears / b[1].totalRuns) - (a[1].act4Clears / a[1].totalRuns))
                    .slice(0, 5);

                const leaderboardWithNames = await Promise.all(
                    sortedUsers.map(async ([userId, stats], index) => {
                        try {
                            const userDoc = await getDoc(doc(db, "users", userId));
                            const username = userDoc.exists() ? userDoc.data().username : "Unknown";
                            return {
                                rank: index + 1,
                                username,
                                act4Clears: stats.act4Clears,
                                totalRuns: stats.totalRuns,
                                winRate: ((stats.act4Clears / stats.totalRuns) * 100).toFixed(1),
                            };
                        } catch {
                            return {
                                rank: index + 1,
                                username: "Unknown",
                                act4Clears: stats.act4Clears,
                                totalRuns: stats.totalRuns,
                                winRate: ((stats.act4Clears / stats.totalRuns) * 100).toFixed(1),
                            };
                        }
                    })
                );
                setLeaderboard(leaderboardWithNames);
            } catch (err) {
                console.error("Error fetching stats:", err);
            } finally {
                setLoading(false);
            }
        };
        fetchData();
    }, []);

    if (loading) {
        return (
            <div className="stats-loading">
                <Spinner animation="border" variant="warning" />
                <p>Loading stats...</p>
            </div>
        );
    }

    return (
        <Container className="stats-wrapper">

            {/* page title */}
            <div className="text-center mb-4">
                <h1 className="stats-title">Ironclad</h1>
                <p className="stats-subtitle">{runs.length} runs uploaded by the community</p>
            </div>

            {/* ACT 4 LEADERBOARD */}
            <div className="stats-section">
                <h4 className="stats-section-title">🏆 Act 4 Leaderboard</h4>
                {leaderboard.length === 0 ? (
                    <p className="stats-empty">No Act 4 clears yet — be the first!</p>
                ) : (
                    <Table className="leaderboard-table" responsive>
                        <thead>
                            <tr>
                                <th>#</th>
                                <th>Player</th>
                                <th>Act 4 Win Rate</th>
                                <th>Act 4 Clears</th>
                                <th>Total Runs</th>
                            </tr>
                        </thead>
                        <tbody>
                            {leaderboard.map((player) => (
                                <tr key={player.username}>
                                    <td className="leaderboard-rank">{player.rank}</td>
                                    <td>
                                        <Link to={`/profile/${player.username}`} className="leaderboard-link">
                                            {player.username}
                                        </Link>
                                    </td>
                                    <td className="leaderboard-winrate">{player.winRate}%</td>
                                    <td>{player.act4Clears}</td>
                                    <td>{player.totalRuns}</td>
                                </tr>
                            ))}
                        </tbody>
                    </Table>
                )}
            </div>
            <div className="stats-divider" />

            {/* MOST PICKED CARDS */}
            <div className="stats-section">
                <h4 className="stats-section-title">🃏 Most Picked Cards</h4>
                {topPickedCards.length === 0 ? (
                    <p className="stats-empty">No card data yet.</p>
                ) : (
                    <Row className="g-3">
                        {topPickedCards.map(([cardId, stats]) => {
                            const apiCard = cardData[cardId];
                            return (
                                <Col xs={6} md={3} key={cardId}>
                                    <Card className="card-stat-card">
                                        <div className="card-img-wrapper">
                                            <img
                                                src={apiCard?.image_url ? `${SPIRE_BASE}${apiCard.image_url}` : cardPlaceholder}
                                                alt=""
                                                className="card-stat-img"
                                                onError={(e) => { e.target.src = cardPlaceholder; }}
                                            />
                                        </div>
                                        <Card.Body className="card-stat-body">
                                            <p className="card-stat-name">{stats.originalName}</p>
                                            <p className="card-stat-desc">
                                                {apiCard?.description ? cleanDesc(apiCard.description) : "No description available."}
                                            </p>
                                            <p className="card-stat-value">{stats.picks} picks</p>
                                        </Card.Body>
                                    </Card>
                                </Col>
                            );
                        })}
                    </Row>
                )}
            </div>
            <div className="stats-divider" />

            {/* HIGHEST WINRATE CARDS */}
            <div className="stats-section">
                <h4 className="stats-section-title">🏅 Highest Winrate Cards</h4>
                {topWinrateCards.length === 0 ? (
                    <p className="stats-empty">No card data yet.</p>
                ) : (
                    <Row className="g-3">
                        {topWinrateCards.map(([cardId, stats]) => {
                            const apiCard = cardData[cardId];
                            const winRate = ((stats.wins / stats.picks) * 100).toFixed(1);
                            return (
                                <Col xs={6} md={3} key={cardId}>
                                    <Card className="card-stat-card">
                                        <div className="card-img-wrapper">
                                            <img
                                                src={apiCard?.image_url ? `${SPIRE_BASE}${apiCard.image_url}` : cardPlaceholder}
                                                alt=""
                                                className="card-stat-img"
                                                onError={(e) => { e.target.src = cardPlaceholder; }}
                                            />
                                        </div>
                                        <Card.Body className="card-stat-body">
                                            <p className="card-stat-name">{stats.originalName}</p>
                                            <p className="card-stat-desc">
                                                {apiCard?.description ? cleanDesc(apiCard.description) : "No description available."}
                                            </p>
                                            <p className="card-stat-value card-stat-highlight">{winRate}% win rate</p>
                                            <p className="card-stat-subvalue">{stats.picks} picks</p>
                                        </Card.Body>
                                    </Card>
                                </Col>
                            );
                        })}
                    </Row>
                )}
            </div>
        </Container>
    );
}