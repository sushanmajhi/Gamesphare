import React, { useEffect, useState, useRef } from "react";
import { Link } from "react-router-dom";
import api from "../api/axiosConfig";
import "./css/Overview.css";

export default function Overview() {
  const [posts, setPosts] = useState([]);
  const [loading, setLoading] = useState(true);
  const [newPost, setNewPost] = useState("");
  const [posting, setPosting] = useState(false);
  const [commenting, setCommenting] = useState({ postId: null, content: "" });
  const [showComments, setShowComments] = useState({});
  
  // Post options state
  const [postOptions, setPostOptions] = useState({
    media: null,
    tags: [],
    game: "",
    mood: "",
    privacy: "public"
  });
  const [showOptions, setShowOptions] = useState(false);
  const fileInputRef = useRef(null);

  useEffect(() => {
    const fetchPosts = async () => {
      try {
        const res = await api.get("/posts/");
        setPosts(res.data);
      } catch (err) {
        console.error("Failed to fetch posts", err);
      } finally {
        setLoading(false);
      }
    };
    fetchPosts();
  }, []);

  const handleMediaUpload = (event) => {
    const file = event.target.files[0];
    if (file) {
      // Validate file type and size
      const validTypes = ['image/jpeg', 'image/png', 'image/gif', 'video/mp4', 'video/avi'];
      const maxSize = 10 * 1024 * 1024; // 10MB
      
      if (!validTypes.includes(file.type)) {
        alert("Please select a valid image or video file (JPEG, PNG, GIF, MP4, AVI)");
        return;
      }
      
      if (file.size > maxSize) {
        alert("File size too large. Maximum size is 10MB");
        return;
      }

      const reader = new FileReader();
      reader.onload = (e) => {
        setPostOptions(prev => ({
          ...prev,
          media: {
            file: file,
            url: e.target.result,
            type: file.type.startsWith('image/') ? 'image' : 'video'
          }
        }));
      };
      reader.readAsDataURL(file);
    }
  };

  const removeMedia = () => {
    setPostOptions(prev => ({ ...prev, media: null }));
  };

  const addTag = (tag) => {
    if (tag.trim() && !postOptions.tags.includes(tag.trim())) {
      setPostOptions(prev => ({
        ...prev,
        tags: [...prev.tags, tag.trim()]
      }));
    }
  };

  const removeTag = (tagToRemove) => {
    setPostOptions(prev => ({
      ...prev,
      tags: prev.tags.filter(tag => tag !== tagToRemove)
    }));
  };

  const handleTagInput = (e) => {
    if (e.key === 'Enter' && e.target.value.trim()) {
      addTag(e.target.value);
      e.target.value = '';
    }
  };

  const addPost = async () => {
    if (!newPost.trim() && !postOptions.media) return;
    
    setPosting(true);
    try {
      const formData = new FormData();
      formData.append('content', newPost.trim());
      
      if (postOptions.media) {
        formData.append('media', postOptions.media.file);
      }
      
      if (postOptions.tags.length > 0) {
        formData.append('tags', JSON.stringify(postOptions.tags));
      }
      
      if (postOptions.game) {
        formData.append('game', postOptions.game);
      }
      
      if (postOptions.mood) {
        formData.append('mood', postOptions.mood);
      }
      
      formData.append('privacy', postOptions.privacy);

      const res = await api.post("/posts/", formData, {
        headers: {
          'Content-Type': 'multipart/form-data'
        }
      });
      
      // Reset form
      setNewPost("");
      setPostOptions({
        media: null,
        tags: [],
        game: "",
        mood: "",
        privacy: "public"
      });
      setShowOptions(false);
      
      // Add to feed
      setPosts(prev => [res.data, ...prev]);
    } catch (err) {
      console.error("Post creation failed", err);
      alert("Failed to create post. Please try again.");
    } finally {
      setPosting(false);
    }
  };

  const likePost = async (postId) => {
    try {
      const res = await api.post(`/posts/${postId}/like/`);
      setPosts(prev => 
        prev.map(post => 
          post.id === postId 
            ? { ...post, likes_count: res.data.likes_count }
            : post
        )
      );
    } catch (err) {
      console.error("Like failed", err);
    }
  };

  const sharePost = async (post) => {
    try {
      const postUrl = `${window.location.origin}/dashboard/post/${post.id}`;
      await navigator.clipboard.writeText(postUrl);
      alert("Post link copied to clipboard! 🎮");
    } catch (err) {
      console.error("Share failed", err);
      alert("Failed to share post. Please try again.");
    }
  };

  // Popular games list
  const popularGames = [
    "Valorant", "League of Legends", "Counter-Strike 2", "Minecraft", 
    "Fortnite", "Call of Duty", "Apex Legends", "Dota 2", "Overwatch 2",
    "Rainbow Six Siege", "GTA V", "Rocket League", "PUBG", "Elden Ring"
  ];

  const moods = ["😊 Happy", "😎 Cool", "🔥 Lit", "🎯 Focused", "😡 Angry", "😂 Laughing", "🤔 Thinking", "🥱 Tired"];

  if (loading) return (
    <div className="loading-container">
      <div className="spinner"></div>
      <p>Loading community posts...</p>
    </div>
  );

  return (
    <div className="overview-container">
      {/* Header */}
      <div className="feed-header">
        <h1>GameSphere Feed</h1>
        <p>Connect with your gaming community</p>
      </div>

      {/* Enhanced Create Post */}
      <div className="create-post">
        <div className="post-input-section">
          <textarea
            className="post-input"
            placeholder="Share your gaming moments, strategies, or achievements..."
            value={newPost}
            onChange={(e) => setNewPost(e.target.value)}
            rows="3"
          />
          
          {/* Media Preview */}
          {postOptions.media && (
            <div className="media-preview">
              {postOptions.media.type === 'image' ? (
                <img src={postOptions.media.url} alt="Preview" className="media-preview-image" />
              ) : (
                <video src={postOptions.media.url} controls className="media-preview-video" />
              )}
              <button className="remove-media-btn" onClick={removeMedia}>×</button>
            </div>
          )}

          {/* Tags Display */}
          {postOptions.tags.length > 0 && (
            <div className="tags-preview">
              {postOptions.tags.map((tag, index) => (
                <span key={index} className="tag">
                  #{tag}
                  <button onClick={() => removeTag(tag)}>×</button>
                </span>
              ))}
            </div>
          )}

          {/* Game & Mood Display */}
          {(postOptions.game || postOptions.mood) && (
            <div className="post-meta-preview">
              {postOptions.game && <span className="game-tag">🎮 {postOptions.game}</span>}
              {postOptions.mood && <span className="mood-tag">{postOptions.mood}</span>}
            </div>
          )}

          <div className="post-actions">
            <div className="post-options-left">
              <button 
                type="button"
                className="option-btn"
                onClick={() => fileInputRef.current?.click()}
              >
                📷 Media
              </button>
              
              <button 
                className="option-btn"
                onClick={() => setShowOptions(!showOptions)}
              >
                ⚙️ Options
              </button>

              <input
                type="file"
                ref={fileInputRef}
                onChange={handleMediaUpload}
                accept="image/*,video/*"
                style={{ display: 'none' }}
              />
            </div>

            <button 
              className="post-button"
              onClick={addPost}
              disabled={posting || (!newPost.trim() && !postOptions.media)}
            >
              {posting ? "Posting..." : "Post"}
            </button>
          </div>

          {/* Advanced Options */}
          {showOptions && (
            <div className="advanced-options">
              <div className="option-group">
                <label>Add Tags</label>
                <input
                  type="text"
                  className="tag-input"
                  placeholder="Type tag and press Enter..."
                  onKeyPress={handleTagInput}
                />
                <div className="suggested-tags">
                  <span>Popular: </span>
                  {["clutch", "epic", "funny", "montage", "tips"].map(tag => (
                    <button 
                      key={tag} 
                      className="suggested-tag"
                      onClick={() => addTag(tag)}
                    >
                      #{tag}
                    </button>
                  ))}
                </div>
              </div>

              <div className="option-group">
                <label>Game</label>
                <select 
                  value={postOptions.game}
                  onChange={(e) => setPostOptions(prev => ({ ...prev, game: e.target.value }))}
                  className="game-select"
                >
                  <option value="">Select a game...</option>
                  {popularGames.map(game => (
                    <option key={game} value={game}>{game}</option>
                  ))}
                </select>
              </div>

              <div className="option-group">
                <label>Mood</label>
                <div className="mood-options">
                  {moods.map(mood => (
                    <button
                      key={mood}
                      className={`mood-btn ${postOptions.mood === mood ? 'selected' : ''}`}
                      onClick={() => setPostOptions(prev => ({ 
                        ...prev, 
                        mood: postOptions.mood === mood ? "" : mood 
                      }))}
                    >
                      {mood}
                    </button>
                  ))}
                </div>
              </div>

              <div className="option-group">
                <label>Privacy</label>
                <div className="privacy-options">
                  <label>
                    <input
                      type="radio"
                      value="public"
                      checked={postOptions.privacy === "public"}
                      onChange={(e) => setPostOptions(prev => ({ ...prev, privacy: e.target.value }))}
                    />
                    🌍 Public
                  </label>
                  <label>
                    <input
                      type="radio"
                      value="friends"
                      checked={postOptions.privacy === "friends"}
                      onChange={(e) => setPostOptions(prev => ({ ...prev, privacy: e.target.value }))}
                    />
                    👥 Friends Only
                  </label>
                  <label>
                    <input
                      type="radio"
                      value="private"
                      checked={postOptions.privacy === "private"}
                      onChange={(e) => setPostOptions(prev => ({ ...prev, privacy: e.target.value }))}
                    />
                    🔒 Only Me
                  </label>
                </div>
              </div>
            </div>
          )}
        </div>
      </div>

      {/* Posts Feed */}
      <div className="posts-feed">
        {posts.length === 0 ? (
          <div className="empty-state">
            <div className="empty-icon">🎮</div>
            <h3>No posts yet</h3>
            <p>Be the first to share something!</p>
          </div>
        ) : (
          posts.map((post) => (
            <div key={post.id} className="post-card">
              <div className="post-header">
                <Link 
                  to={`/dashboard/profile/${post.user || post.author}`}
                  className="user-info"
                >
                  <div className="avatar"></div>
                  <div>
                    <div className="username">{post.user || post.author}</div>
                    <div className="post-time">
                      {new Date(post.created_at).toLocaleString()}
                    </div>
                  </div>
                </Link>
                {post.privacy && (
                  <span className="privacy-badge">
                    {post.privacy === 'public' ? '🌍' : 
                     post.privacy === 'friends' ? '👥' : '🔒'}
                  </span>
                )}
              </div>

              {/* Post Media */}
              {post.media_url && (
                <div className="post-media">
                  {post.media_type === 'image' ? (
                    <img src={post.media_url} alt="Post media" />
                  ) : (
                    <video src={post.media_url} controls />
                  )}
                </div>
              )}

              <div className="post-content">
                <p>{post.content}</p>
              </div>

              {/* Post Tags */}
              {post.tags && post.tags.length > 0 && (
                <div className="post-tags">
                  {post.tags.map((tag, index) => (
                    <span key={index} className="post-tag">#{tag}</span>
                  ))}
                </div>
              )}

              {/* Post Meta */}
              {(post.game || post.mood) && (
                <div className="post-meta">
                  {post.game && <span className="game-badge">🎮 {post.game}</span>}
                  {post.mood && <span className="mood-badge">{post.mood}</span>}
                </div>
              )}

              <div className="post-stats">
                {post.likes_count > 0 && (
                  <span className="likes-count">{post.likes_count} likes</span>
                )}
              </div>

              <div className="post-interactions">
                <button 
                  className="interaction-btn like-btn"
                  onClick={() => likePost(post.id)}
                >
                  👍 Like
                </button>
                <button className="interaction-btn">
                  💬 Comment
                </button>
                <button 
                  className="interaction-btn"
                  onClick={() => sharePost(post)}
                >
                  🔗 Share
                </button>
              </div>
            </div>
          ))
        )}
      </div>
    </div>
  );
}