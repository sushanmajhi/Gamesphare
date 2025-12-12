import { useState, useEffect } from "react";
import api from "../api/axiosConfig";

export default function Friends({ compact }) {
  const [friendRequests, setFriendRequests] = useState([]);
  const [friendUsername, setFriendUsername] = useState("");

  useEffect(() => {
    fetchFriendRequests();
  }, []);

  const fetchFriendRequests = async () => {
    try {
      const res = await api.get("/friends/requests/");
      setFriendRequests(res.data);
    } catch (err) {
      console.log(err);
    }
  };

  const handleSendRequest = async () => {
    if (!friendUsername) return;
    try {
      await api.post("/friends/requests/", { to_user: friendUsername });
      setFriendUsername("");
      fetchFriendRequests();
      alert("Friend request sent!");
    } catch (err) {
      alert(err.response?.data?.detail || "Error sending request");
    }
  };

  const handleRespondRequest = async (id, action) => {
    try {
      await api.post(`/friends/requests/${id}/respond/`, { action });
      fetchFriendRequests();
    } catch (err) {
      console.log(err);
    }
  };

  if (compact) {
    return (
      <ul>
        {friendRequests.filter(r => r.accepted).map((r) => (
          <li key={r.id}>{r.from_user}</li>
        ))}
      </ul>
    );
  }

  return (
    <div>
      <h3>Friends & Requests</h3>
      <div className="mb-3 d-flex gap-2">
        <input
          className="form-control"
          placeholder="Enter username"
          value={friendUsername}
          onChange={(e) => setFriendUsername(e.target.value)}
        />
        <button className="btn btn-primary" onClick={handleSendRequest}>
          Send Request
        </button>
      </div>

      <h5>Received Requests</h5>
      {friendRequests.length === 0 && <p>No friend requests</p>}
      {friendRequests.map((req) => (
        <div key={req.id} className="d-flex align-items-center gap-2 mb-1">
          <span>{req.from_user}</span>
          {!req.accepted ? (
            <>
              <button
                className="btn btn-sm btn-success"
                onClick={() => handleRespondRequest(req.id, "accept")}
              >
                Accept
              </button>
              <button
                className="btn btn-sm btn-danger"
                onClick={() => handleRespondRequest(req.id, "decline")}
              >
                Decline
              </button>
            </>
          ) : (
            <span className="badge bg-success">Friends</span>
          )}
        </div>
      ))}
    </div>
  );
}
