import { useNavigate } from "react-router-dom";
import { Button } from "react-bootstrap";

export default function ErrorPage() {
    const navigate = useNavigate();

    return (
        <div style={{ textAlign: "center", padding: "100px 20px" }}>

            <h1 style={{ fontFamily: "Georgia, serif", fontSize: "5rem", color: "#f2c572" }}>
                404
            </h1>

            <h2 style={{ fontFamily: "Georgia, serif", color: "#f2c572", marginBottom: "10px" }}>
                Page Not Found
            </h2>

            <p style={{ color: "#b0907a", marginBottom: "30px" }}>
                Looks like you got lost in the Spire...
            </p>

            {/* button to go back home */}
            <Button
                variant="warning"
                className="mt-3 px-4 btn-error-gold"
                onClick={() => navigate("/")}>
                Return to Exordium
            </Button>

        </div>
    );
}

