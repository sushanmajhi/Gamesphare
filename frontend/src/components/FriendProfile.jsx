import React, { useEffect, useState } from "react";
import { useParams, useNavigate } from "react-router-dom";
import api from "../api/axiosConfig";
import "./css/FriendProfile.css"; 

export default function FriendProfile() {
  const { username } = useParams();
  const navigate = useNavigate();
  const [friend, setFriend] = useState(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    const fetchFriend = async () => {
      try {
        const res = await api.get(`/profile/${username}/`);
        setFriend(res.data);
      } catch (err) {
        console.error("Friend profile fetch failed", err);
      } finally {
        setLoading(false);
      }
    };
    fetchFriend();
  }, [username]);

  if (loading) return <div className="fp-card p-4">Loading friend profile...</div>;
  if (!friend) return <div className="fp-card p-4">Friend not found</div>;

  return (
    <div className="fp-card p-4 shadow-lg">
      {/* Back Button */}
      <button className="btn btn-outline-light mb-3" onClick={() => navigate(-1)}>
        &larr; Back
      </button>

      <h3 className="fp-name">{friend.user}</h3>
      <small className="text-muted">Joined: {new Date(friend.user_joined).toLocaleDateString()}</small>

      {/* Friend Info */}
      <div className="mt-3 fp-info">
        <p><strong>Bio:</strong> {friend.bio || "—"}</p>
        <p><strong>Skills:</strong> {friend.skills || "—"}</p>
        <p><strong>Games:</strong> {friend.games || "—"}</p>
        <p><strong>Platform:</strong> {friend.platform || "—"}</p>
        <p><strong>Achievements:</strong> {friend.achievements || "—"}</p>
      </div>

      {/* Friend's Friends */}
      <h5 className="mt-4">Friends</h5>
      {friend.friends?.length ? (
        <div className="d-flex flex-wrap gap-2">
          {friend.friends.map((f, i) => (
            <span key={i} className="fp-friend-badge">{f}</span>
          ))}
        </div>
      ) : (
        <p>No friends yet</p>
      )}

      {/* Friend's Posts */}
      <h5 className="mt-4">Posts</h5>
      {friend.posts?.length ? (
        friend.posts.map((p, i) => (
          <div key={i} className="fp-post-card mb-2">
            <p>{p.content}</p>
            <small className="text-muted">{new Date(p.created_at).toLocaleString()}</small>
          </div>
        ))
      ) : (
        <p>No posts yet</p>
      )}
    </div>
  );
}
