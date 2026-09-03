import { useEffect, useState } from "react";
import { useNavigate } from "react-router-dom";

import "../styles/forum.css";

const API_BASE = "http://localhost:5000/api";

const CATEGORIES = [
    { value: "", label: "All Categories" },
    { value: "general", label: "General" },
    { value: "tips", label: "Tips & Advice" },
    { value: "host-help", label: "Host Help" },
    { value: "guest-help", label: "Guest Help" },
    { value: "announcements", label: "Announcements" }
];

function Forum() {

    const navigate = useNavigate();

    const isLoggedIn = !!localStorage.getItem("token");

    const [threads, setThreads] = useState([]);
    const [loading, setLoading] = useState(true);
    const [error, setError] = useState("");
    const [category, setCategory] = useState("");

    const [showNewThread, setShowNewThread] = useState(false);
    const [newTitle, setNewTitle] = useState("");
    const [newBody, setNewBody] = useState("");
    const [newCategory, setNewCategory] = useState("general");
    const [posting, setPosting] = useState(false);
    const [postError, setPostError] = useState("");


    const fetchThreads = async () => {

        try {

            setLoading(true);
            setError("");

            const query = category ? `?category=${category}` : "";

            const response = await fetch(`${API_BASE}/forum/threads${query}`);

            const data = await response.json();

            if (!response.ok) {
                throw new Error(data.message || "Failed to load discussions.");
            }

            setThreads(Array.isArray(data) ? data : []);

        } catch (err) {

            console.error("Fetch threads error:", err);
            setError(err.message || "Failed to load discussions.");

        } finally {

            setLoading(false);

        }

    };

    useEffect(() => {
        fetchThreads();
        // eslint-disable-next-line react-hooks/exhaustive-deps
    }, [category]);


    const handleStartDiscussion = () => {

        if (!isLoggedIn) {
            navigate("/login");
            return;
        }

        setShowNewThread((prev) => !prev);

    };

    const handleSubmitThread = async (e) => {

        e.preventDefault();

        setPostError("");

        if (!newTitle.trim() || !newBody.trim()) {
            setPostError("Please fill in both a title and a message.");
            return;
        }

        try {

            setPosting(true);

            const token = localStorage.getItem("token");

            const response = await fetch(`${API_BASE}/forum/threads`, {
                method: "POST",
                headers: {
                    "Content-Type": "application/json",
                    Authorization: `Bearer ${token}`
                },
                body: JSON.stringify({
                    title: newTitle.trim(),
                    body: newBody.trim(),
                    category: newCategory
                })
            });

            const data = await response.json();

            if (!response.ok) {
                throw new Error(data.message || "Failed to post discussion.");
            }

            setNewTitle("");
            setNewBody("");
            setNewCategory("general");
            setShowNewThread(false);

            navigate(`/forum/${data.thread.id}`);

        } catch (err) {

            console.error("Create thread error:", err);
            setPostError(err.message || "Failed to post discussion.");

        } finally {

            setPosting(false);

        }

    };


    return (
        <div className="forum-page">

            <div className="forum-header">
                <div>
                    <h1>💬 Community Forum</h1>
                    <p>Ask questions, share tips, and connect with other hosts and guests.</p>
                </div>

                <button className="btn btn-primary" onClick={handleStartDiscussion}>
                    {showNewThread ? "Cancel" : "Start a Discussion"}
                </button>
            </div>

            {showNewThread && (
                <form className="forum-new-thread ui-card" onSubmit={handleSubmitThread}>

                    <div className="form-group">
                        <label>Title</label>
                        <input
                            type="text"
                            placeholder="What's your question or topic?"
                            value={newTitle}
                            onChange={(e) => setNewTitle(e.target.value)}
                        />
                    </div>

                    <div className="form-group">
                        <label>Category</label>
                        <select value={newCategory} onChange={(e) => setNewCategory(e.target.value)}>
                            {CATEGORIES.filter((c) => c.value).map((c) => (
                                <option key={c.value} value={c.value}>{c.label}</option>
                            ))}
                        </select>
                    </div>

                    <div className="form-group">
                        <label>Message</label>
                        <textarea
                            rows={4}
                            placeholder="Write your post..."
                            value={newBody}
                            onChange={(e) => setNewBody(e.target.value)}
                        />
                    </div>

                    {postError && <p className="coupon-form-error">{postError}</p>}

                    <button type="submit" className="btn btn-primary" disabled={posting}>
                        {posting ? "Posting…" : "Post Discussion"}
                    </button>

                </form>
            )}

            <div className="forum-filters">
                {CATEGORIES.map((c) => (
                    <button
                        key={c.value || "all"}
                        className={`forum-filter-btn ${category === c.value ? "active" : ""}`}
                        onClick={() => setCategory(c.value)}
                    >
                        {c.label}
                    </button>
                ))}
            </div>

            {loading ? (
                <p>Loading discussions…</p>
            ) : error ? (
                <p className="coupon-form-error">{error}</p>
            ) : threads.length === 0 ? (
                <p style={{ color: "var(--text-muted)" }}>No discussions yet — be the first to post!</p>
            ) : (
                <div className="forum-thread-list">
                    {threads.map((thread) => (
                        <div
                            key={thread.id}
                            className="forum-thread-card"
                            onClick={() => navigate(`/forum/${thread.id}`)}
                        >
                            <div className="forum-thread-main">
                                {thread.is_pinned && <span className="forum-pin">📌 Pinned</span>}
                                <h3>{thread.title}</h3>
                                <p className="forum-thread-excerpt">
                                    {thread.body.length > 160 ? `${thread.body.slice(0, 160)}…` : thread.body}
                                </p>
                                <div className="forum-thread-meta">
                                    <span className="forum-category-tag">{thread.category}</span>
                                    <span>by {thread.profiles?.full_name || "Anonymous"}</span>
                                    <span>{new Date(thread.created_at).toLocaleDateString()}</span>
                                </div>
                            </div>
                            <div className="forum-thread-replies">
                                <strong>{thread.reply_count}</strong>
                                <span>{thread.reply_count === 1 ? "reply" : "replies"}</span>
                            </div>
                        </div>
                    ))}
                </div>
            )}

        </div>
    );

}

export default Forum;
