import React, { useState, useEffect, useRef, useCallback } from "react";
import { useAuth } from "../context/AuthContext";
import { useSocket } from "../context/SocketContext";
import apiClient from "../api/client";
import styles from "./ChatPage.module.css";

// ── Avatar ──────────────────────────────────────────────────────────────────
function Avatar({ user, size = 36 }) {
  const initials = user?.firstName
    ? (user.firstName[0] + (user.lastName?.[0] || "")).toUpperCase()
    : (user?.email?.[0] || "?").toUpperCase();
  return (
    <div
      className={styles.avatar}
      style={{ width: size, height: size, fontSize: size * 0.38, background: user?.color || "#6366f1" }}
    >
      {initials}
    </div>
  );
}

// ── Contact Item ─────────────────────────────────────────────────────────────
function ContactItem({ contact, active, onClick, onDelete }) {
  const displayName = contact.firstName
    ? `${contact.firstName} ${contact.lastName || ""}`.trim()
    : contact.label || contact.email || "Unknown";

  return (
    <div className={`${styles.contactItem} ${active ? styles.activeContact : ""}`} onClick={onClick}>
      <Avatar user={contact} size={38} />
      <div className={styles.contactInfo}>
        <span className={styles.contactName}>{displayName}</span>
        <span className={styles.contactEmail}>{contact.email || ""}</span>
      </div>
      {active && onDelete && (
        <button
          className={styles.deleteBtn}
          onClick={(e) => { e.stopPropagation(); onDelete(contact); }}
          title="Delete conversation"
        >
          ✕
        </button>
      )}
    </div>
  );
}

// ── Message Bubble ────────────────────────────────────────────────────────────
function MessageBubble({ msg, isMine }) {
  const time = new Date(msg.timestamp).toLocaleTimeString([], { hour: "2-digit", minute: "2-digit" });
  return (
    <div className={`${styles.msgRow} ${isMine ? styles.mine : styles.theirs}`}>
      {!isMine && <Avatar user={msg.sender} size={28} />}
      <div className={`${styles.bubble} ${isMine ? styles.bubbleMine : styles.bubbleTheirs}`}>
        <span className={styles.msgText}>{msg.content}</span>
        <span className={styles.msgTime}>{time}</span>
      </div>
    </div>
  );
}

// ── Search Modal ──────────────────────────────────────────────────────────────
function SearchModal({ onSelect, onClose }) {
  const [query, setQuery] = useState("");
  const [results, setResults] = useState([]);
  const [loading, setLoading] = useState(false);
  const inputRef = useRef(null);

  useEffect(() => { inputRef.current?.focus(); }, []);

  useEffect(() => {
    if (!query.trim()) { setResults([]); return; }
    const t = setTimeout(async () => {
      setLoading(true);
      try {
        const res = await apiClient.post("/api/contacts/search", { searchTerm: query });
        setResults(res.data.contacts || []);
      } catch { setResults([]); }
      finally { setLoading(false); }
    }, 300);
    return () => clearTimeout(t);
  }, [query]);

  return (
    <div className={styles.modalOverlay} onClick={onClose}>
      <div className={styles.modal} onClick={(e) => e.stopPropagation()}>
        <div className={styles.modalHeader}>
          <span className={styles.modalTitle}>New Message</span>
          <button className={styles.closeBtn} onClick={onClose}>✕</button>
        </div>
        <div className={styles.searchBox}>
          <span className={styles.searchIcon}>⌕</span>
          <input
            ref={inputRef}
            className={styles.searchInput}
            value={query}
            onChange={(e) => setQuery(e.target.value)}
            placeholder="Search by name or email..."
          />
        </div>
        <div className={styles.searchResults}>
          {loading && <div className={styles.searchNote}>Searching...</div>}
          {!loading && query && results.length === 0 && (
            <div className={styles.searchNote}>No users found</div>
          )}
          {results.map((c) => (
            <ContactItem key={c._id} contact={c} onClick={() => onSelect(c)} />
          ))}
        </div>
      </div>
    </div>
  );
}

// ── Main Chat Page ─────────────────────────────────────────────────────────────
export default function ChatPage() {
  const { user, logout } = useAuth();
  const { socket } = useSocket();
  const [contacts, setContacts] = useState([]);
  const [selectedContact, setSelectedContact] = useState(null);
  const [messages, setMessages] = useState([]);
  const [input, setInput] = useState("");
  const [showSearch, setShowSearch] = useState(false);
  const messagesEndRef = useRef(null);
  const inputRef = useRef(null);

  // Load contact list
  const loadContacts = useCallback(async () => {
    try {
      const res = await apiClient.get("/api/contacts/get-contacts-for-list");
      setContacts(res.data.contacts || []);
    } catch {}
  }, []);

  useEffect(() => { loadContacts(); }, [loadContacts]);

  // Load messages when contact selected
  useEffect(() => {
    if (!selectedContact) return;
    const load = async () => {
      try {
        const res = await apiClient.post("/api/messages/get-messages", { id: selectedContact._id });
        setMessages(res.data.messages || []);
      } catch { setMessages([]); }
    };
    load();
  }, [selectedContact]);

  // Socket: receive messages
  useEffect(() => {
    if (!socket) return;
    const handler = (msg) => {
      const senderId = msg.sender?._id || msg.sender;
      const recipientId = msg.recipient?._id || msg.recipient;
      const partnerId = selectedContact?._id;
      if (partnerId && (senderId === partnerId || recipientId === partnerId)) {
        setMessages((prev) => {
          // avoid duplicates
          if (prev.some((m) => m.id === msg.id || m._id === msg.id)) return prev;
          return [...prev, { ...msg, _id: msg.id }];
        });
      }
      loadContacts();
    };
    socket.on("receiveMessage", handler);
    return () => socket.off("receiveMessage", handler);
  }, [socket, selectedContact, loadContacts]);

  // Scroll to bottom
  useEffect(() => {
    messagesEndRef.current?.scrollIntoView({ behavior: "smooth" });
  }, [messages]);

  const sendMessage = (e) => {
    e.preventDefault();
    if (!input.trim() || !selectedContact || !socket) return;
    socket.emit("sendMessage", {
      sender: user.id,
      recipient: selectedContact._id,
      content: input.trim(),
      messageType: "text",
    });
    setInput("");
    inputRef.current?.focus();
  };

  const handleSelectContact = (contact) => {
    setSelectedContact(contact);
    setMessages([]);
    setShowSearch(false);
  };

  const handleDeleteDM = async (contact) => {
    if (!window.confirm(`Delete conversation with ${contact.firstName || contact.email}?`)) return;
    try {
      await apiClient.delete(`/api/contacts/delete-dm/${contact._id}`);
      if (selectedContact?._id === contact._id) {
        setSelectedContact(null);
        setMessages([]);
      }
      loadContacts();
    } catch {}
  };

  const selectedName = selectedContact
    ? `${selectedContact.firstName || ""} ${selectedContact.lastName || ""}`.trim() || selectedContact.email
    : "";

  return (
    <div className={styles.layout}>
      {/* Sidebar */}
      <aside className={styles.sidebar}>
        <div className={styles.sidebarHeader}>
          <div className={styles.brand}>
            <span className={styles.brandIcon}>⬡</span>
            <span className={styles.brandName}>PULSE</span>
          </div>
          <button className={styles.newMsgBtn} onClick={() => setShowSearch(true)} title="New conversation">
            ✎
          </button>
        </div>

        <div className={styles.sidebarMeta}>
          <Avatar user={user} size={32} />
          <span className={styles.myName}>
            {user?.firstName ? `${user.firstName} ${user.lastName || ""}`.trim() : user?.email}
          </span>
          <button className={styles.logoutBtn} onClick={logout} title="Logout">⏻</button>
        </div>

        <div className={styles.sectionLabel}>MESSAGES</div>

        <div className={styles.contactList}>
          {contacts.length === 0 && (
            <div className={styles.emptyContacts}>
              <span>No conversations yet</span>
              <button className={styles.startBtn} onClick={() => setShowSearch(true)}>Start one →</button>
            </div>
          )}
          {contacts.map((c) => (
            <ContactItem
              key={c._id}
              contact={c}
              active={selectedContact?._id === c._id}
              onClick={() => handleSelectContact(c)}
              onDelete={handleDeleteDM}
            />
          ))}
        </div>
      </aside>

      {/* Main */}
      <main className={styles.main}>
        {!selectedContact ? (
          <div className={styles.emptyState}>
            <div className={styles.emptyIcon}>⬡</div>
            <h2>Welcome to Pulse</h2>
            <p>Select a conversation or start a new one</p>
            <button className={styles.bigNewBtn} onClick={() => setShowSearch(true)}>
              New Message
            </button>
          </div>
        ) : (
          <>
            {/* Chat header */}
            <div className={styles.chatHeader}>
              <Avatar user={selectedContact} size={36} />
              <div className={styles.chatHeaderInfo}>
                <span className={styles.chatHeaderName}>{selectedName}</span>
                <span className={styles.chatHeaderEmail}>{selectedContact.email || ""}</span>
              </div>
              <button
                className={styles.deleteConvBtn}
                onClick={() => handleDeleteDM(selectedContact)}
                title="Delete conversation"
              >
                Delete
              </button>
            </div>

            {/* Messages */}
            <div className={styles.messages}>
              {messages.length === 0 && (
                <div className={styles.noMessages}>
                  <span>Say hello to {selectedContact.firstName || "them"} 👋</span>
                </div>
              )}
              {messages.map((msg, i) => {
                const senderId = msg.sender?._id || msg.sender;
                const isMine = senderId?.toString() === user?.id?.toString();
                return <MessageBubble key={msg._id || i} msg={msg} isMine={isMine} />;
              })}
              <div ref={messagesEndRef} />
            </div>

            {/* Input */}
            <form onSubmit={sendMessage} className={styles.inputArea}>
              <input
                ref={inputRef}
                className={styles.messageInput}
                value={input}
                onChange={(e) => setInput(e.target.value)}
                placeholder={`Message ${selectedContact.firstName || ""}...`}
                autoComplete="off"
              />
              <button type="submit" className={styles.sendBtn} disabled={!input.trim()}>
                Send ↑
              </button>
            </form>
          </>
        )}
      </main>

      {/* Search modal */}
      {showSearch && <SearchModal onSelect={handleSelectContact} onClose={() => setShowSearch(false)} />}
    </div>
  );
}
