import { memo, useEffect, useRef, useState } from "react";
import { useNavigate, useSearchParams } from "react-router-dom";
import { supabase } from "../lib/supabase";


const API_BASE = "http://localhost:5000/api";
const MAX_FILE_SIZE = 10 * 1024 * 1024;
const ALLOWED_FILE_TYPES = [
    "image/jpeg",
    "image/png",
    "image/webp",
    "application/pdf"
];



const createAttachmentUrl = async (filePath) => {
    if (!filePath) return null;

    const { data, error } = await supabase.storage
        .from("chat-attachments")
        .createSignedUrl(filePath, 60 * 60);

    if (error) {
        console.error("Create signed URL error:", error);
        return null;
    }

    return data?.signedUrl || null;
};

const Attachment = memo(({
    message,
    isMine
}) => {

    const [url, setUrl] =
        useState(null);

    const [loadingUrl, setLoadingUrl] =
        useState(false);


    useEffect(() => {

        let mounted = true;


        const loadUrl = async () => {

            if (
                !message.attachment_path
            ) {

                return;

            }


            setLoadingUrl(true);


            const signedUrl =
                await createAttachmentUrl(
                    message.attachment_path
                );


            if (mounted) {

                setUrl(
                    signedUrl
                );

                setLoadingUrl(false);

            }

        };


        loadUrl();


        return () => {

            mounted = false;

        };

    }, [
        message.attachment_path
    ]);


    if (
        loadingUrl
    ) {

        return (

            <div
                style={{
                    marginTop:
                        message.message
                            ? "0.6rem"
                            : 0,
                    padding:
                        "0.6rem",
                    borderRadius:
                        "8px",
                    background:
                        isMine
                            ? "rgba(255,255,255,0.15)"
                            : "#f1f5f9"
                }}
            >
                Opening attachment...
            </div>

        );

    }


    if (!url) {

        return (

            <div
                style={{
                    marginTop:
                        message.message
                            ? "0.6rem"
                            : 0,
                    fontSize:
                        "0.85rem"
                }}
            >
                Attachment unavailable
            </div>

        );

    }


    if (
        message.attachment_type?.startsWith(
            "image/"
        )
    ) {

        return (

            <div
                style={{
                    marginTop:
                        message.message
                            ? "0.6rem"
                            : 0
                }}
            >

                <img
                    src={url}
                    alt={
                        message.attachment_name ||
                        "Chat attachment"
                    }
                    onClick={() =>
                        window.open(
                            url,
                            "_blank",
                            "noopener,noreferrer"
                        )
                    }
                    style={{
                        maxWidth:
                            "100%",
                        maxHeight:
                            "300px",
                        borderRadius:
                            "8px",
                        display:
                            "block",
                        cursor:
                            "pointer"
                    }}
                />


                <div
                    style={{
                        marginTop:
                            "0.3rem",
                        fontSize:
                            "0.75rem",
                        opacity:
                            0.8,
                        wordBreak:
                            "break-word"
                    }}
                >
                    {
                        message.attachment_name
                    }
                </div>

            </div>

        );

    }

    return (

        <div
            style={{
                marginTop:
                    message.message
                        ? "0.6rem"
                        : 0,
                padding:
                    "0.75rem",
                borderRadius:
                    "8px",
                background:
                    isMine
                        ? "rgba(255,255,255,0.15)"
                        : "#f1f5f9"
            }}
        >

            <button
                type="button"
                onClick={() =>
                    window.open(
                        url,
                        "_blank",
                        "noopener,noreferrer"
                    )
                }
                style={{
                    border:
                        "none",
                    background:
                        "transparent",
                    cursor:
                        "pointer",
                    padding:
                        0,
                    display:
                        "flex",
                    alignItems:
                        "center",
                    gap:
                        "0.6rem",
                    color:
                        "inherit",
                    textAlign:
                        "left"
                }}
            >

                <span
                    style={{
                        fontSize:
                            "1.7rem"
                    }}
                >
                    📄
                </span>


                <span
                    style={{
                        wordBreak:
                            "break-word"
                    }}
                >
                    {
                        message.attachment_name ||
                        "Open PDF"
                    }
                </span>

            </button>

        </div>

    );

});



function Chat() {

    const navigate = useNavigate();

    const [searchParams] = useSearchParams();


    const propertyId =
        searchParams.get("propertyId");

    const conversationId =
        searchParams.get("conversationId");



    const [user, setUser] =
        useState(null);

    const [property, setProperty] =
        useState(null);

    const [conversation, setConversation] =
        useState(null);

    const [messages, setMessages] =
        useState([]);

    const [messageText, setMessageText] =
        useState("");

    const [selectedFile, setSelectedFile] =
        useState(null);

    const [loading, setLoading] =
        useState(true);

    const [sending, setSending] =
        useState(false);

    const [uploading, setUploading] =
        useState(false);

    const [error, setError] =
        useState("");

    const messagesContainerRef =
        useRef(null);

    const shouldStayAtBottomRef =
        useRef(true);

    const fileInputRef =
        useRef(null);


    /*
    =====================================================
    CHECK LOGIN / SUPABASE SESSION
    =====================================================
    */

    useEffect(() => {

        const setupAuthentication = async () => {

            try {

                const {
                    data: sessionData,
                    error: sessionError
                } = await supabase.auth.getSession();


                if (sessionError) {

                    console.error(
                        "Supabase session error:",
                        sessionError
                    );

                    throw sessionError;

                }


                if (!sessionData?.session) {

                    console.error(
                        "No Supabase session found."
                    );

                    navigate("/login");

                    return;

                }


                const storedUser =
                    localStorage.getItem("user");


                if (!storedUser) {

                    navigate("/login");

                    return;

                }


                const parsedUser =
                    JSON.parse(storedUser);


                const supabaseUser =
                    sessionData.session.user;


                console.log(
                    "Supabase authenticated user:",
                    supabaseUser.id
                );


                console.log(
                    "Rentify logged-in user:",
                    parsedUser.id
                );


                if (
                    supabaseUser.id !==
                    parsedUser.id
                ) {

                    throw new Error(
                        "The Rentify user and Supabase user do not match."
                    );

                }


                setUser(parsedUser);


                console.log(
                    "Chat authentication successful."
                );


            } catch (error) {

                console.error(
                    "Chat authentication error:",
                    error
                );


                setError(
                    "Your login session could not be verified. Please log out and log in again."
                );


                setLoading(false);

            }

        };


        setupAuthentication();

    }, [navigate]);


    const fetchProperty = async (
        id
    ) => {

        try {

            const response =
                await fetch(
                    `${API_BASE}/properties/${id}`
                );


            const data =
                await response.json();


            if (!response.ok) {

                throw new Error(
                    data.message ||
                    "Failed to load property."
                );

            }


            setProperty(data);


            return data;


        } catch (error) {

            console.error(
                "Fetch property error:",
                error
            );


            throw error;

        }

    };


    const findGuestConversation = async (
        currentUser,
        currentPropertyId
    ) => {

        const {
            data,
            error
        } = await supabase

            .from("chat_conversations")

            .select("*")

            .eq(
                "property_id",
                currentPropertyId
            )

            .eq(
                "guest_id",
                currentUser.id
            )

            .maybeSingle();


        if (error) {

            console.error(
                "Find guest conversation error:",
                error
            );

            throw error;

        }


        if (data) {

            setConversation(data);

            return data;

        }


        return null;

    };


    const loadHostConversation = async (
        currentUser,
        currentConversationId
    ) => {

        const {
            data,
            error
        } = await supabase

            .from("chat_conversations")

            .select("*")

            .eq(
                "id",
                currentConversationId
            )

            .eq(
                "host_id",
                currentUser.id
            )

            .maybeSingle();


        if (error) {

            console.error(
                "Load host conversation error:",
                error
            );

            throw error;

        }


        if (!data) {

            throw new Error(
                "You do not have access to this conversation."
            );

        }


        setConversation(data);


        return data;

    };


    const createConversation = async () => {

        if (!user || !property) {

            return null;

        }


        if (
            user.role !== "guest"
        ) {

            throw new Error(
                "Only guests can start a new conversation."
            );

        }


        const {
            data,
            error
        } = await supabase

            .from("chat_conversations")

            .insert({

                property_id:
                    property.id,

                guest_id:
                    user.id,

                host_id:
                    property.host_id

            })

            .select()

            .single();


        if (error) {

            if (
                error.code === "23505"
            ) {

                const existing =
                    await findGuestConversation(
                        user,
                        property.id
                    );


                if (existing) {

                    return existing;

                }

            }


            console.error(
                "Create conversation error:",
                error
            );


            throw error;

        }


        setConversation(data);


        return data;

    };


    const loadMessages = async (
        currentConversationId
    ) => {

        const {
            data,
            error
        } = await supabase

            .from("chat_messages")

            .select("*")

            .eq(
                "conversation_id",
                currentConversationId
            )

            .order(
                "created_at",
                {
                    ascending: true
                }
            );


        if (error) {

            console.error(
                "Load messages error:",
                error
            );

            throw error;

        }


        setMessages(
            data || []
        );

    };

    useEffect(() => {

        if (!user) {

            return;

        }


        const initializeChat =
            async () => {

                try {

                    setLoading(true);

                    setError("");


                    if (
                        user.role === "host"
                    ) {

                        if (!conversationId) {

                            throw new Error(
                                "No conversation was selected."
                            );

                        }


                        const loadedConversation =
                            await loadHostConversation(
                                user,
                                conversationId
                            );


                        if (
                            loadedConversation.property_id
                        ) {

                            try {

                                await fetchProperty(
                                    loadedConversation.property_id
                                );

                            } catch (propertyError) {

                                console.error(
                                    "Could not load property:",
                                    propertyError
                                );

                            }

                        }


                        await loadMessages(
                            loadedConversation.id
                        );


                        return;

                    }


                    if (
                        user.role === "guest"
                    ) {

                        if (!propertyId) {

                            throw new Error(
                                "No property was selected for this chat."
                            );

                        }


                        await fetchProperty(
                            propertyId
                        );


                        const existing =
                            await findGuestConversation(
                                user,
                                propertyId
                            );


                        if (existing) {

                            await loadMessages(
                                existing.id
                            );

                        }

                    }

                } catch (error) {

                    console.error(
                        "Chat initialization error:",
                        error
                    );


                    setError(
                        error.message ||
                        "Unable to open chat."
                    );

                } finally {

                    setLoading(false);

                }

            };


        initializeChat();

    }, [
        user,
        propertyId,
        conversationId
    ]);


    useEffect(() => {

        if (!conversation) {

            return;

        }


        const channel =
            supabase

                .channel(
                    `chat-${conversation.id}`
                )

                .on(

                    "postgres_changes",

                    {
                        event: "INSERT",

                        schema: "public",

                        table: "chat_messages",

                        filter:
                            `conversation_id=eq.${conversation.id}`

                    },

                    (payload) => {

                        const newMessage =
                            payload.new;


                        setMessages(
                            (previous) => {

                                const alreadyExists =
                                    previous.some(
                                        message =>
                                            message.id ===
                                            newMessage.id
                                    );


                                if (
                                    alreadyExists
                                ) {

                                    return previous;

                                }


                                return [
                                    ...previous,
                                    newMessage
                                ];

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

    }, [conversation]);


    useEffect(() => {

        const container =
            messagesContainerRef.current;

        if (!container || !shouldStayAtBottomRef.current) {

            return;

        }

        container.scrollTo({

            top:
                container.scrollHeight,

            behavior:
                "smooth"

        });

    }, [messages]);


    const handleFileSelect = (
        event
    ) => {

        const file =
            event.target.files?.[0];


        if (!file) {

            return;

        }


        if (
            !ALLOWED_FILE_TYPES.includes(
                file.type
            )
        ) {

            alert(
                "Only JPG, PNG, WEBP images and PDF files are allowed."
            );


            event.target.value = "";


            return;

        }

        if (
            file.size > MAX_FILE_SIZE
        ) {

            alert(
                "File size must be 10 MB or smaller."
            );


            event.target.value = "";


            return;

        }


        setSelectedFile(file);


        setError("");

    };


    const removeSelectedFile = () => {

        setSelectedFile(null);


        if (
            fileInputRef.current
        ) {

            fileInputRef.current.value = "";

        }

    };


    const uploadAttachment = async (
        file,
        activeConversation
    ) => {

        if (!file) {

            return null;

        }


        setUploading(true);


        try {

            const fileExtension =
                file.name.includes(".")
                    ? file.name
                        .split(".")
                        .pop()
                        .toLowerCase()
                    : "";


            const uniqueFileName =
                `${Date.now()}-${crypto.randomUUID()}${fileExtension ? `.${fileExtension}` : ""}`;


            const filePath =
                `${activeConversation.id}/${user.id}/${uniqueFileName}`;


            const {
                error: uploadError
            } = await supabase.storage

                .from("chat-attachments")

                .upload(
                    filePath,
                    file,
                    {
                        cacheControl:
                            "3600",

                        upsert:
                            false,

                        contentType:
                            file.type
                    }
                );


            if (uploadError) {

                console.error(
                    "Attachment upload error:",
                    uploadError
                );


                throw uploadError;

            }


            return {

                path:
                    filePath,

                name:
                    file.name,

                type:
                    file.type

            };

        } finally {

            setUploading(false);

        }

    };


    const openAttachment = async (
        filePath
    ) => {

        try {

            const url =
                await createAttachmentUrl(
                    filePath
                );


            if (!url) {

                alert(
                    "Unable to open this attachment."
                );

                return;

            }


            window.open(
                url,
                "_blank",
                "noopener,noreferrer"
            );

        } catch (error) {

            console.error(
                "Open attachment error:",
                error
            );


            alert(
                "Unable to open attachment."
            );

        }

    };


    const sendMessage = async () => {

        const text =
            messageText.trim();


        if (
            !text &&
            !selectedFile
        ) {

            return;

        }


        if (!user) {

            alert(
                "Please login first."
            );

            navigate("/login");

            return;

        }


        try {

            setSending(true);

            setError("");


            let activeConversation =
                conversation;


            if (!activeConversation) {

                if (
                    user.role !== "guest"
                ) {

                    throw new Error(
                        "You cannot start a new conversation."
                    );

                }


                activeConversation =
                    await createConversation();

            }


            if (!activeConversation) {

                throw new Error(
                    "Unable to create or find conversation."
                );

            }


            let attachment = null;


            if (selectedFile) {

                attachment =
                    await uploadAttachment(
                        selectedFile,
                        activeConversation
                    );

            }


            const {
                data,
                error
            } = await supabase

                .from("chat_messages")

                .insert({

                    conversation_id:
                        activeConversation.id,

                    sender_id:
                        user.id,

                    message:
                        text || null,

                    attachment_path:
                        attachment?.path ||
                        null,


                    attachment_name:
                        attachment?.name ||
                        null,

                    attachment_type:
                        attachment?.type ||
                        null

                })

                .select()

                .single();


            if (error) {

                console.error(
                    "Send message error:",
                    error
                );


                throw error;

            }


            // Notify the OTHER participant that a message arrived.
            // create_notification is a SECURITY DEFINER RPC already used
            // for booking and wallet events — safe to call from any user.
            try {
                const recipientId =
                    user.role === "guest"
                        ? activeConversation.host_id
                        : activeConversation.guest_id;

                await supabase.rpc("create_notification", {
                    p_user_id: recipientId,
                    p_type: "new_message",
                    p_title: "New message",
                    p_message: user.role === "guest"
                        ? `A guest sent you a message about "${property?.title || "a property"}".`
                        : `The host replied to your message about "${property?.title || "a property"}".`,
                    p_related_entity_type: "chat_conversation",
                    p_related_entity_id: activeConversation.id
                });
            } catch (notificationError) {
                // Non-fatal: the message was sent; only the notification failed.
                console.error("Chat notification error:", notificationError);
            }


            const {
                error: updateError
            } = await supabase

                .from("chat_conversations")

                .update({

                    updated_at:
                        new Date().toISOString()

                })

                .eq(
                    "id",
                    activeConversation.id
                );


            if (updateError) {

                console.error(
                    "Conversation update error:",
                    updateError
                );

            }


            setMessages(
                (previous) => {

                    const exists =
                        previous.some(
                            message =>
                                message.id ===
                                data.id
                        );


                    if (exists) {

                        return previous;

                    }


                    return [
                        ...previous,
                        data
                    ];

                }
            );


            setMessageText("");


            setSelectedFile(null);


            if (
                fileInputRef.current
            ) {

                fileInputRef.current.value = "";

            }


        } catch (error) {

            console.error(
                "Send chat message error:",
                error
            );


            setError(
                error.message ||
                "Failed to send message."
            );


        } finally {

            setSending(false);

        }

    };


    const handleKeyDown = (
        event
    ) => {

        if (
            event.key === "Enter" &&
            !event.shiftKey
        ) {

            event.preventDefault();

            sendMessage();

        }

    };

    const formatTime = (
        timestamp
    ) => {

        if (!timestamp) {

            return "";

        }


        return new Date(
            timestamp
        ).toLocaleTimeString(
            [],
            {
                hour: "2-digit",
                minute: "2-digit"
            }
        );

    };


    const formatFileSize = (
        bytes
    ) => {

        if (!bytes) {

            return "";

        }


        if (
            bytes < 1024
        ) {

            return `${bytes} B`;

        }


        if (
            bytes < 1024 * 1024
        ) {

            return `${(bytes / 1024).toFixed(1)} KB`;

        }


        return `${(bytes / (1024 * 1024)).toFixed(1)} MB`;

    };


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
                        Opening chat...
                    </p>

                </div>

            </div>

        );

    }

    if (
        error &&
        !conversation
    ) {

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
                        Chat
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


    const isHost =
        user?.role === "host";


    return (

        <div
            className="dashboard-container"
            style={{
                paddingBottom:
                    "2rem"
            }}
        >

            <div
                className="ui-card"
                style={{
                    maxWidth: "900px",
                    margin: "0 auto",
                    padding: 0,
                    overflow: "hidden"
                }}
            >

                <div
                    style={{
                        display:
                            "flex",
                        alignItems:
                            "center",
                        gap:
                            "1rem",
                        padding:
                            "1rem 1.25rem",
                        borderBottom:
                            "1px solid var(--border-color)"
                    }}
                >

                    <button
                        className="btn btn-secondary"
                        onClick={() =>
                            navigate(-1)
                        }
                    >
                        ←
                    </button>


                    <div>

                        <h2
                            style={{
                                margin:
                                    0
                            }}
                        >
                            {
                                isHost
                                    ? "Chat with Guest"
                                    : "Chat with Host"
                            }
                        </h2>


                        <p
                            style={{
                                margin:
                                    "0.25rem 0 0",
                                color:
                                    "var(--text-muted)",
                                fontSize:
                                    "0.85rem"
                            }}
                        >
                            {
                                property?.title ||
                                "Property"
                            }
                        </p>

                    </div>

                </div>


                {error && (

                    <div
                        style={{
                            padding:
                                "0.75rem 1.25rem",
                            background:
                                "#fff1f2",
                            color:
                                "#b91c1c",
                            borderBottom:
                                "1px solid #fecdd3"
                        }}
                    >
                        {error}
                    </div>

                )}

                <div
                    ref={
                        messagesContainerRef
                    }
                    onScroll={(event) => {

                        const container =
                            event.currentTarget;

                        const distanceFromBottom =
                            container.scrollHeight -
                            container.scrollTop -
                            container.clientHeight;

                        shouldStayAtBottomRef.current =
                            distanceFromBottom <= 80;

                    }}
                    style={{
                        height:
                            "500px",
                        overflowY:
                            "auto",
                        padding:
                            "1.25rem",
                        background:
                            "var(--bg-color)"
                    }}
                >

                    {messages.length === 0 && (

                        <div
                            style={{
                                height:
                                    "100%",
                                display:
                                    "flex",
                                alignItems:
                                    "center",
                                justifyContent:
                                    "center",
                                textAlign:
                                    "center",
                                color:
                                    "var(--text-muted)"
                            }}
                        >

                            <div>

                                <div
                                    style={{
                                        fontSize:
                                            "2.5rem",
                                        marginBottom:
                                            "0.75rem"
                                    }}
                                >
                                    💬
                                </div>


                                <h3>
                                    {
                                        isHost
                                            ? "No messages yet"
                                            : "Start the conversation"
                                    }
                                </h3>


                                <p>
                                    {
                                        isHost
                                            ? "The guest has not sent any messages yet."
                                            : "Ask the host anything about this property."
                                    }
                                </p>

                            </div>

                        </div>

                    )}


                    {messages.map(
                        (message) => {

                            const isMine =
                                message.sender_id ===
                                user?.id;


                            return (

                                <div
                                    key={
                                        message.id
                                    }
                                    style={{
                                        display:
                                            "flex",
                                        justifyContent:
                                            isMine
                                                ? "flex-end"
                                                : "flex-start",
                                        marginBottom:
                                            "0.75rem"
                                    }}
                                >

                                    <div
                                        style={{
                                            maxWidth:
                                                "70%",
                                            padding:
                                                "0.7rem 0.9rem",
                                            borderRadius:
                                                isMine
                                                    ? "16px 16px 4px 16px"
                                                    : "16px 16px 16px 4px",
                                            background:
                                                isMine
                                                    ? "var(--primary-color)"
                                                    : "var(--card-bg)",
                                            color:
                                                isMine
                                                    ? "#ffffff"
                                                    : "var(--text-color)",
                                            boxShadow:
                                                "0 1px 3px rgba(0,0,0,0.08)"
                                        }}
                                    >

                                        {/* TEXT */}

                                        {message.message && (

                                            <div
                                                style={{
                                                    whiteSpace:
                                                        "pre-wrap",
                                                    wordBreak:
                                                        "break-word"
                                                }}
                                            >
                                                {
                                                    message.message
                                                }
                                            </div>

                                        )}


                                        {/* ATTACHMENT */}

                                        {message.attachment_path && (

                                            <Attachment
                                                message={
                                                    message
                                                }
                                                isMine={
                                                    isMine
                                                }
                                            />

                                        )}


                                        {/* TIME */}

                                        <div
                                            style={{
                                                marginTop:
                                                    "0.3rem",
                                                fontSize:
                                                    "0.7rem",
                                                opacity:
                                                    0.7,
                                                textAlign:
                                                    "right"
                                            }}
                                        >
                                            {
                                                formatTime(
                                                    message.created_at
                                                )
                                            }
                                        </div>

                                    </div>

                                </div>

                            );

                        }
                    )}


                    <div />

                </div>

                {selectedFile && (

                    <div
                        style={{
                            padding:
                                "0.75rem 1rem",
                            borderTop:
                                "1px solid var(--border-color)",
                            background:
                                "#f8fafc"
                        }}
                    >

                        <div
                            style={{
                                display:
                                    "flex",
                                alignItems:
                                    "center",
                                justifyContent:
                                    "space-between",
                                gap:
                                    "1rem"
                            }}
                        >

                            <div
                                style={{
                                    display:
                                        "flex",
                                    alignItems:
                                        "center",
                                    gap:
                                        "0.75rem",
                                    minWidth:
                                        0
                                }}
                            >

                                <span
                                    style={{
                                        fontSize:
                                            "1.5rem"
                                    }}
                                >
                                    {
                                        selectedFile.type.startsWith(
                                            "image/"
                                        )
                                            ? "🖼️"
                                            : "📄"
                                    }
                                </span>


                                <div
                                    style={{
                                        minWidth:
                                            0
                                    }}
                                >

                                    <div
                                        style={{
                                            fontWeight:
                                                600,
                                            wordBreak:
                                                "break-word"
                                        }}
                                    >
                                        {
                                            selectedFile.name
                                        }
                                    </div>


                                    <div
                                        style={{
                                            fontSize:
                                                "0.75rem",
                                            color:
                                                "var(--text-muted)"
                                        }}
                                    >
                                        {
                                            formatFileSize(
                                                selectedFile.size
                                            )
                                        }
                                    </div>

                                </div>

                            </div>


                            <button
                                type="button"
                                className="btn btn-secondary"
                                onClick={
                                    removeSelectedFile
                                }
                            >
                                ✕
                            </button>

                        </div>

                    </div>

                )}

                <div
                    style={{
                        padding:
                            "1rem",
                        borderTop:
                            "1px solid var(--border-color)",
                        background:
                            "var(--card-bg)"
                    }}
                >

                    <div
                        style={{
                            display:
                                "flex",
                            gap:
                                "0.75rem",
                            alignItems:
                                "flex-end"
                        }}
                    >

                        <input
                            ref={
                                fileInputRef
                            }
                            type="file"
                            accept=".jpg,.jpeg,.png,.webp,.pdf,image/jpeg,image/png,image/webp,application/pdf"
                            onChange={
                                handleFileSelect
                            }
                            style={{
                                display:
                                    "none"
                            }}
                        />

                        <button
                            type="button"
                            className="btn btn-secondary"
                            title="Attach a file"
                            onClick={() =>
                                fileInputRef.current?.click()
                            }
                            disabled={
                                sending ||
                                uploading
                            }
                        >
                            📎
                        </button>

                        <textarea
                            value={
                                messageText
                            }
                            onChange={(event) =>
                                setMessageText(
                                    event.target.value
                                )
                            }
                            onKeyDown={
                                handleKeyDown
                            }
                            placeholder={
                                isHost
                                    ? "Reply to guest..."
                                    : "Type your message..."
                            }
                            rows={2}
                            style={{
                                flex:
                                    1,
                                resize:
                                    "none",
                                border:
                                    "1px solid var(--border-color)",
                                borderRadius:
                                    "8px",
                                padding:
                                    "0.7rem",
                                fontFamily:
                                    "inherit"
                            }}
                        />

                        <button
                            type="button"
                            className="btn btn-primary"
                            onClick={
                                sendMessage
                            }
                            disabled={
                                sending ||
                                uploading ||
                                (
                                    !messageText.trim() &&
                                    !selectedFile
                                )
                            }
                        >
                            {
                                uploading
                                    ? "Uploading..."
                                    : sending
                                        ? "Sending..."
                                        : "Send"
                            }
                        </button>

                    </div>


                    <p
                        style={{
                            margin:
                                "0.5rem 0 0",
                            color:
                                "var(--text-muted)",
                            fontSize:
                                "0.75rem"
                        }}
                    >
                        JPG, PNG, WEBP or PDF • Maximum 10 MB
                        <br />
                        Press Enter to send. Use Shift + Enter for a new line.
                    </p>

                </div>

            </div>

        </div>

    );

}

export default Chat;