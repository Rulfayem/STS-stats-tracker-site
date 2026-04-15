import "../styles/navbar.css";
import "../styles/modal.css";
import { Link } from "react-router-dom";
import { useState, useEffect } from "react";
import { createUserWithEmailAndPassword, signInWithEmailAndPassword, onAuthStateChanged, signOut } from "firebase/auth";
import { auth } from "../firebase";
import { db } from "../firebase";
import { doc, setDoc } from "firebase/firestore";

const siteIcon = "/images/Purple-Scrawl-Art.png";
const siteName = "STS1 Stats Tracker";

export default function Navbar() {

    const [showLogin, setShowLogin] = useState(false);
    const [showSignup, setShowSignup] = useState(false);
    const [loginEmail, setLoginEmail] = useState("");
    const [loginPassword, setLoginPassword] = useState("");
    const [signupEmail, setSignupEmail] = useState("");
    const [signupPassword, setSignupPassword] = useState("");
    const [username, setUsername] = useState("");
    const [user, setUser] = useState(null);
    const [error, setError] = useState("");

    const isLoggedIn = !!user;
    const validateEmail = (email) => email.includes("@");

    //signup function
    const handleSignup = async () => {
        setError("");

        if (!signupEmail || !signupPassword || !username) {
            return setError("Please fill in all fields.");
        }

        if (!validateEmail(signupEmail)) {
            return setError("Please enter a valid email address.");
        }

        try {
            const userCredential = await createUserWithEmailAndPassword(auth, signupEmail, signupPassword);
            const newUser = userCredential.user;

            await setDoc(doc(db, "users", newUser.uid), {
                username: username,
                email: signupEmail,
            });
            setSignupEmail("");
            setSignupPassword("");
            setUsername("");
            setShowSignup(false);
            setError("");
        } catch (err) {
            setError(err.message);
        }
    };

    //login function
    const handleLogin = async () => {
        setError("");

        if (!loginEmail || !loginPassword) {
            return setError("Please fill in all fields.");
        }

        if (!validateEmail(loginEmail)) {
            return setError("Please enter a valid email address.");
        }

        try {
            await signInWithEmailAndPassword(auth, loginEmail, loginPassword);
            setLoginEmail("");
            setLoginPassword("");
            setShowLogin(false);
            setError("");
        } catch (err) {
            setError(err.message);
        }
    };

    //logout function
    const handleLogout = async () => {
        try {
            await signOut(auth);
        } catch (err) {
            console.error(err);
        }
    };

    useEffect(() => {
        const stopListening = onAuthStateChanged(auth, (currentUser) => {
            setUser(currentUser);
        });

        return () => stopListening();
    }, []);

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
                            //shows the logout button if user is ALREADY logged in
                            <button className="btn btn-logout" onClick={handleLogout}>
                                Logout
                            </button>
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
                                        value={loginEmail}
                                        onChange={(e) => setLoginEmail(e.target.value)}
                                    />
                                    <input
                                        type="password"
                                        placeholder="Password"
                                        className="form-control mb-2"
                                        value={loginPassword}
                                        onChange={(e) => setLoginPassword(e.target.value)}
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
                                        value={signupEmail}
                                        onChange={(e) => setSignupEmail(e.target.value)}
                                    />
                                    <input
                                        type="password"
                                        placeholder="Password"
                                        className="form-control mb-2"
                                        value={signupPassword}
                                        onChange={(e) => setSignupPassword(e.target.value)}
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