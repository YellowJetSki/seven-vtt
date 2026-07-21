/**
 * STᚱ VTT — Login Page (Premium Overrrides/Lusion-Grade Orchestrator)
 *
 * Full-screen immersive login. Orchestrates 6 sub-components:
 *   - LoginAuroraBackground (ambient depth layer)
 *   - LoginAmbientRune (giant ᚱ atmospheric element)
 *   - LoginBrandHero (desktop brand panel)
 *   - LoginMobileBrand (mobile brand header)
 *   - LoginForm (glass card with credentials)
 *
 * Credentials: MikeJello / Jello1
 */

import { useEffect } from "react";
import { useNavigate } from "react-router-dom";
import { useAuthStore } from "@/stores/authStore";
import { loginFirebaseDm, hasValidConfig } from "@/lib/firebase";

import LoginAuroraBackground from "@/components/auth/LoginAuroraBackground";
import LoginAmbientRune from "@/components/auth/LoginAmbientRune";
import LoginBrandHero from "@/components/auth/LoginBrandHero";
import LoginMobileBrand from "@/components/auth/LoginMobileBrand";
import LoginForm from "@/components/auth/LoginForm";

export default function LoginPage() {
  const navigate = useNavigate();
  const authState = useAuthStore((s) => s.state);
  const role = useAuthStore((s) => s.role);
  const login = useAuthStore((s) => s.login);
  const firebaseConnected = useAuthStore((s) => s.firebaseConnected);
  const syncExhausted = useAuthStore((s) => s.syncExhausted);
  const setFirebaseAuthLoading = useAuthStore((s) => s.setFirebaseAuthLoading);
  const setFirebaseAuthError = useAuthStore((s) => s.setFirebaseAuthError);
  const firebaseConfigOk = hasValidConfig();

  useEffect(() => {
    if (authState === "authenticated" && role === "dm") {
      navigate("/campaign/dashboard", { replace: true });
    }
  }, [authState, role, navigate]);

  const handleLogin = async (username: string, password: string) => {
    setFirebaseAuthLoading(true);

    // Step 1: Verify credentials via local store (instant feedback)
    const success = login(username, password);
    if (!success) {
      setFirebaseAuthLoading(false);
      throw new Error("Invalid credentials. Please try again.");
    }

    // Step 2: Authenticate with Firebase Auth for persistent session
    if (firebaseConfigOk) {
      try {
        await loginFirebaseDm(`${username}@arkla.vtt`, password);
        setFirebaseAuthError(null);
      } catch (fbErr) {
        console.warn("[Login] Firebase Auth failed (local login preserved):", fbErr);
        setFirebaseAuthError("Campaign sync may not persist across page refresh.");
      }
    }

    setFirebaseAuthLoading(false);
    navigate("/campaign/dashboard", { replace: true });
  };

  return (
    <div className="overflow-hidden flex relative bg-[#07080d] select-none"
      style={{ height: '100dvh', width: '100dvw' }}>
      {/* Layer 1: Deep Background */}
      <LoginAuroraBackground />

      {/* Layer 2: Ambient Rune Glow */}
      <LoginAmbientRune />

      {/* Layer 3: Content */}
      <div className="relative z-10 flex w-full h-full">
        {/* Left Panel: Brand Hero (desktop only) */}
        <LoginBrandHero />

        {/* Right Panel: Login Form */}
        <div className="w-full lg:w-1/2 flex items-center justify-center p-4 sm:p-8 lg:p-12 xl:p-16">
          <div className="w-full">
            {/* Mobile brand */}
            <LoginMobileBrand />

            {/* Login card */}
            <LoginForm
              firebaseConnected={firebaseConnected}
              syncExhausted={syncExhausted}
              onLogin={handleLogin}
            />

            {/* Mobile footer */}
            <p className="text-center mt-8 text-surface-700 text-[9px] uppercase tracking-[0.2em] lg:hidden font-medium">
              Premium Virtual Tabletop &mdash; Arkla Campaign
            </p>
          </div>
        </div>
      </div>

      {/* Keyframe Injections */}
      <style>{`
        @keyframes aurora-drift {
          0% { transform: translate(0, 0) rotate(0deg) scale(1); }
          50% { transform: translate(2%, 1%) rotate(0.5deg) scale(1.02); }
          100% { transform: translate(-1%, -1%) rotate(-0.5deg) scale(0.98); }
        }
        @keyframes rune-breathe {
          0%, 100% { opacity: 0.04; transform: scale(1); }
          50% { opacity: 0.08; transform: scale(1.05); }
        }
        @keyframes slide-in-up {
          from { opacity: 0; transform: translateY(12px); }
          to { opacity: 1; transform: translateY(0); }
        }
        .gold-amber-gradient {
          background: linear-gradient(135deg, #fde047 0%, #f59e0b 50%, #d97706 100%);
        }
      `}</style>
    </div>
  );
}
