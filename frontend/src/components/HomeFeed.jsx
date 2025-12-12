import React, { useEffect, useState } from "react";
import { Link, useNavigate } from "react-router-dom";
import api from "../api/axiosConfig";

export default function HomeFeed() {
  const [posts, setPosts] = useState([]);
  const [loading, setLoading] = useState(true);
  const [newPost, setNewPost] = useState("");
  const [error, setError] = useState("");
  const navigate = useNavigate();

  useEffect(() => {
    fetchPosts();
  }, []);

  const fetchPosts = async () => {
    try {
      setLoading(true);
      console.log("Fetching posts from /posts/ endpoint...");
      
      // Check if user is authenticated
      const token = localStorage.getItem("access");
      if (!token) {
        console.error("No access token found");
        setError("Please login to view posts");
        navigate("/login");
        return;
      }

      console.log("Access token found:", token ? "Yes" : "No");
      
      const response = await api.get("/posts/");
      console.log("Posts data received:", response.data);
      setPosts(response.data);
      setError("");
    } catch (err) {
      console.error("Error fetching posts:", err);
      console.error("Error status:", err.response?.status);
      console.error("Error details:", err.response?.data);
      
      if (err.response?.status === 401) {
        setError("Authentication failed. Please login again.");
        // Optionally redirect to login
        // navigate("/login");
      } else {
        setError("Failed to load posts. Please check your connection.");
      }
    } finally {
      setLoading(false);
    }
  };

  const createPost = async () => {
    if (!newPost.trim()) {
      setError("Please write something to post");
      return;
    }

    try {
      console.log("Creating post with content:", newPost);
      const response = await api.post("/posts/", { content: newPost });
      console.log("Post created successfully:", response.data);
      
      // Add new post to the top of the list
      setPosts(prevPosts => [response.data, ...prevPosts]);
      setNewPost("");
      setError("");
    } catch (err) {
      console.error("Error creating post:", err);
      console.error("Error status:", err.response?.status);
      
      if (err.response?.status === 401) {
        setError("Authentication failed. Please login again.");
      } else {
        setError("Failed to create post. Please try again.");
      }
    }
  };

  const handleLike = async (postId) => {
    try {
      const response = await api.post(`/posts/${postId}/like/`);
      console.log("Like response:", response.data);
      
      // Update the post in the list with new like count
      setPosts(prevPosts => 
        prevPosts.map(post => 
          post.id === postId 
            ? { ...post, likes_count: response.data.likes_count }
            : post
        )
      );
    } catch (err) {
      console.error("Error liking post:", err);
      if (err.response?.status === 401) {
        setError("Please login to like posts");
      }
    }
  };

  if (loading) {
    return (
      <div className="container mt-4">
        <div className="text-center">
          <div className="spinner-border text-primary" role="status">
            <span className="visually-hidden">Loading...</span>
          </div>
          <p className="mt-2">Loading posts...</p>
        </div>
      </div>
    );
  }

  return (
    <div className="container mt-4">
      <div className="row justify-content-center">
        <div className="col-md-8">
          {/* Page Header */}
          <div className="d-flex justify-content-between align-items-center mb-4">
            <h2>Home Feed</h2>
            <button 
              className="btn btn-outline-primary btn-sm"
              onClick={fetchPosts}
            >
              🔄 Refresh
            </button>
          </div>

          {/* Error Message */}
          {error && (
            <div className="alert alert-warning alert-dismissible fade show" role="alert">
              {error}
              <button 
                type="button" 
                className="btn-close" 
                onClick={() => setError("")}
              ></button>
            </div>
          )}

          {/* Create Post Section */}
          <div className="card mb-4">
            <div className="card-body">
              <h5 className="card-title">Create Post</h5>
              <textarea
                className="form-control mb-3"
                placeholder="What's happening in your gaming world?"
                value={newPost}
                onChange={(e) => setNewPost(e.target.value)}
                rows="3"
              />
              <div className="d-flex justify-content-between align-items-center">
                <small className="text-muted">
                  {newPost.length}/500 characters
                </small>
                <button 
                  className="btn btn-primary"
                  onClick={createPost}
                  disabled={!newPost.trim()}
                >
                  🎮 Post
                </button>
              </div>
            </div>
          </div>

          {/* Posts List */}
          {posts.length === 0 ? (
            <div className="card text-center">
              <div className="card-body py-5">
                <h5 className="card-title">No posts yet</h5>
                <p className="card-text text-muted">
                  Be the first to share your gaming experience!
                </p>
                <button 
                  className="btn btn-primary"
                  onClick={() => document.querySelector('textarea').focus()}
                >
                  Create First Post
                </button>
              </div>
            </div>
          ) : (
            <div>
              <h5 className="mb-3">
                Recent Posts ({posts.length})
              </h5>
              {posts.map((post) => (
                <div key={post.id} className="card mb-3">
                  <div className="card-body">
                    {/* Post Header */}
                    <div className="d-flex justify-content-between align-items-start mb-2">
                      <Link
                        to={`/dashboard/profile/${post.author}`}
                        className="text-decoration-none"
                      >
                        <h6 className="card-subtitle mb-1 text-primary">
                          👤 {post.author}
                        </h6>
                      </Link>
                      <small className="text-muted">
                        {new Date(post.created_at).toLocaleString()}
                      </small>
                    </div>

                    {/* Post Content */}
                    <p className="card-text">{post.content}</p>

                    {/* Post Actions */}
                    <div className="d-flex gap-2 mt-3">
                      <button 
                        className="btn btn-outline-secondary btn-sm"
                        onClick={() => handleLike(post.id)}
                      >
                        👍 Like ({post.likes_count || 0})
                      </button>
                      <button className="btn btn-outline-secondary btn-sm">
                        💬 Comment
                      </button>
                      <button className="btn btn-outline-secondary btn-sm">
                        🔄 Share
                      </button>
                    </div>
                  </div>
                </div>
              ))}
            </div>
          )}
        </div>
      </div>
    </div>
  );
}