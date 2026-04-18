import "../styles/navbar.css";
import "../styles/modal.css";
import { Link, useLocation } from "react-router-dom";
import { useState } from "react";
import { createUserWithEmailAndPassword, signInWithEmailAndPassword, signOut } from "firebase/auth";
import { auth, db } from "../firebase";
import { doc, setDoc } from "firebase/firestore";
import { Modal } from "react-bootstrap";
import { useUser } from "../context/UserContext";

const siteIcon = "/images/Purple-Scrawl-Art.png";
const siteName = "STS1 Stats Tracker";
const defaultPFP = "/images/Ironclad-PFP.png";

export default function Navbar() {

    const { user, userProfile } = useUser();
    const isLoggedIn = !!user;
    const [showLogin, setShowLogin] = useState(false);
    const [showSignup, setShowSignup] = useState(false);
    const [loginEmail, setLoginEmail] = useState("");
    const [loginPassword, setLoginPassword] = useState("");
    const [signupEmail, setSignupEmail] = useState("");
    const [signupPassword, setSignupPassword] = useState("");
    const [username, setUsername] = useState("");
    const [loginError, setLoginError] = useState("");
    const [signupError, setSignupError] = useState("");

    const validateEmail = (email) => email.includes("@");
    const location = useLocation();
    const isUploadPage = location.pathname === "/upload";

    //signup function
    const handleSignup = async () => {
        setSignupError("");

        if (!signupEmail || !signupPassword || !username) {
            return setSignupError("Please fill in all fields.");
        }

        if (!validateEmail(signupEmail)) {
            return setSignupError("Please enter a valid email address.");
        }

        try {
            const userCredential = await createUserWithEmailAndPassword(auth, signupEmail, signupPassword);
            const newUser = userCredential.user;

            await setDoc(doc(db, "users", newUser.uid), {
                username: username,
                email: signupEmail,
                profilePicture: "",
                bannerImage: "",
            });
            setSignupEmail("");
            setSignupPassword("");
            setUsername("");
            setShowSignup(false);
            setSignupError("");
        } catch (err) {
            setSignupError(err.message);
        }
    };

    //login function
    const handleLogin = async () => {
        setLoginError("");

        if (!loginEmail || !loginPassword) {
            return setLoginError("Please fill in all fields.");
        }

        if (!validateEmail(loginEmail)) {
            return setLoginError("Please enter a valid email address.");
        }

        try {
            await signInWithEmailAndPassword(auth, loginEmail, loginPassword);
            setLoginEmail("");
            setLoginPassword("");
            setShowLogin(false);
            setLoginError("");
        } catch (err) {
            setLoginError(err.message);
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

    return (
        <>
            {/* NAVBAR */}
            <nav className="navbar spire-navbar sticky-top">
                <div className="container-fluid px-4 d-flex align-items-center position-relative">

                    {/* LEFT SIDE - logo and site name */}
                    <Link className="navbar-brand d-flex align-items-center gap-2" to="/">
                        <img src={siteIcon} alt="Site Logo" style={{ height: "36px", width: "36px", objectFit: "contain" }} />
                        <span className="navbar-site-name">{siteName}</span>
                    </Link>

                    {/* MIDDLE - upload run button (hidden on upload page) */}
                    <div
                        className="position-absolute top-50 start-50 translate-middle"
                        style={{ width: "200px", textAlign: "center" }}
                    >
                        {!isUploadPage && (
                            <Link
                                to={isLoggedIn ? "/upload" : "#"}
                                className={`btn btn-upload-run ${!isLoggedIn ? "disabled-btn" : ""}`}
                                onClick={(e) => { if (!isLoggedIn) e.preventDefault(); }}
                            >
                                Upload Run
                            </Link>
                        )}
                    </div>

                    {/* RIGHT SIDE - login/signup or user info + logout */}
                    <div className="d-flex align-items-center gap-2 ms-auto">
                        {isLoggedIn ? (
                            <>
                                {/* clicking the picture or username takes you to your profile */}
                                <Link
                                    to={`/profile/${userProfile?.username}`}
                                    className="d-flex align-items-center gap-2 text-decoration-none navbar-user-link"
                                >
                                    {/* profile picture */}
                                    <img
                                        src={userProfile?.profilePicture || defaultPFP}
                                        alt="Profile"
                                        className="navbar-pfp"
                                    />
                                    {/* username */}
                                    <span className="navbar-username">
                                        {userProfile?.username || "Player"}
                                    </span>
                                </Link>

                                {/* logout button */}
                                <button className="btn btn-logout" onClick={handleLogout}>
                                    Logout
                                </button>
                            </>
                        ) : (
                            <>
                                <button
                                    className="btn btn-login"
                                    onClick={() => {
                                        setLoginError("");
                                        setSignupError("");
                                        setShowSignup(false);
                                        setShowLogin(true);
                                    }}
                                >
                                    Login
                                </button>
                                <button
                                    className="btn btn-signup"
                                    onClick={() => {
                                        setSignupError("");
                                        setLoginError("");
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

            {/* LOGIN MODAL */}
            <Modal show={showLogin} onHide={() => { setShowLogin(false); setLoginError(""); }} centered>
                <Modal.Header closeButton>
                    <Modal.Title>Login</Modal.Title>
                </Modal.Header>
                <Modal.Body>
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
                    {loginError && <p className="text-danger">{loginError}</p>}
                    <button className="btn btn-primary w-100" onClick={handleLogin}>
                        Login
                    </button>
                </Modal.Body>
            </Modal>

            {/* SIGNUP MODAL */}
            <Modal show={showSignup} onHide={() => { setShowSignup(false); setSignupError(""); }} centered>
                <Modal.Header closeButton>
                    <Modal.Title>Sign Up</Modal.Title>
                </Modal.Header>
                <Modal.Body>
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
                    {signupError && <p className="text-danger">{signupError}</p>}
                    <button className="btn btn-success w-100" onClick={handleSignup}>
                        Sign Up
                    </button>
                </Modal.Body>
            </Modal>
        </>
    );
}