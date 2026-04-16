import { useNavigate } from "react-router-dom";
import "../styles/homepage.css";

//the 4 characters with their names, images, and which page to go to when clicked
const characters = [
    {
        name: "Ironclad",
        image: "/images/Ironclad-Sprite.webp",
        route: "/character/ironclad",
        description: "The remaining soldier of the Ironclads. Sold his soul to harness demonic energies.",
    },
    {
        name: "The Silent",
        image: "/images/Silent-Sprite.webp",
        route: "/character/silent",
        description: "A deadly huntress from the foglands. Eradicates foes with daggers and poisons.",
    },
    {
        name: "Defect",
        image: "/images/Defect-Sprite.webp",
        route: "/character/defect",
        description: "Combat automaton which became self-aware. Ancient technology allows manipulation of Orbs.",
    },
    {
        name: "Watcher",
        image: "/images/Watcher-Sprite.webp",
        route: "/character/watcher",
        description: "A blind ascetic who has come to Evaluate the Spire. Master of the divine Stances.",
    },
];

export default function HomePage() {

    const navigate = useNavigate();

    return (
        <div className="homepage-wrapper">

            {/* title section */}
            <div className="homepage-title text-center mb-5">
                <h1 className="homepage-heading">Slay the Spire Stats</h1>
                <p className="homepage-subheading">
                    Choose your character!
                </p>
            </div>

            {/* character cards */}
            <div className="container">
                <div className="row justify-content-center g-4">

                    {/* loop through each character and make a card */}
                    {characters.map((character) => (
                        <div className="col-12 col-sm-6 col-lg-3" key={character.name}>
                            <div
                                className="character-card"
                                onClick={() => navigate(character.route)}
                            >
                                {/* character image */}
                                <div className="character-image-wrapper">
                                    <img
                                        src={character.image}
                                        alt={character.name}
                                        className="character-image"
                                    />
                                </div>

                                {/* character name and description */}
                                <div className="character-info">
                                    <h5 className="character-name">{character.name}</h5>
                                    <p className="character-description">{character.description}</p>
                                </div>
                            </div>
                        </div>
                    ))}
                </div>
            </div>

        </div>
    );
}