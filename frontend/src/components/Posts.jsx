import { useState, useEffect } from "react";
import api from "../api/axiosConfig";

export default function Posts({ compact }) {
  const [posts, setPosts] = useState([]);
  const [content, setContent] = useState("");

  useEffect(() => {
    fetchPosts();
  }, []);

  const fetchPosts = async () => {
    try {
      const res = await api.get("/posts/");
      setPosts(res.data);
    } catch (err) {
      console.log(err);
    }
  };

  const handleAddPost = async (e) => {
    e.preventDefault();
    if (!content) return;
    try {
      await api.post("/posts/", { content });
      setContent("");
      fetchPosts();
    } catch (err) {
      console.log(err);
    }
  };

  if (compact) {
    return (
      <ul>
        {posts.slice(0, 2).map((p) => (
          <li key={p.id}>{p.content}</li>
        ))}
      </ul>
    );
  }

  return (
    <div>
      <h3>Posts</h3>
      <form onSubmit={handleAddPost} className="mb-3">
        <textarea
          className="form-control"
          placeholder="Write a post..."
          value={content}
          onChange={(e) => setContent(e.target.value)}
        />
        <button className="btn btn-success mt-2">Post</button>
      </form>

      {posts.map((p) => (
        <div key={p.id} className="border p-2 mb-2 rounded">
          <p>{p.content}</p>
          <small className="text-muted">
            {new Date(p.created_at).toLocaleString()}
          </small>
        </div>
      ))}
    </div>
  );
}
