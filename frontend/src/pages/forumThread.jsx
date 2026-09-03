import { useEffect, useState } from "react";
import { useNavigate, useParams, Link } from "react-router-dom";

import "../styles/forum.css";

const API_BASE = "http://localhost:5000/api";

function ForumThread() {

    const { id } = useParams();
    const navigate = useNavigate();

    const isLoggedIn = !!localStorage.getItem("token");
    const storedUser = JSON.parse(localStorage.getItem("user") || "null");

    const [thread, setThread] = useState(null);
    const [replies, setReplies] = useState([]);
    const [loading, setLoading] = useState(true);
    const [error, setError] = useState("");

    const [replyBody, setReplyBody] = useState("");
    const [posting, setPosting] = useState(false);
    const [replyError, setReplyError] = useState("");


    const fetchThread = async () => {

        try {

            setLoading(true);
            setError("");

            const response = await fetch(`${API_BASE}/forum/threads/${id}`);

            const data = await response.json();

            if (!response.ok) {
                throw new Error(data.message || "Failed to load discussion.");
            }

            setThread(data.thread);
            setReplies(data.replies || []);

        } catch (err) {

            console.error("Fetch thread error:", err);
            setError(err.message || "Failed to load discussion.");

        } finally {

            setLoading(false);

        }

    };

    useEffect(() => {
        fetchThread();
        // eslint-disable-next-line react-hooks/exhaustive-deps
    }, [id]);


    const handleReply = async (e) => {

        e.preventDefault();

        setReplyError("");

        if (!isLoggedIn) {
            navigate("/login");
            return;
        }

        if (!replyBody.trim()) {
            setReplyError("Please write a reply first.");
            return;
        }

        try {

            setPosting(true);

            const token = localStorage.getItem("token");

            const response = await fetch(`${API_BASE}/forum/threads/${id}/replies`, {
                method: "POST",
                headers: {
                    "Content-Type": "application/json",
                    Authorization: `Bearer ${token}`
                },
                body: JSON.stringify({ body: replyBody.trim() })
            });

            const data = await response.json();

            if (!response.ok) {
                throw new Error(data.message || "Failed to post reply.");
            }

            setReplyBody("");
            fetchThread();

        } catch (err) {

            console.error("Post reply error:", err);
            setReplyError(err.message || "Failed to post reply.");

        } finally {

            setPosting(false);

        }

    };


    const handleDeleteThread = async () => {

        if (!window.confirm("Delete this discussion and all its replies?")) return;

        try {

            const token = localStorage.getItem("token");

            const response = await fetch(`${API_BASE}/forum/threads/${id}`, {
                method: "DELETE",
                headers: { Authorization: `Bearer ${token}` }
            });

            const data = await response.json();

            if (!response.ok) {
                throw new Error(data.message || "Failed to delete discussion.");
            }

            navigate("/forum");

        } catch (err) {

            console.error("Delete thread error:", err);
            alert(err.message || "Failed to delete discussion.");

        }

    };


    const handleDeleteReply = async (replyId) => {

        if (!window.confirm("Delete this reply?")) return;

        try {

            const token = localStorage.getItem("token");

            const response = await fetch(`${API_BASE}/forum/replies/${replyId}`, {
                method: "DELETE",
                headers: { Authorization: `Bearer ${token}` }
            });

            const data = await response.json();

            if (!response.ok) {
                throw new Error(data.message || "Failed to delete reply.");
            }

            setReplies((prev) => prev.filter((r) => r.id !== replyId));

        } catch (err) {

            console.error("Delete reply error:", err);
            alert(err.message || "Failed to delete reply.");

        }

    };


    if (loading) {
        return <div className="forum-page"><p>Loading discussion…</p></div>;
    }

    if (error || !thread) {
        return (
            <div className="forum-page">
                <p className="coupon-form-error">{error || "Discussion not found."}</p>
                <Link to="/forum">← Back to Forum</Link>
            </div>
        );
    }

    const canModerateThread = isLoggedIn && storedUser &&
        (storedUser.id === thread.author_id || storedUser.role === "admin");


    return (
        <div className="forum-page">

            <Link to="/forum" className="forum-back-link">← Back to Forum</Link>

            <div className="ui-card forum-thread-detail">

                <div className="forum-thread-detail-header">
                    <span className="forum-category-tag">{thread.category}</span>
                    <h1>{thread.title}</h1>
                    <div className="forum-thread-meta">
                        <span>by {thread.profiles?.full_name || "Anonymous"}</span>
                        <span>{new Date(thread.created_at).toLocaleString()}</span>
                    </div>
                </div>

                <p className="forum-thread-body">{thread.body}</p>

                {canModerateThread && (
                    <button className="btn-link danger" onClick={handleDeleteThread}>
                        Delete Discussion
                    </button>
                )}

            </div>

            <h3 className="forum-replies-heading">
                {replies.length} {replies.length === 1 ? "Reply" : "Replies"}
            </h3>

            <div className="forum-reply-list">
                {replies.map((reply) => {

                    const canModerateReply = isLoggedIn && storedUser &&
                        (storedUser.id === reply.author_id || storedUser.role === "admin");

                    return (
                        <div key={reply.id} className="forum-reply-card">
                            <div className="forum-reply-meta">
                                <strong>{reply.profiles?.full_name || "Anonymous"}</strong>
                                <span>{new Date(reply.created_at).toLocaleString()}</span>
                            </div>
                            <p>{reply.body}</p>
                            {canModerateReply && (
                                <button
                                    className="btn-link danger"
                                    onClick={() => handleDeleteReply(reply.id)}
                                >
                                    Delete
                                </button>
                            )}
                        </div>
                    );

                })}
            </div>

            <form className="ui-card forum-reply-form" onSubmit={handleReply}>

                <div className="form-group">
                    <label>Write a Reply</label>
                    <textarea
                        rows={3}
                        placeholder={isLoggedIn ? "Share your thoughts..." : "Log in to reply"}
                        value={replyBody}
                        onChange={(e) => setReplyBody(e.target.value)}
                        disabled={!isLoggedIn}
                    />
                </div>

                {replyError && <p className="coupon-form-error">{replyError}</p>}

                <button type="submit" className="btn btn-primary" disabled={posting}>
                    {isLoggedIn ? (posting ? "Posting…" : "Post Reply") : "Log In to Reply"}
                </button>

            </form>

        </div>
    );

}

export default ForumThread;
