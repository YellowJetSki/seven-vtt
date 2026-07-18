import { useState } from "react";
import { useNavigate } from "react-router-dom";
import { useAuthStore } from "@/stores/authStore";
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

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    setError("");

    if (!username.trim() || !password.trim()) {
      setError("Please enter both username and password");
      return;
    }

    const success = login(username, password);
    if (success) {
      navigate("/campaign/dashboard", { replace: true });
    } else {
      setError("Invalid credentials. Try MikeJello / Jello1");
    }
  };

  return (
    <form onSubmit={handleSubmit} className="space-y-4">
      <button
        type="button"
        onClick={onBack}
        className="text-sm text-surface-400 hover:text-surface-200 transition-colors flex items-center gap-1"
      >
        <svg className="w-4 h-4" fill="none" viewBox="0 0 24 24" stroke="currentColor">
          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15 19l-7-7 7-7" />
        </svg>
        Back
      </button>

      <div>
        <label className="block text-sm font-medium text-surface-300 mb-1">Username</label>
        <input
          type="text"
          value={username}
          onChange={(e) => setUsername(e.target.value)}
          placeholder="Enter DM username"
          className="w-full px-4 py-2.5 rounded-lg bg-surface-800 border border-surface-600/50 text-white placeholder-surface-500 focus:outline-none focus:border-accent-500/50 focus:ring-1 focus:ring-accent-500/30 transition-colors"
        />
      </div>

      <div>
        <label className="block text-sm font-medium text-surface-300 mb-1">Password</label>
        <input
          type="password"
          value={password}
          onChange={(e) => setPassword(e.target.value)}
          placeholder="Enter password"
          className="w-full px-4 py-2.5 rounded-lg bg-surface-800 border border-surface-600/50 text-white placeholder-surface-500 focus:outline-none focus:border-accent-500/50 focus:ring-1 focus:ring-accent-500/30 transition-colors"
        />
      </div>

      {error && (
        <p className="text-warrior-400 text-sm bg-warrior-500/10 border border-warrior-500/20 rounded-lg px-3 py-2">
          {error}
        </p>
      )}

      <Button type="submit" variant="primary" className="w-full">
        Sign In
      </Button>
    </form>
  );
}
