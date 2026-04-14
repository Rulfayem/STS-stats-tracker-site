import "../styles/navbar.css";
import { Link } from "react-router-dom";
import { useState } from "react";

const siteIcon = "/images/Purple-Scrawl-Art.png";
const siteName = "STS1 Stats Tracker";

//temporary placeholder, replace with real firebase auth later
const temporaryIsLoggedIn = false;

export default function Navbar() {

    const [showLogin, setShowLogin] = useState(false);
    const [showSignup, setShowSignup] = useState(false);

    const isLoggedIn = temporaryIsLoggedIn;

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
                                    <p>Login form goes here</p>
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
                                    <p>Signup form goes here</p>
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