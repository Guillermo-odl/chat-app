import React from "react";
import { BrowserRouter, Routes, Route, Navigate } from "react-router-dom";
import { AuthProvider, useAuth } from "./context/AuthContext";
import { SocketProvider } from "./context/SocketContext";
import AuthPage from "./pages/AuthPage";
import ProfilePage from "./pages/ProfilePage";
import ChatPage from "./pages/ChatPage";

const PrivateRoute = ({ children }) => {
  const { user, loading } = useAuth();
  if (loading) return <LoadingScreen />;
  return user ? children : <Navigate to="/auth" replace />;
};

const ProfileRoute = ({ children }) => {
  const { user, loading } = useAuth();
  if (loading) return <LoadingScreen />;
  if (!user) return <Navigate to="/auth" replace />;
  if (user.profileSetup) return <Navigate to="/chat" replace />;
  return children;
};

const LoadingScreen = () => (
  <div style={{
    height: "100vh", display: "flex", alignItems: "center", justifyContent: "center",
    background: "var(--bg-primary)", flexDirection: "column", gap: "16px"
  }}>
    <div style={{
      width: 40, height: 40, borderRadius: "50%",
      border: "3px solid var(--accent-dim)", borderTopColor: "var(--accent)",
      animation: "spin 0.8s linear infinite"
    }} />
    <style>{`@keyframes spin { to { transform: rotate(360deg); } }`}</style>
  </div>
);

const AppRoutes = () => {
  const { user, loading } = useAuth();
  if (loading) return <LoadingScreen />;

  return (
    <Routes>
      <Route
        path="/auth"
        element={user ? <Navigate to={user.profileSetup ? "/chat" : "/profile"} replace /> : <AuthPage />}
      />
      <Route path="/profile" element={<ProfileRoute><ProfilePage /></ProfileRoute>} />
      <Route
        path="/chat"
        element={
          <PrivateRoute>
            <SocketProvider>
              <ChatPage />
            </SocketProvider>
          </PrivateRoute>
        }
      />
      <Route path="*" element={<Navigate to={user ? (user.profileSetup ? "/chat" : "/profile") : "/auth"} replace />} />
    </Routes>
  );
};

export default function App() {
  return (
    <BrowserRouter>
      <AuthProvider>
        <AppRoutes />
      </AuthProvider>
    </BrowserRouter>
  );
}
