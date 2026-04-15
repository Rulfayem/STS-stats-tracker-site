import "../styles/navbar.css";
import "../styles/modal.css";
import { Link } from "react-router-dom";
import { useState } from "react";
import { createUserWithEmailAndPassword, signInWithEmailAndPassword } from "firebase/auth";
import { auth } from "../firebase";

const siteIcon = "/images/Purple-Scrawl-Art.png";
const siteName = "STS1 Stats Tracker";

//temporary placeholder, replace with real firebase auth later
const temporaryIsLoggedIn = false;

export default function Navbar() {

    const [showLogin, setShowLogin] = useState(false);
    const [showSignup, setShowSignup] = useState(false);
    const [email, setEmail] = useState("");
    const [password, setPassword] = useState("");
    const [username, setUsername] = useState("");
    const [error, setError] = useState("");

    const isLoggedIn = temporaryIsLoggedIn;
    const validateEmail = (email) => email.includes("@");

    const handleSignup = async () => {
        setError("");

        if (!email || !password || !username) {
            return setError("Please fill in all fields.");
        }

        if (!validateEmail(email)) {
            return setError("Please enter a valid email address.");
        }

        try {
            await createUserWithEmailAndPassword(auth, email, password);
            setShowSignup(false);
        } catch (err) {
            setError(err.message);
        }
    };

    const handleLogin = async () => {
        setError("");

        if (!email || !password) {
            return setError("Please fill in all fields.");
        }

        if (!validateEmail(email)) {
            return setError("Please enter a valid email address.");
        }

        try {
            await signInWithEmailAndPassword(auth, email, password);
            setShowLogin(false);
        } catch (err) {
            setError(err.message);
        }
    };

    return (
        <>
            <nav className="navbar spire-navbar sticky-top">
                <div className="container-fluid px-4">

                    {/* left side of navbar, site logo and site name */}
                    <Link className="navbar-brand d-flex align-items-center gap-2" to="/">
                        <img src={siteIcon} alt="Site Logo" style={{ height: "36px", width: "36px", objectFit: "contain" }} />
                        <span className="navbar-site-name">{siteName}</span>
                    </Link>

                    {/* right side of navbar, login/signup or logout buttons */}
                    <div className="d-flex gap-2">
                        {isLoggedIn ? (
                            //shows the logout buttin if user is ALREADY logged in
                            <button className="btn btn-logout">Logout</button>
                        ) : (
                            //shows the login/signup button if user is NOT YET logged in
                            <>
                                <button
                                    className="btn btn-login"
                                    onClick={() => {
                                        setShowSignup(false);
                                        setShowLogin(true);
                                    }}
                                >
                                    Login
                                </button>

                                <button
                                    className="btn btn-signup"
                                    onClick={() => {
                                        setShowLogin(false);
                                        setShowSignup(true);
                                    }}
                                >
                                    Sign Up
                                </button>
                            </>
                        )}
                    </div>
                </div>
            </nav>

            {/* modal for LOGIN */}
            {showLogin && (
                <>
                    <div className="modal fade show" style={{ display: "block" }}>
                        <div className="modal-dialog">
                            <div className="modal-content">
                                <div className="modal-header">
                                    <h5 className="modal-title">Login</h5>
                                    <button className="btn-close" onClick={() => setShowLogin(false)}></button>
                                </div>
                                <div className="modal-body">
                                    {/* login form */}
                                    <input
                                        type="email"
                                        placeholder="Email"
                                        className="form-control mb-2"
                                        value={email}
                                        onChange={(e) => setEmail(e.target.value)}
                                    />
                                    <input
                                        type="password"
                                        placeholder="Password"
                                        className="form-control mb-2"
                                        value={password}
                                        onChange={(e) => setPassword(e.target.value)}
                                    />
                                    {error && <p className="text-danger">{error}</p>}
                                    <button className="btn btn-primary w-100" onClick={handleLogin}>
                                        Login
                                    </button>
                                </div>
                            </div>
                        </div>
                    </div>
                    <div className="modal-backdrop fade show" onClick={() => setShowLogin(false)}></div>
                </>
            )}

            {/* modal for SIGNUP */}
            {showSignup && (
                <>
                    <div className="modal fade show" style={{ display: "block" }}>
                        <div className="modal-dialog">
                            <div className="modal-content">
                                <div className="modal-header">
                                    <h5 className="modal-title">Sign Up</h5>
                                    <button className="btn-close" onClick={() => setShowSignup(false)}></button>
                                </div>
                                <div className="modal-body">
                                    {/* signup form */}
                                    <input
                                        type="text"
                                        placeholder="Username"
                                        className="form-control mb-2"
                                        value={username}
                                        onChange={(e) => setUsername(e.target.value)}
                                    />
                                    <input
                                        type="email"
                                        placeholder="Email"
                                        className="form-control mb-2"
                                        value={email}
                                        onChange={(e) => setEmail(e.target.value)}
                                    />
                                    <input
                                        type="password"
                                        placeholder="Password"
                                        className="form-control mb-2"
                                        value={password}
                                        onChange={(e) => setPassword(e.target.value)}
                                    />
                                    {error && <p className="text-danger">{error}</p>}
                                    <button className="btn btn-success w-100" onClick={handleSignup}>
                                        Sign Up
                                    </button>
                                </div>
                            </div>
                        </div>
                    </div>
                    <div className="modal-backdrop fade show" onClick={() => setShowSignup(false)}></div>
                </>
            )}
        </>
    );
}