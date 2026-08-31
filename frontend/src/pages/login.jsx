import { useState } from "react";
import { Link, useNavigate } from "react-router-dom";

import "../styles/auth.css";

import { supabase } from "../lib/supabase";


function Login() {

    const navigate = useNavigate();

    const [role, setRole] = useState("guest");

    const [loading, setLoading] = useState(false);

    const [formData, setFormData] = useState({
        email: "",
        password: ""
    });


    const handleChange = (e) => {

        setFormData({
            ...formData,
            [e.target.name]: e.target.value
        });

    };


    const handleSubmit = async (e) => {

        e.preventDefault();


        try {

            setLoading(true);


            /*
            ==================================================
            LOGIN THROUGH YOUR RENTIFY BACKEND
            ==================================================
            */

            const response = await fetch(
                "http://localhost:5000/api/auth/login",
                {
                    method: "POST",

                    headers: {
                        "Content-Type": "application/json"
                    },

                    body: JSON.stringify({

                        email: formData.email,

                        password: formData.password,

                        role: role

                    })
                }
            );


            const data = await response.json();


            if (!response.ok) {

                throw new Error(
                    data.error || "Login failed"
                );

            }


            /*
            ==================================================
            CHECK THAT BACKEND RETURNED A SUPABASE SESSION
            ==================================================
            */

            if (!data.session) {

                throw new Error(
                    "Login succeeded, but no Supabase session was returned."
                );

            }


            if (!data.session.access_token) {

                throw new Error(
                    "Login succeeded, but no Supabase access token was returned."
                );

            }


            if (!data.session.refresh_token) {

                throw new Error(
                    "Login succeeded, but no Supabase refresh token was returned."
                );

            }


            /*
            ==================================================
            IMPORTANT CHAT FIX
            ==================================================

            Your backend already returns a Supabase Auth
            session.

            We now give that session to the Supabase
            frontend client.

            This makes:

                auth.uid()

            work correctly inside Supabase RLS.
            ==================================================
            */

            const {
                data: sessionData,
                error: sessionError
            } = await supabase.auth.setSession({

                access_token:
                    data.session.access_token,

                refresh_token:
                    data.session.refresh_token

            });


            if (sessionError) {

                console.error(
                    "Supabase session error:",
                    sessionError
                );

                throw new Error(
                    "Login succeeded, but the Supabase session could not be initialized."
                );

            }


            if (!sessionData?.session) {

                throw new Error(
                    "Supabase session could not be created."
                );

            }


            /*
            ==================================================
            VERIFY THAT THE SUPABASE USER IS THE SAME USER
            ==================================================
            */

            if (
                data.user?.id &&
                sessionData.session.user.id !== data.user.id
            ) {

                console.error(
                    "User ID mismatch:",
                    {
                        backendUser:
                            data.user.id,

                        supabaseUser:
                            sessionData.session.user.id
                    }
                );

                throw new Error(
                    "Login user verification failed."
                );

            }


            /*
            ==================================================
            SAVE RENTIFY USER INFORMATION
            ==================================================
            */

            localStorage.setItem(
                "token",
                data.session.access_token
            );


            localStorage.setItem(
                "user",
                JSON.stringify({
                    ...data.user,
                    role: data.role
                })
            );


            /*
            ==================================================
            DEBUG INFORMATION
            ==================================================
            */

            console.log(
                "Rentify login successful."
            );


            console.log(
                "Supabase session initialized."
            );


            console.log(
                "Supabase user ID:",
                sessionData.session.user.id
            );


            console.log(
                "Logged-in role:",
                data.role
            );


            alert(
                "Login Successful!"
            );


            navigate("/dashboard");


        } catch (error) {

            console.error(
                "Login error:",
                error
            );


            alert(
                error.message
            );


        } finally {

            setLoading(false);

        }

    };


    return (

        <div className="auth-page">

            <div className="auth-card">

                <h1>
                    Rentify
                </h1>

                <h2>
                    Welcome Back
                </h2>

                <p className="subtitle">
                    Login to continue
                </p>


                <div className="role-container">

                    <div
                        className={
                            role === "guest"
                                ? "role-card active"
                                : "role-card"
                        }
                        onClick={() =>
                            setRole("guest")
                        }
                    >

                        <h3>
                            Guest
                        </h3>

                        <p>
                            Book Properties
                        </p>

                    </div>


                    <div
                        className={
                            role === "host"
                                ? "role-card active"
                                : "role-card"
                        }
                        onClick={() =>
                            setRole("host")
                        }
                    >

                        <h3>
                            Host
                        </h3>

                        <p>
                            Manage Properties
                        </p>

                    </div>


                    <div
                        className={
                            role === "admin"
                                ? "role-card active"
                                : "role-card"
                        }
                        onClick={() =>
                            setRole("admin")
                        }
                    >

                        <h3>
                            Admin
                        </h3>

                        <p>
                            Manage platform
                        </p>

                    </div>

                </div>


                <form
                    onSubmit={handleSubmit}
                >

                    <input
                        type="email"
                        name="email"
                        placeholder="Email Address"
                        value={formData.email}
                        onChange={handleChange}
                        required
                    />


                    <input
                        type="password"
                        name="password"
                        placeholder="Password"
                        value={formData.password}
                        onChange={handleChange}
                        required
                    />


                    <button
                        type="submit"
                        disabled={loading}
                    >
                        {
                            loading
                                ? "Logging in..."
                                : "Login"
                        }
                    </button>

                </form>


                <div className="auth-footer">

                    Don't have an account?

                    <Link to="/signup">
                        Create Account
                    </Link>

                </div>

            </div>

        </div>

    );

}


export default Login;