import React, { useState } from "react";
import { useNavigate } from "react-router-dom";
import { useAuth } from "../context/AuthContext";
import styles from "./ProfilePage.module.css";

const COLORS = [
  "#6366f1", "#8b5cf6", "#ec4899", "#ef4444",
  "#f97316", "#eab308", "#22c55e", "#06b6d4",
];

export default function ProfilePage() {
  const { user, updateProfile } = useAuth();
  const [firstName, setFirstName] = useState(user?.firstName || "");
  const [lastName, setLastName] = useState(user?.lastName || "");
  const [color, setColor] = useState(user?.color || COLORS[0]);
  const [error, setError] = useState("");
  const [loading, setLoading] = useState(false);
  const navigate = useNavigate();

  const handleSubmit = async (e) => {
    e.preventDefault();
    setError("");
    setLoading(true);
    try {
      await updateProfile({ firstName, lastName, color });
      navigate("/chat");
    } catch (err) {
      setError(err.response?.data?.message || "Failed to update profile");
    } finally {
      setLoading(false);
    }
  };

  const initials = (firstName[0] || user?.email?.[0] || "?").toUpperCase();

  return (
    <div className={styles.container}>
      <div className={styles.bg}>
        <div className={styles.orb} />
      </div>
      <div className={styles.card}>
        <div className={styles.header}>
          <div className={styles.avatar} style={{ background: color }}>
            {initials}
          </div>
          <div>
            <h1 className={styles.title}>Set Up Profile</h1>
            <p className={styles.sub}>{user?.email}</p>
          </div>
        </div>

        <form onSubmit={handleSubmit} className={styles.form}>
          <div className={styles.row}>
            <div className={styles.field}>
              <label className={styles.label}>FIRST NAME</label>
              <input
                type="text"
                value={firstName}
                onChange={(e) => setFirstName(e.target.value)}
                className={styles.input}
                placeholder="John"
                required
              />
            </div>
            <div className={styles.field}>
              <label className={styles.label}>LAST NAME</label>
              <input
                type="text"
                value={lastName}
                onChange={(e) => setLastName(e.target.value)}
                className={styles.input}
                placeholder="Doe"
                required
              />
            </div>
          </div>

          <div className={styles.field}>
            <label className={styles.label}>ACCENT COLOR</label>
            <div className={styles.colorGrid}>
              {COLORS.map((c) => (
                <button
                  key={c}
                  type="button"
                  className={`${styles.colorBtn} ${color === c ? styles.selectedColor : ""}`}
                  style={{ background: c }}
                  onClick={() => setColor(c)}
                />
              ))}
            </div>
          </div>

          {error && <div className={styles.error}>{error}</div>}

          <button type="submit" className={styles.submitBtn} disabled={loading}>
            {loading ? <span className={styles.spinner} /> : "Save & Continue →"}
          </button>
        </form>
      </div>
    </div>
  );
}
