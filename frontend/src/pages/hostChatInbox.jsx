import { useEffect, useState } from "react";
import { useNavigate } from "react-router-dom";

import { supabase } from "../lib/supabase";


function HostChatInbox() {

    const navigate = useNavigate();


    const [user, setUser] =
        useState(null);

    const [conversations, setConversations] =
        useState([]);

    const [loading, setLoading] =
        useState(true);

    const [error, setError] =
        useState("");


    /*
    =====================================================
    GET LOGGED-IN HOST
    =====================================================
    */

    useEffect(() => {

        const loadUser = async () => {

            try {

                /*
                ==========================================
                GET SUPABASE SESSION
                ==========================================
                */

                const {
                    data: sessionData,
                    error: sessionError
                } = await supabase.auth.getSession();


                if (sessionError) {

                    throw sessionError;

                }


                if (!sessionData?.session) {

                    navigate("/login");

                    return;

                }


                /*
                ==========================================
                GET RENTIFY USER
                ==========================================
                */

                const storedUser =
                    localStorage.getItem("user");


                if (!storedUser) {

                    navigate("/login");

                    return;

                }


                const parsedUser =
                    JSON.parse(storedUser);


                /*
                ==========================================
                ONLY HOSTS
                ==========================================
                */

                if (
                    parsedUser.role !== "host"
                ) {

                    navigate("/dashboard");

                    return;

                }


                /*
                ==========================================
                VERIFY USER ID
                ==========================================
                */

                if (
                    sessionData.session.user.id !==
                    parsedUser.id
                ) {

                    throw new Error(
                        "Logged-in user does not match Supabase user."
                    );

                }


                setUser(parsedUser);


            } catch (error) {

                console.error(
                    "Host authentication error:",
                    error
                );


                setError(
                    error.message ||
                    "Unable to authenticate host."
                );


                setLoading(false);

            }

        };


        loadUser();

    }, [navigate]);


    /*
    =====================================================
    LOAD HOST CONVERSATIONS
    =====================================================
    */

    useEffect(() => {

        if (!user) {

            return;

        }


        const loadConversations =
            async () => {

                try {

                    setLoading(true);

                    setError("");


                    /*
                    ==================================
                    GET CONVERSATIONS BELONGING
                    TO THIS HOST
                    ==================================
                    */

                    const {
                        data,
                        error
                    } = await supabase

                        .from("chat_conversations")

                        .select("*")

                        .eq(
                            "host_id",
                            user.id
                        )

                        .order(
                            "updated_at",
                            {
                                ascending: false
                            }
                        );


                    if (error) {

                        throw error;

                    }


                    setConversations(
                        data || []
                    );


                } catch (error) {

                    console.error(
                        "Load host conversations error:",
                        error
                    );


                    setError(
                        error.message ||
                        "Unable to load conversations."
                    );


                } finally {

                    setLoading(false);

                }

            };


        loadConversations();

    }, [user]);


    /*
    =====================================================
    REALTIME NEW CONVERSATIONS
    =====================================================
    */

    useEffect(() => {

        if (!user) {

            return;

        }


        const channel =
            supabase

                .channel(
                    `host-inbox-${user.id}`
                )

                .on(

                    "postgres_changes",

                    {
                        event: "INSERT",

                        schema: "public",

                        table: "chat_conversations",

                        filter:
                            `host_id=eq.${user.id}`

                    },

                    (payload) => {

                        const newConversation =
                            payload.new;


                        setConversations(
                            (previous) => {

                                const exists =
                                    previous.some(
                                        conversation =>
                                            conversation.id ===
                                            newConversation.id
                                    );


                                if (exists) {

                                    return previous;

                                }


                                return [
                                    newConversation,
                                    ...previous
                                ];

                            }
                        );

                    }

                )

                .on(

                    "postgres_changes",

                    {
                        event: "UPDATE",

                        schema: "public",

                        table: "chat_conversations",

                        filter:
                            `host_id=eq.${user.id}`

                    },

                    (payload) => {

                        const updatedConversation =
                            payload.new;


                        setConversations(
                            (previous) => {

                                return previous

                                    .map(
                                        conversation =>
                                            conversation.id ===
                                            updatedConversation.id
                                                ? updatedConversation
                                                : conversation
                                    )

                                    .sort(
                                        (a, b) =>
                                            new Date(
                                                b.updated_at
                                            ) -
                                            new Date(
                                                a.updated_at
                                            )
                                    );

                            }
                        );

                    }

                )

                .subscribe();


        return () => {

            supabase.removeChannel(
                channel
            );

        };

    }, [user]);


    /*
    =====================================================
    FORMAT DATE
    =====================================================
    */

    const formatDate = (
        timestamp
    ) => {

        if (!timestamp) {

            return "";

        }


        return new Date(
            timestamp
        ).toLocaleString(
            [],
            {
                dateStyle: "medium",
                timeStyle: "short"
            }
        );

    };


    /*
    =====================================================
    LOADING
    =====================================================
    */

    if (loading) {

        return (

            <div
                className="dashboard-container"
            >

                <div
                    className="ui-card"
                    style={{
                        maxWidth: "900px",
                        margin: "0 auto"
                    }}
                >

                    <p>
                        Loading messages...
                    </p>

                </div>

            </div>

        );

    }


    /*
    =====================================================
    ERROR
    =====================================================
    */

    if (error) {

        return (

            <div
                className="dashboard-container"
            >

                <div
                    className="ui-card"
                    style={{
                        maxWidth: "900px",
                        margin: "0 auto"
                    }}
                >

                    <button
                        className="btn btn-secondary"
                        onClick={() =>
                            navigate(-1)
                        }
                        style={{
                            marginBottom:
                                "1rem"
                        }}
                    >
                        ← Back
                    </button>


                    <h2>
                        Messages
                    </h2>


                    <p
                        style={{
                            color: "red",
                            marginTop:
                                "1rem"
                        }}
                    >
                        {error}
                    </p>

                </div>

            </div>

        );

    }


    /*
    =====================================================
    MAIN HOST INBOX
    =====================================================
    */

    return (

        <div
            className="dashboard-container"
        >

            <div
                className="ui-card"
                style={{
                    maxWidth: "900px",
                    margin: "0 auto"
                }}
            >

                {/* =========================================
                    HEADER
                ========================================= */}

                <div
                    style={{
                        display:
                            "flex",
                        justifyContent:
                            "space-between",
                        alignItems:
                            "center",
                        marginBottom:
                            "1.5rem"
                    }}
                >

                    <div>

                        <h2
                            style={{
                                margin: 0
                            }}
                        >
                            Messages
                        </h2>


                        <p
                            style={{
                                margin:
                                    "0.4rem 0 0",
                                color:
                                    "var(--text-muted)"
                            }}
                        >
                            Conversations with your guests
                        </p>

                    </div>


                    <button
                        className="btn btn-secondary"
                        onClick={() =>
                            navigate(-1)
                        }
                    >
                        ← Back
                    </button>

                </div>


                {/* =========================================
                    NO CONVERSATIONS
                ========================================= */}

                {conversations.length === 0 && (

                    <div
                        style={{
                            textAlign:
                                "center",
                            padding:
                                "3rem 1rem",
                            color:
                                "var(--text-muted)"
                        }}
                    >

                        <div
                            style={{
                                fontSize:
                                    "3rem",
                                marginBottom:
                                    "1rem"
                            }}
                        >
                            💬
                        </div>


                        <h3>
                            No messages yet
                        </h3>


                        <p>
                            When a guest contacts you
                            about one of your properties,
                            the conversation will appear here.
                        </p>

                    </div>

                )}


                {/* =========================================
                    CONVERSATIONS
                ========================================= */}

                {conversations.map(
                    (conversation) => (

                        <div
                            key={
                                conversation.id
                            }
                            onClick={() =>
                                navigate(
                                    `/chat?conversationId=${conversation.id}`
                                )
                            }
                            style={{
                                border:
                                    "1px solid var(--border-color)",
                                borderRadius:
                                    "12px",
                                padding:
                                    "1rem",
                                marginBottom:
                                    "0.75rem",
                                cursor:
                                    "pointer",
                                transition:
                                    "0.2s",
                                background:
                                    "#ffffff"
                            }}
                            onMouseEnter={(event) => {

                                event.currentTarget.style.boxShadow =
                                    "0 4px 12px rgba(0,0,0,0.08)";

                            }}
                            onMouseLeave={(event) => {

                                event.currentTarget.style.boxShadow =
                                    "none";

                            }}
                        >

                            <div
                                style={{
                                    display:
                                        "flex",
                                    justifyContent:
                                        "space-between",
                                    alignItems:
                                        "flex-start",
                                    gap:
                                        "1rem"
                                }}
                            >

                                <div>

                                    <h3
                                        style={{
                                            margin:
                                                "0 0 0.4rem"
                                        }}
                                    >
                                        Guest Conversation
                                    </h3>


                                    <p
                                        style={{
                                            margin:
                                                "0",
                                            color:
                                                "var(--text-muted)",
                                            fontSize:
                                                "0.9rem"
                                        }}
                                    >
                                        Guest ID:
                                        {" "}
                                        {conversation.guest_id}
                                    </p>

                                </div>


                                <span
                                    style={{
                                        fontSize:
                                            "0.8rem",
                                        color:
                                            "var(--text-muted)",
                                        whiteSpace:
                                            "nowrap"
                                    }}
                                >
                                    {
                                        formatDate(
                                            conversation.updated_at
                                        )
                                    }
                                </span>

                            </div>


                            <div
                                style={{
                                    marginTop:
                                        "0.75rem",
                                    color:
                                        "var(--primary-color)",
                                    fontWeight:
                                        "600"
                                }}
                            >
                                Open conversation →
                            </div>

                        </div>

                    )
                )}

            </div>

        </div>

    );

}


export default HostChatInbox;