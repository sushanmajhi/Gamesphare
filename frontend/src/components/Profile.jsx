import React, { useEffect, useState } from "react";
import { Link, useLocation, useNavigate } from "react-router-dom";
import api from "../api/axiosConfig";
import "./css/Profile.css";

export default function Profile() {
  const [profile, setProfile] = useState(null);
  const [form, setForm] = useState({});
  const [editing, setEditing] = useState(false);
  const [loading, setLoading] = useState(true);
  const [newPost, setNewPost] = useState("");
  const [friendUsername, setFriendUsername] = useState("");
  const [friendRequests, setFriendRequests] = useState([]);
  const [error, setError] = useState(null);
  const [postLoading, setPostLoading] = useState(false);
  const [activeTab, setActiveTab] = useState("posts");
  const location = useLocation();
  const navigate = useNavigate();

  const [profileStats, setProfileStats] = useState({
    level: 1,
    xp: 0,
    nextLevelXp: 100,
    engagementScore: 0,
    activityRate: 0,
    tournamentsJoined: 0,
    rank: "Bronze I",
    friendsCount: 0,
    postsCount: 0,
    likesReceived: 0,
    commentsMade: 0
  });

  useEffect(() => {
    const fetchProfile = async () => {
      try {
        setLoading(true);
        setError(null);
        const res = await api.get("/profile/");
        setProfile(res.data);
        setForm(res.data);

        const fr = await api.get("/friend-requests/");
        setFriendRequests(fr.data);

        const postsRes = await api.get("/posts/");
        const tournamentsRes = await api.get("/tournaments/my/");
        
        calculateProfileStats(res.data, fr.data, postsRes.data, tournamentsRes.data);

      } catch (err) {
        console.error("Profile fetch failed", err);
        setError("Failed to load profile. Please try again.");
      } finally {
        setLoading(false);
      }
    };
    
    fetchProfile();
  }, [location.pathname]);

  const calculateProfileStats = (profileData, friendRequestsData, postsData, tournamentsData) => {
    if (!profileData) return;

    const postsCount = profileData.posts?.length || 0;
    const friendsCount = profileData.friends?.length || 0;
    
    const userPosts = postsData.filter(post => post.author === profileData.user || post.user === profileData.user);
    const likesReceived = userPosts.reduce((total, post) => total + (post.likes_count || 0), 0);
    const commentsMade = 0; 
    
    const tournamentsJoined = tournamentsData.length || 0;
    const engagementFromPosts = postsCount * 15;
    const engagementFromFriends = friendsCount * 10;
    const engagementFromLikes = likesReceived * 5;
    const engagementFromTournaments = tournamentsJoined * 25;
    const engagementFromComments = commentsMade * 8;
    
    const totalEngagement = engagementFromPosts + engagementFromFriends + engagementFromLikes + 
                           engagementFromTournaments + engagementFromComments;
    
    let level = 1;
    let xpRequired = 0;
    let xpForNextLevel = 100;
    let remainingEngagement = totalEngagement;
    
    while (remainingEngagement >= xpForNextLevel) {
      level++;
      remainingEngagement -= xpForNextLevel;
      xpForNextLevel = Math.floor(xpForNextLevel * 1.2); // 20% increase per level
    }
    
    const ranks = [
      "Bronze I", "Bronze II", "Bronze III",
      "Silver I", "Silver II", "Silver III", 
      "Gold I", "Gold II", "Gold III",
      "Platinum I", "Platinum II", "Platinum III",
      "Diamond I", "Diamond II", "Diamond III",
      "Master", "Grandmaster", "Champion"
    ];
    
    const rankIndex = Math.min(level - 1, ranks.length - 1);
    const rank = ranks[rankIndex];

    const activityRate = Math.min(20 + (postsCount * 2) + (friendsCount * 1), 100);

    setProfileStats({
      level,
      xp: remainingEngagement,
      nextLevelXp: xpForNextLevel,
      engagementScore: totalEngagement,
      activityRate: Math.round(activityRate),
      tournamentsJoined,
      rank,
      friendsCount,
      postsCount,
      likesReceived,
      commentsMade
    });
  };

  const handleChange = (e) =>
    setForm((prev) => ({ ...prev, [e.target.name]: e.target.value }));

  const save = async (e) => {
    e.preventDefault();
    setLoading(true);
    try {
      const res = await api.patch("/profile/", form);
      setProfile(res.data);
      setEditing(false);
      const fr = await api.get("/friend-requests/");
      const postsRes = await api.get("/posts/");
      const tournamentsRes = await api.get("/tournaments/my/");
      calculateProfileStats(res.data, fr.data, postsRes.data, tournamentsRes.data);
    } catch (err) {
      console.error("Update failed", err);
      alert("Update failed. Please try again.");
    } finally {
      setLoading(false);
    }
  };

  const addFriend = async () => {
    if (!friendUsername.trim()) {
      alert("Please enter a username");
      return;
    }
    try {
      await api.post("/friend-requests/", { to_user: friendUsername });
      alert("Friend request sent!");
      setFriendUsername("");
      
      const fr = await api.get("/friend-requests/");
      setFriendRequests(fr.data);
      const profileRes = await api.get("/profile/");
      const postsRes = await api.get("/posts/");
      const tournamentsRes = await api.get("/tournaments/my/");
      setProfile(profileRes.data);
      calculateProfileStats(profileRes.data, fr.data, postsRes.data, tournamentsRes.data);
    } catch (err) {
      console.error("Friend request failed", err);
      alert("Friend request failed. Please check the username and try again.");
    }
  };

  const acceptRequest = async (id) => {
    try {
      await api.post(`/friend-requests/${id}/respond/`, { action: "accept" });
      setFriendRequests((prev) => prev.filter((fr) => fr.id !== id));
      
      const res = await api.get("/profile/");
      const postsRes = await api.get("/posts/");
      const tournamentsRes = await api.get("/tournaments/my/");
      setProfile(res.data);
      calculateProfileStats(res.data, friendRequests.filter(fr => fr.id !== id), postsRes.data, tournamentsRes.data);
    } catch (err) {
      console.error("Accept failed", err);
      alert("Failed to accept friend request.");
    }
  };

  const declineRequest = async (id) => {
    try {
      await api.post(`/friend-requests/${id}/respond/`, { action: "decline" });
      setFriendRequests((prev) => prev.filter((fr) => fr.id !== id));
    } catch (err) {
      console.error("Decline failed", err);
      alert("Failed to decline friend request.");
    }
  };

  const addPost = async () => {
    if (!newPost.trim()) {
      alert("Please write something to post");
      return;
    }
    setPostLoading(true);
    try {
      const res = await api.post("/posts/", { content: newPost });
      const updatedProfile = {
        ...profile,
        posts: [res.data, ...(profile.posts || [])],
      };
      setProfile(updatedProfile);
      setNewPost("");
      // Re-fetch data to recalculate stats
      const fr = await api.get("/friend-requests/");
      const postsRes = await api.get("/posts/");
      const tournamentsRes = await api.get("/tournaments/my/");
      calculateProfileStats(updatedProfile, fr.data, postsRes.data, tournamentsRes.data);
    } catch (err) {
      console.error("Post creation failed", err);
      alert("Failed to create post. Please try again.");
    } finally {
      setPostLoading(false);
    }
  };

  const startConversation = async (friendUsername) => {
    try {
      const response = await api.post("/conversations/", {
        participant: friendUsername
      });
      
      navigate('/dashboard/messages', { 
        state: { selectedConversation: response.data } 
      });
    } catch (err) {
      console.error("Failed to start conversation", err);
      alert("Failed to start conversation. Please try again.");
    }
  };

  const xpProgress = (profileStats.xp / profileStats.nextLevelXp) * 100;

  if (loading) return (
    <div className="profile-container">
      <div className="profile-loading">
        <div className="loading-spinner"></div>
        <p>Loading your profile...</p>
      </div>
    </div>
  );
  
  if (error) return (
    <div className="profile-container">
      <div className="error-card">
        <div className="error-icon">⚠️</div>
        <h3>Oops! Something went wrong</h3>
        <p>{error}</p>
        <button className="btn primary-btn" onClick={() => window.location.reload()}>
          Try Again
        </button>
      </div>
    </div>
  );
  
  if (!profile) return (
    <div className="profile-container">
      <div className="error-card">
        <div className="error-icon">🔍</div>
        <h3>Profile Not Found</h3>
        <p>We couldn't find your profile data.</p>
      </div>
    </div>
  );

  return (
    <div className="profile-container">
      {/* Profile Header */}
      <div className="profile-header">
        <div className="profile-banner">
          <div className="banner-overlay"></div>
          <div className="profile-main">
            <div className="avatar-section">
              <div className="profile-avatar">
                <div className="avatar-image">
                  {profile.user?.charAt(0).toUpperCase() || "U"}
                </div>
                <div className="level-badge">Lvl {profileStats.level}</div>
                <div className="online-status"></div>
              </div>
            </div>
            
            <div className="profile-info">
              <h1 className="profile-name">{profile.user}</h1>
              <div className="profile-rank">
                <i className="fas fa-shield-alt"></i>
                {profileStats.rank}
              </div>
              <div className="profile-meta">
                <span>
                  <i className="fas fa-calendar-alt"></i>
                  Joined {new Date(profile.user_joined).toLocaleDateString()}
                </span>
                <span>
                  <i className="fas fa-chart-line"></i>
                  {profileStats.engagementScore} Engagement Score
                </span>
              </div>
            </div>

            <div className="profile-actions">
              {!editing ? (
                <button
                  className="btn primary-btn edit-btn"
                  onClick={() => setEditing(true)}
                >
                  <i className="fas fa-edit"></i>
                  Edit Profile
                </button>
              ) : (
                <button
                  className="btn secondary-btn"
                  onClick={() => setEditing(false)}
                >
                  <i className="fas fa-times"></i>
                  Cancel
                </button>
              )}
            </div>
          </div>

          {/* XP Progress */}
          <div className="xp-section">
            <div className="xp-info">
              <span>Level {profileStats.level}</span>
              <span>{profileStats.xp} / {profileStats.nextLevelXp} Engagement</span>
            </div>
            <div className="xp-bar">
              <div 
                className="xp-progress" 
                style={{ width: `${xpProgress}%` }}
              ></div>
            </div>
          </div>
        </div>

        {/* Quick Stats */}
        <div className="quick-stats">
          <div className="stat-card">
            <div className="stat-icon activity">
              <i className="fas fa-chart-line"></i>
            </div>
            <div className="stat-content">
              <div className="stat-value">{profileStats.activityRate}%</div>
              <div className="stat-label">Activity Rate</div>
            </div>
          </div>
          
          <div className="stat-card">
            <div className="stat-icon tournaments">
              <i className="fas fa-trophy"></i>
            </div>
            <div className="stat-content">
              <div className="stat-value">{profileStats.tournamentsJoined}</div>
              <div className="stat-label">Tournaments Joined</div>
            </div>
          </div>
          
          <div className="stat-card">
            <div className="stat-icon friends">
              <i className="fas fa-users"></i>
            </div>
            <div className="stat-content">
              <div className="stat-value">{profileStats.friendsCount}</div>
              <div className="stat-label">Friends</div>
            </div>
          </div>
          
          <div className="stat-card">
            <div className="stat-icon engagement">
              <i className="fas fa-heart"></i>
            </div>
            <div className="stat-content">
              <div className="stat-value">{profileStats.likesReceived}</div>
              <div className="stat-label">Likes Received</div>
            </div>
          </div>
        </div>
      </div>

      {/* Rest of the component remains the same, just updating the stats tab */}
      {/* Statistics Tab */}
      {activeTab === 'stats' && (
        <div className="stats-tab">
          <div className="stats-grid">
            <div className="stat-large-card">
              <h3 className="card-title">Platform Engagement</h3>
              <div className="performance-stats">
                <div className="performance-item">
                  <div className="performance-value">{profileStats.postsCount}</div>
                  <div className="performance-label">Posts Created</div>
                </div>
                <div className="performance-item">
                  <div className="performance-value">{profileStats.likesReceived}</div>
                  <div className="performance-label">Likes Received</div>
                </div>
                <div className="performance-item">
                  <div className="performance-value">{profileStats.tournamentsJoined}</div>
                  <div className="performance-label">Tournaments</div>
                </div>
              </div>
            </div>

            <div className="stat-large-card">
              <h3 className="card-title">Social Impact</h3>
              <div className="rank-info">
                <div className="rank-badge">{profileStats.rank}</div>
                <div className="level-info">Level {profileStats.level}</div>
                <div className="xp-info-small">
                  {profileStats.engagementScore} Total Engagement
                </div>
              </div>
            </div>

            <div className="stat-large-card">
              <h3 className="card-title">Community Stats</h3>
              <div className="social-stats">
                <div className="social-item">
                  <i className="fas fa-users"></i>
                  <span>{profileStats.friendsCount} Friends</span>
                </div>
                <div className="social-item">
                  <i className="fas fa-feather"></i>
                  <span>{profileStats.postsCount} Posts</span>
                </div>
                <div className="social-item">
                  <i className="fas fa-trophy"></i>
                  <span>{profileStats.tournamentsJoined} Tournaments</span>
                </div>
                <div className="social-item">
                  <i className="fas fa-calendar-alt"></i>
                  <span>Member since {new Date(profile.user_joined).getFullYear()}</span>
                </div>
              </div>
            </div>
          </div>

          {/* Engagement Breakdown */}
          <div className="engagement-breakdown">
            <h3 className="section-title">Engagement Breakdown</h3>
            <div className="breakdown-grid">
              <div className="breakdown-item">
                <div className="breakdown-label">Posts</div>
                <div className="breakdown-value">{profileStats.postsCount * 15} pts</div>
                <div className="breakdown-bar">
                  <div className="breakdown-fill posts" style={{ width: '40%' }}></div>
                </div>
              </div>
              <div className="breakdown-item">
                <div className="breakdown-label">Friends</div>
                <div className="breakdown-value">{profileStats.friendsCount * 10} pts</div>
                <div className="breakdown-bar">
                  <div className="breakdown-fill friends" style={{ width: '30%' }}></div>
                </div>
              </div>
              <div className="breakdown-item">
                <div className="breakdown-label">Tournaments</div>
                <div className="breakdown-value">{profileStats.tournamentsJoined * 25} pts</div>
                <div className="breakdown-bar">
                  <div className="breakdown-fill tournaments" style={{ width: '20%' }}></div>
                </div>
              </div>
              <div className="breakdown-item">
                <div className="breakdown-label">Likes</div>
                <div className="breakdown-value">{profileStats.likesReceived * 5} pts</div>
                <div className="breakdown-bar">
                  <div className="breakdown-fill likes" style={{ width: '10%' }}></div>
                </div>
              </div>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}