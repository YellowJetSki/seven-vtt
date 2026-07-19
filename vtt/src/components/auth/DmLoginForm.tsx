/**
 * STᚱ VTT — DM Login Form (Premium Gold)
 *
 * Gold-accented login form with premium inputs and error banner.
 */

import { useState } from "react";
import { useNavigate } from "react-router-dom";
import { useAuthStore } from "@/stores/authStore";
import { hasValidConfig, loginFirebaseDm as firebaseLogin } from "@/lib/firebase";
import Button from "@/components/ui/Button";

interface DmLoginFormProps {
  onBack: () => void;
}

export default function DmLoginForm({ onBack }: DmLoginFormProps) {
  const navigate = useNavigate();
  const login = useAuthStore((s) => s.login);
  const [username, setUsername] = useState("");
  const [password, setPassword] = useState("");
  const [error, setError] = useState("");
  const [isFirebaseAuth, setIsFirebaseAuth] = useState(false);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setError("");
    if (!username.trim() || !password.trim()) {
      setError("Please enter both username and password");
      return;
    }
    const success = login(username, password);
    if (!success) {
      setError("Invalid credentials.");
      return;
    }
    const fbEmail = import.meta.env.VITE_FIREBASE_AUTH_EMAIL;
    const fbPassword = import.meta.env.VITE_FIREBASE_AUTH_PASSWORD;
    if (hasValidConfig() && fbEmail && fbPassword) {
      setIsFirebaseAuth(true);
      try {
        await firebaseLogin(fbEmail, fbPassword);
      } catch (err: unknown) {
        const message = err instanceof Error ? err.message : "unknown error";
        console.warn("[Firebase] DM Auth sync failed (app continues in offline mode):", message);
      }
      setIsFirebaseAuth(false);
    }
    navigate("/campaign/dashboard", { replace: true });
  };

  return (
    <form onSubmit={handleSubmit} className="space-y-5">
      <button
        type="button"
        onClick={onBack}
        className="text-sm text-surface-500 hover:text-gold-400 transition-all duration-200 flex items-center gap-1.5 group"
      >
        <svg className="w-4 h-4 group-hover:-translate-x-0.5 transition-transform" fill="none" viewBox="0 0 24 24" stroke="currentColor">
          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15 19l-7-7 7-7" />
        </svg>
        <span className="tracking-wide">Return</span>
      </button>

      <div className="space-y-1.5">
        <label className="block text-xs font-semibold uppercase tracking-wider text-gold-400/70">Username</label>
        <input
          type="text"
          value={username}
          onChange={(e) => setUsername(e.target.value)}
          placeholder="Enter DM username"
          className="input-gold"
        />
      </div>

      <div className="space-y-1.5">
        <label className="block text-xs font-semibold uppercase tracking-wider text-gold-400/70">Password</label>
        <input
          type="password"
          value={password}
          onChange={(e) => setPassword(e.target.value)}
          placeholder="Enter password"
          className="input-gold"
        />
      </div>

      {error && (
        <div className="flex items-center gap-2 text-amber-400 text-sm bg-amber-500/10 border border-amber-500/15 rounded-xl px-4 py-3">
          <span>⚠</span>
          <span>{error}</span>
        </div>
      )}

      <Button type="submit" variant="gold" size="lg" className="w-full" isLoading={isFirebaseAuth}>
        ✦ Sign In as Dungeon Master
      </Button>
    </form>
  );
}
