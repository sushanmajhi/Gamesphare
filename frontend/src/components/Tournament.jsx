import React, { useEffect, useState } from "react";
import { Link, useNavigate } from "react-router-dom";
import api from "../api/axiosConfig";
import "./css/Tournament.css";

export default function Tournament() {
  const [tournaments, setTournaments] = useState([]);
  const [myTournaments, setMyTournaments] = useState([]);
  const [loading, setLoading] = useState(true);
  const [createLoading, setCreateLoading] = useState(false);
  const [error, setError] = useState(null);
  const [showCreateForm, setShowCreateForm] = useState(false);
  const [selectedTournament, setSelectedTournament] = useState(null);
  const [activeTab, setActiveTab] = useState("all");
  const navigate = useNavigate();

  // Tournament creation form state
  const [form, setForm] = useState({
    name: "",
    description: "",
    game: "valorant",
    max_participants: 16,
    entry_fee: 0,
    prize_pool: 0,
    start_date: "",
    end_date: "",
    rules: ""
  });

  useEffect(() => {
    fetchTournaments();
  }, [activeTab]);

  const fetchTournaments = async () => {
    try {
      setLoading(true);
      setError(null);
      
      if (activeTab === "all") {
        const res = await api.get("/tournaments/");
        setTournaments(res.data);
      } else if (activeTab === "my") {
        const res = await api.get("/tournaments/my/");
        setMyTournaments(res.data);
      }
    } catch (err) {
      console.error("Tournaments fetch failed", err);
      setError("Failed to load tournaments. Please try again.");
    } finally {
      setLoading(false);
    }
  };

  const handleChange = (e) => {
    setForm((prev) => ({ 
      ...prev, 
      [e.target.name]: e.target.value 
    }));
  };

  const createTournament = async (e) => {
    e.preventDefault();
    setCreateLoading(true);
    try {
      await api.post("/tournaments/", form);
      setShowCreateForm(false);
      setForm({
        name: "",
        description: "",
        game: "valorant",
        max_participants: 16,
        entry_fee: 0,
        prize_pool: 0,
        start_date: "",
        end_date: "",
        rules: ""
      });
      fetchTournaments();
      alert("Tournament created successfully!");
    } catch (err) {
      console.error("Tournament creation failed", err);
      alert("Failed to create tournament. Please try again.");
    } finally {
      setCreateLoading(false);
    }
  };

  const joinTournament = async (tournamentId) => {
    try {
      await api.post(`/tournaments/${tournamentId}/join/`);
      alert("Successfully joined the tournament!");
      fetchTournaments();
    } catch (err) {
      console.error("Join failed", err);
      alert(err.response?.data?.error || "Failed to join tournament.");
    }
  };

  const leaveTournament = async (tournamentId) => {
    try {
      await api.post(`/tournaments/${tournamentId}/leave/`);
      alert("Successfully left the tournament!");
      fetchTournaments();
    } catch (err) {
      console.error("Leave failed", err);
      alert(err.response?.data?.error || "Failed to leave tournament.");
    }
  };

  const viewTournamentDetails = async (tournamentId) => {
    try {
      const res = await api.get(`/tournaments/${tournamentId}/`);
      setSelectedTournament(res.data);
      setActiveTab("details");
    } catch (err) {
      console.error("Failed to fetch tournament details", err);
      alert("Failed to load tournament details.");
    }
  };

  const startMatch = async (matchId) => {
    try {
      await api.post(`/matches/${matchId}/start/`);
      alert("Match started!");
      if (selectedTournament) {
        viewTournamentDetails(selectedTournament.id);
      }
    } catch (err) {
      console.error("Failed to start match", err);
      alert("Failed to start match.");
    }
  };

  const submitMatchResult = async (matchId, winnerId, scoreP1, scoreP2) => {
    try {
      await api.post(`/matches/${matchId}/result/`, {
        winner: winnerId,
        score_p1: scoreP1,
        score_p2: scoreP2
      });
      alert("Match result submitted!");
      if (selectedTournament) {
        viewTournamentDetails(selectedTournament.id);
      }
    } catch (err) {
      console.error("Failed to submit result", err);
      alert("Failed to submit match result.");
    }
  };

  const formatDate = (dateString) => {
    return new Date(dateString).toLocaleDateString();
  };

  const formatDateTime = (dateString) => {
    return new Date(dateString).toLocaleString();
  };

  if (loading && activeTab !== "details") {
    return (
      <div className="tournament-card">
        <div className="tournament-loading">
          <div className="spinner"></div>
          <span>Loading tournaments...</span>
        </div>
      </div>
    );
  }

  if (error) {
    return (
      <div className="tournament-card text-center">
        <div className="alert alert-warning">{error}</div>
      </div>
    );
  }

  return (
    <div className="tournament-card">
      {/* Header */}
      <div className="tournament-header">
        <div>
          <h4 className="neon-text mb-2">🎮 Tournaments</h4>
          <small className="text-muted">
            Compete, win prizes, and showcase your skills
          </small>
        </div>
        <button
          className="btn neon-button"
          onClick={() => setShowCreateForm(!showCreateForm)}
        >
          {showCreateForm ? (
            <>
              <i className="fas fa-times me-2"></i>Cancel
            </>
          ) : (
            <>
              <i className="fas fa-plus me-2"></i>Create Tournament
            </>
          )}
        </button>
      </div>

      {/* Create Tournament Form */}
      {showCreateForm && (
        <div className="tournament-form-card">
          <div className="card-header">
            <h5 className="neon-text mb-0">Create New Tournament</h5>
          </div>
          <div className="card-body">
            <form onSubmit={createTournament}>
              <div className="row">
                <div className="col-md-6">
                  <div className="form-group">
                    <label className="form-label">Tournament Name *</label>
                    <input
                      type="text"
                      name="name"
                      className="form-control form-input"
                      value={form.name}
                      onChange={handleChange}
                      required
                      placeholder="Enter tournament name..."
                    />
                  </div>
                </div>
                <div className="col-md-6">
                  <div className="form-group">
                    <label className="form-label">Game *</label>
                    <select
                      name="game"
                      className="form-control form-input"
                      value={form.game}
                      onChange={handleChange}
                      required
                    >
                      <option value="valorant">Valorant</option>
                      <option value="csgo">CS:GO</option>
                      <option value="lol">League of Legends</option>
                      <option value="dota2">Dota 2</option>
                      <option value="fortnite">Fortnite</option>
                      <option value="cod">Call of Duty</option>
                      <option value="overwatch">Overwatch</option>
                      <option value="other">Other</option>
                    </select>
                  </div>
                </div>
              </div>

              <div className="form-group">
                <label className="form-label">Description *</label>
                <textarea
                  name="description"
                  className="form-control form-input"
                  value={form.description}
                  onChange={handleChange}
                  rows="3"
                  required
                  placeholder="Describe your tournament..."
                />
              </div>

              <div className="row">
                <div className="col-md-4">
                  <div className="form-group">
                    <label className="form-label">Max Participants *</label>
                    <input
                      type="number"
                      name="max_participants"
                      className="form-control form-input"
                      value={form.max_participants}
                      onChange={handleChange}
                      min="2"
                      max="128"
                      required
                    />
                  </div>
                </div>
                <div className="col-md-4">
                  <div className="form-group">
                    <label className="form-label">Entry Fee ($)</label>
                    <input
                      type="number"
                      name="entry_fee"
                      className="form-control form-input"
                      value={form.entry_fee}
                      onChange={handleChange}
                      min="0"
                      step="0.01"
                    />
                  </div>
                </div>
                <div className="col-md-4">
                  <div className="form-group">
                    <label className="form-label">Prize Pool ($)</label>
                    <input
                      type="number"
                      name="prize_pool"
                      className="form-control form-input"
                      value={form.prize_pool}
                      onChange={handleChange}
                      min="0"
                      step="0.01"
                    />
                  </div>
                </div>
              </div>

              <div className="row">
                <div className="col-md-6">
                  <div className="form-group">
                    <label className="form-label">Start Date & Time *</label>
                    <input
                      type="datetime-local"
                      name="start_date"
                      className="form-control form-input"
                      value={form.start_date}
                      onChange={handleChange}
                      required
                    />
                  </div>
                </div>
                <div className="col-md-6">
                  <div className="form-group">
                    <label className="form-label">End Date & Time *</label>
                    <input
                      type="datetime-local"
                      name="end_date"
                      className="form-control form-input"
                      value={form.end_date}
                      onChange={handleChange}
                      required
                    />
                  </div>
                </div>
              </div>

              <div className="form-group">
                <label className="form-label">Rules (Optional)</label>
                <textarea
                  name="rules"
                  className="form-control form-input"
                  value={form.rules}
                  onChange={handleChange}
                  rows="4"
                  placeholder="Add tournament rules and guidelines..."
                />
              </div>

              <div className="form-actions">
                <button
                  type="button"
                  className="btn btn-secondary"
                  onClick={() => setShowCreateForm(false)}
                >
                  <i className="fas fa-times me-2"></i>Cancel
                </button>
                <button 
                  type="submit" 
                  className="btn neon-button"
                  disabled={createLoading}
                >
                  {createLoading ? (
                    <>
                      <div className="spinner-border spinner-border-sm me-2"></div>
                      Creating...
                    </>
                  ) : (
                    <>
                      <i className="fas fa-trophy me-2"></i>Create Tournament
                    </>
                  )}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* Navigation Tabs */}
      <div className="tournament-tabs">
        <button
          className={`tournament-tab ${activeTab === "all" ? "active" : ""}`}
          onClick={() => setActiveTab("all")}
        >
          <i className="fas fa-list me-2"></i>All Tournaments
        </button>
        <button
          className={`tournament-tab ${activeTab === "my" ? "active" : ""}`}
          onClick={() => setActiveTab("my")}
        >
          <i className="fas fa-users me-2"></i>My Tournaments
        </button>
        {activeTab === "details" && (
          <button className="tournament-tab active">
            <i className="fas fa-info-circle me-2"></i>Tournament Details
          </button>
        )}
      </div>

      {/* Tournament Details View */}
      {activeTab === "details" && selectedTournament && (
        <div className="tournament-details-card">
          <div className="card-header">
            <div className="d-flex justify-content-between align-items-center">
              <h5 className="neon-text mb-0">{selectedTournament.name}</h5>
              <button
                className="btn btn-outline-secondary btn-sm"
                onClick={() => setActiveTab("my")}
              >
                <i className="fas fa-arrow-left me-2"></i>Back to My Tournaments
              </button>
            </div>
          </div>
          <div className="card-body">
            <div className="tournament-info-grid">
              <div className="info-section">
                <p><strong>Game:</strong> {selectedTournament.game}</p>
                <p><strong>Status:</strong> 
                  <span className={`tournament-status ${selectedTournament.status}`}>
                    {selectedTournament.status}
                  </span>
                </p>
                <p><strong>Participants:</strong> {selectedTournament.current_participants}/{selectedTournament.max_participants}</p>
              </div>
              <div className="info-section">
                <p><strong>Entry Fee:</strong> ${selectedTournament.entry_fee}</p>
                <p><strong>Prize Pool:</strong> ${selectedTournament.prize_pool}</p>
                <p><strong>Starts:</strong> {formatDateTime(selectedTournament.start_date)}</p>
              </div>
            </div>

            <div className="description-section">
              <h6 className="neon-text">Description</h6>
              <p className="text-muted">{selectedTournament.description}</p>
            </div>

            {selectedTournament.rules && (
              <div className="rules-section">
                <h6 className="neon-text">Rules</h6>
                <p className="text-muted">{selectedTournament.rules}</p>
              </div>
            )}

            {/* Participants */}
            <div className="participants-section">
              <h6 className="neon-text">Participants ({selectedTournament.participants?.length || 0})</h6>
              <div className="participants-grid">
                {selectedTournament.participants?.map((participant, index) => (
                  <span key={index} className="participant-badge">
                    <i className="fas fa-user me-1"></i>{participant.user.username}
                  </span>
                ))}
              </div>
            </div>

            {/* Matches Bracket */}
            {selectedTournament.matches && selectedTournament.matches.length > 0 && (
              <div className="bracket-section">
                <h6 className="neon-text">Tournament Bracket</h6>
                {selectedTournament.matches.map((match) => (
                  <div key={match.id} className="match-card">
                    <div className="match-body">
                      <div className="match-header">
                        <div>
                          <strong>Round {match.round_number} - Match {match.match_number}</strong>
                          <div className="match-teams">
                            {match.participant1.user.username} vs {match.participant2.user.username}
                          </div>
                          {match.status === 'completed' && (
                            <div className="match-result">
                              <i className="fas fa-trophy me-1"></i>
                              Winner: {match.winner?.user.username} ({match.score_p1}-{match.score_p2})
                            </div>
                          )}
                        </div>
                        <div className="match-actions">
                          <span className={`match-status ${match.status}`}>
                            {match.status}
                          </span>
                          {selectedTournament.created_by.id === JSON.parse(localStorage.getItem("user")).id && (
                            <div className="match-admin-actions">
                              {match.status === 'scheduled' && (
                                <button
                                  className="btn btn-sm btn-success"
                                  onClick={() => startMatch(match.id)}
                                >
                                  <i className="fas fa-play me-1"></i>Start Match
                                </button>
                              )}
                            </div>
                          )}
                        </div>
                      </div>
                    </div>
                  </div>
                ))}
              </div>
            )}
          </div>
        </div>
      )}

      {/* All Tournaments View */}
      {activeTab === "all" && (
        <div>
          <h5 className="neon-text mb-4">Available Tournaments</h5>
          {tournaments.length === 0 ? (
            <div className="empty-tournaments">
              <i className="fas fa-trophy empty-icon"></i>
              <p>No tournaments available at the moment.</p>
              <button 
                className="btn neon-button"
                onClick={() => setShowCreateForm(true)}
              >
                <i className="fas fa-plus me-2"></i>Create the first tournament!
              </button>
            </div>
          ) : (
            <div className="tournaments-grid">
              {tournaments.map((tournament) => (
                <div key={tournament.id} className="tournament-item-card">
                  <div className="tournament-item-body">
                    <div className="tournament-item-header">
                      <div>
                        <h6 className="tournament-name">{tournament.name}</h6>
                        <p className="tournament-meta">{tournament.game} • {formatDate(tournament.start_date)}</p>
                        <p className="tournament-description">{tournament.description}</p>
                        <div className="tournament-stats">
                          <small className="text-muted">
                            <i className="fas fa-users me-1"></i>
                            {tournament.current_participants}/{tournament.max_participants} • 
                            <i className="fas fa-dollar-sign me-1 ms-2"></i>
                            Prize: ${tournament.prize_pool} • 
                            <i className="fas fa-ticket me-1 ms-2"></i>
                            Entry: ${tournament.entry_fee}
                          </small>
                        </div>
                      </div>
                      <div className="tournament-item-actions">
                        <span className={`tournament-status ${tournament.status}`}>
                          {tournament.status}
                        </span>
                        <div className="action-buttons">
                          {tournament.can_join && (
                            <button
                              className="btn btn-sm btn-success me-1"
                              onClick={() => joinTournament(tournament.id)}
                            >
                              <i className="fas fa-sign-in-alt me-1"></i>Join
                            </button>
                          )}
                          {tournament.is_joined && (
                            <button
                              className="btn btn-sm btn-primary me-1"
                              onClick={() => viewTournamentDetails(tournament.id)}
                            >
                              <i className="fas fa-eye me-1"></i>View
                            </button>
                          )}
                          {tournament.is_joined && tournament.status === 'upcoming' && (
                            <button
                              className="btn btn-sm btn-danger"
                              onClick={() => leaveTournament(tournament.id)}
                            >
                              <i className="fas fa-sign-out-alt me-1"></i>Leave
                            </button>
                          )}
                        </div>
                      </div>
                    </div>
                  </div>
                </div>
              ))}
            </div>
          )}
        </div>
      )}

      {/* My Tournaments View */}
      {activeTab === "my" && (
        <div>
          <h5 className="neon-text mb-4">My Tournaments</h5>
          {myTournaments.length === 0 ? (
            <div className="empty-tournaments">
              <i className="fas fa-users empty-icon"></i>
              <p>You haven't joined any tournaments yet.</p>
              <div className="empty-actions">
                <button 
                  className="btn neon-button me-3"
                  onClick={() => setActiveTab("all")}
                >
                  <i className="fas fa-search me-2"></i>Browse Tournaments
                </button>
                <button 
                  className="btn btn-outline-primary"
                  onClick={() => setShowCreateForm(true)}
                >
                  <i className="fas fa-plus me-2"></i>Create Tournament
                </button>
              </div>
            </div>
          ) : (
            <div className="tournaments-grid">
              {myTournaments.map((tournament) => (
                <div key={tournament.id} className="tournament-item-card">
                  <div className="tournament-item-body">
                    <div className="tournament-item-header">
                      <div>
                        <h6 className="tournament-name">{tournament.name}</h6>
                        <p className="tournament-meta">{tournament.game} • {formatDate(tournament.start_date)}</p>
                        <p className="tournament-description">{tournament.description}</p>
                        <div className="tournament-stats">
                          <small className="text-muted">
                            <i className="fas fa-user me-1"></i>
                            Your Status: <span className="participant-badge">Participant</span> • 
                            <i className="fas fa-chart-line me-1 ms-2"></i>
                            Progress: {tournament.current_participants}/{tournament.max_participants}
                          </small>
                        </div>
                      </div>
                      <div className="tournament-item-actions">
                        <span className={`tournament-status ${tournament.status}`}>
                          {tournament.status}
                        </span>
                        <div className="action-buttons">
                          <button
                            className="btn btn-sm btn-primary me-1"
                            onClick={() => viewTournamentDetails(tournament.id)}
                          >
                            <i className="fas fa-info-circle me-1"></i>Details
                          </button>
                          {tournament.status === 'upcoming' && (
                            <button
                              className="btn btn-sm btn-danger"
                              onClick={() => leaveTournament(tournament.id)}
                            >
                              <i className="fas fa-sign-out-alt me-1"></i>Leave
                            </button>
                          )}
                        </div>
                      </div>
                    </div>
                  </div>
                </div>
              ))}
            </div>
          )}
        </div>
      )}
    </div>
  );
}