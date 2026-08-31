import { useEffect, useState } from "react";
import { useNavigate } from "react-router-dom";

import { supabase } from "../lib/supabase";

import "../styles/profile-property.css";


function HostMessages() {

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
    CHECK LOGIN
    =====================================================
    */

    useEffect(() => {

        const setupAuthentication =
            async () => {

                const storedUser =
                    localStorage.getItem("user");

                const token =
                    localStorage.getItem("token");


                if (
                    !storedUser ||
                    !token
                ) {

                    navigate("/login");

                    return;

                }


                try {

                    const parsedUser =
                        JSON.parse(storedUser);


                    /*
                    ==========================================
                    CONNECT RENTIFY TOKEN TO SUPABASE
                    ==========================================
                    */

                    const {
                        data: sessionData,
                        error: sessionError
                    } =
                        await supabase.auth.setSession({

                            access_token:
                                token,

                            refresh_token:
                                ""

                        });


                    if (sessionError) {

                        console.error(
                            "Supabase session error:",
                            sessionError
                        );

                        throw sessionError;

                    }


                    if (
                        !sessionData?.session
                    ) {

                        throw new Error(
                            "Supabase session could not be created."
                        );

                    }


                    /*
                    ==========================================
                    VERIFY USER
                    ==========================================
                    */

                    const supabaseUser =
                        sessionData.session.user;


                    if (
                        supabaseUser.id !==
                        parsedUser.id
                    ) {

                        throw new Error(
                            "The Rentify user and Supabase user do not match."
                        );

                    }


                    /*
                    ==========================================
                    HOST ONLY
                    ==========================================
                    */

                    if (
                        parsedUser.role !==
                        "host"
                    ) {

                        setError(
                            "Only hosts can access the message inbox."
                        );

                        setLoading(false);

                        return;

                    }


                    setUser(parsedUser);


                } catch (error) {

                    console.error(
                        "Host message authentication error:",
                        error
                    );


                    setError(
                        "Your login session could not be connected to Supabase. Please log out and log in again."
                    );

                    setLoading(false);

                }

            };


        setupAuthentication();

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
                    ==========================================
                    GET CONVERSATIONS FOR THIS HOST
                    ==========================================
                    */

                    const {
                        data,
                        error
                    } = await supabase

                        .from(
                            "chat_conversations"
                        )

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

                        console.error(
                            "Load host conversations error:",
                            error
                        );

                        throw error;

                    }


                    setConversations(
                        data || []
                    );


                } catch (error) {

                    console.error(
                        "Host inbox error:",
                        error
                    );


                    setError(
                        error.message ||
                        "Unable to load your messages."
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
                            previous => {

                                const alreadyExists =
                                    previous.some(
                                        conversation =>
                                            conversation.id ===
                                            newConversation.id
                                    );


                                if (
                                    alreadyExists
                                ) {

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
                            previous => {

                                const updated =
                                    previous.map(
                                        conversation => {

                                            if (
                                                conversation.id ===
                                                updatedConversation.id
                                            ) {

                                                return updatedConversation;

                                            }


                                            return conversation;

                                        }
                                    );


                                return updated.sort(
                                    (a, b) => {

                                        const dateA =
                                            new Date(
                                                a.updated_at ||
                                                a.created_at
                                            );

                                        const dateB =
                                            new Date(
                                                b.updated_at ||
                                                b.created_at
                                            );


                                        return (
                                            dateB -
                                            dateA
                                        );

                                    }
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

    const formatDate =
        (timestamp) => {

            if (!timestamp) {

                return "";

            }


            return new Date(
                timestamp
            ).toLocaleString(
                [],
                {
                    dateStyle:
                        "medium",

                    timeStyle:
                        "short"
                }
            );

        };



    /*
    =====================================================
    OPEN CONVERSATION
    =====================================================
    */

    const openConversation =
        (conversation) => {

            navigate(
                `/chat?conversationId=${conversation.id}`
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
                        maxWidth:
                            "1000px",
                        margin:
                            "0 auto"
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
                        maxWidth:
                            "1000px",
                        margin:
                            "0 auto"
                    }}
                >

                    <button
                        type="button"
                        className="btn btn-secondary"
                        onClick={() =>
                            navigate("/dashboard")
                        }
                        style={{
                            marginBottom:
                                "1rem"
                        }}
                    >
                        ← Back to Dashboard
                    </button>


                    <h2>
                        Messages
                    </h2>


                    <p
                        style={{
                            color:
                                "#dc2626",
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
                    maxWidth:
                        "1000px",
                    margin:
                        "0 auto"
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

                        gap:
                            "1rem",

                        marginBottom:
                            "1.5rem",

                        flexWrap:
                            "wrap"
                    }}
                >

                    <div>

                        <h2
                            style={{
                                margin:
                                    0
                            }}
                        >
                            💬 Messages
                        </h2>


                        <p
                            style={{
                                margin:
                                    "0.4rem 0 0",

                                color:
                                    "var(--text-muted)"
                            }}
                        >
                            Conversations started by
                            your guests.
                        </p>

                    </div>


                    <button
                        type="button"
                        className="btn btn-secondary"
                        onClick={() =>
                            navigate("/dashboard")
                        }
                    >
                        ← Dashboard
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
                                "4rem 1rem",

                            border:
                                "1px dashed var(--border-color)",

                            borderRadius:
                                "10px"
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


                        <p
                            style={{
                                color:
                                    "var(--text-muted)"
                            }}
                        >
                            When a guest sends you
                            a message about one of
                            your properties, the
                            conversation will appear
                            here.
                        </p>

                    </div>

                )}



                {/* =========================================
                    CONVERSATION LIST
                ========================================= */}

                {conversations.length > 0 && (

                    <div
                        style={{
                            display:
                                "flex",

                            flexDirection:
                                "column",

                            gap:
                                "0.75rem"
                        }}
                    >

                        {conversations.map(
                            (conversation) => (

                                <button
                                    key={
                                        conversation.id
                                    }
                                    type="button"
                                    onClick={() =>
                                        openConversation(
                                            conversation
                                        )
                                    }
                                    style={{
                                        width:
                                            "100%",

                                        textAlign:
                                            "left",

                                        border:
                                            "1px solid var(--border-color)",

                                        borderRadius:
                                            "10px",

                                        background:
                                            "#ffffff",

                                        padding:
                                            "1rem",

                                        cursor:
                                            "pointer",

                                        transition:
                                            "all 0.2s ease"
                                    }}
                                    onMouseEnter={(e) => {

                                        e.currentTarget.style.background =
                                            "#f8fafc";

                                    }}
                                    onMouseLeave={(e) => {

                                        e.currentTarget.style.background =
                                            "#ffffff";

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
                                                "1rem",

                                            flexWrap:
                                                "wrap"
                                        }}
                                    >

                                        {/* LEFT SIDE */}

                                        <div
                                            style={{
                                                flex:
                                                    1
                                            }}
                                        >

                                            <div
                                                style={{
                                                    display:
                                                        "flex",

                                                    alignItems:
                                                        "center",

                                                    gap:
                                                        "0.5rem",

                                                    marginBottom:
                                                        "0.4rem"
                                                }}
                                            >

                                                <span
                                                    style={{
                                                        fontSize:
                                                            "1.3rem"
                                                    }}
                                                >
                                                    👤
                                                </span>


                                                <strong
                                                    style={{
                                                        fontSize:
                                                            "1.05rem"
                                                    }}
                                                >
                                                    Guest
                                                </strong>

                                            </div>


                                            <div
                                                style={{
                                                    color:
                                                        "var(--text-muted)",

                                                    fontSize:
                                                        "0.9rem"
                                                }}
                                            >

                                                Conversation ID:

                                                {" "}

                                                <span
                                                    style={{
                                                        fontFamily:
                                                            "monospace"
                                                    }}
                                                >
                                                    {
                                                        conversation.id
                                                    }
                                                </span>

                                            </div>

                                        </div>



                                        {/* RIGHT SIDE */}

                                        <div
                                            style={{
                                                textAlign:
                                                    "right"
                                            }}
                                        >

                                            <div
                                                style={{
                                                    fontSize:
                                                        "0.8rem",

                                                    color:
                                                        "var(--text-muted)"
                                                }}
                                            >
                                                Last activity
                                            </div>


                                            <div
                                                style={{
                                                    fontSize:
                                                        "0.85rem",

                                                    marginTop:
                                                        "0.2rem"
                                                }}
                                            >
                                                {
                                                    formatDate(
                                                        conversation.updated_at ||
                                                        conversation.created_at
                                                    )
                                                }
                                            </div>

                                        </div>

                                    </div>



                                    {/* PROPERTY */}

                                    <div
                                        style={{
                                            marginTop:
                                                "0.9rem",

                                            paddingTop:
                                                "0.75rem",

                                            borderTop:
                                                "1px solid var(--border-color)",

                                            display:
                                                "flex",

                                            alignItems:
                                                "center",

                                            gap:
                                                "0.5rem",

                                            color:
                                                "var(--text-muted)",

                                            fontSize:
                                                "0.9rem"
                                        }}
                                    >

                                        🏠

                                        <span>
                                            Property ID:
                                        </span>

                                        <span
                                            style={{
                                                fontFamily:
                                                    "monospace"
                                            }}
                                        >
                                            {
                                                conversation.property_id
                                            }
                                        </span>

                                    </div>



                                    {/* OPEN */}

                                    <div
                                        style={{
                                            marginTop:
                                                "0.8rem",

                                            color:
                                                "var(--primary-color)",

                                            fontWeight:
                                                "600",

                                            fontSize:
                                                "0.9rem"
                                        }}
                                    >
                                        Open conversation →
                                    </div>

                                </button>

                            )
                        )}

                    </div>

                )}

            </div>

        </div>

    );

}


export default HostMessages;