/**
 * STᚱ VTT — Login Page (Premium Gold)
 *
 * Atmospheric login page with gold-accented glassmorphism card,
 * ambient glow orbs, and the ᚱ rune emblem.
 */

import { useState, useEffect } from "react";
import { useNavigate } from "react-router-dom";
import { useAuthStore } from "@/stores/authStore";
import RoleSelection from "@/components/auth/RoleSelection";
import DmLoginForm from "@/components/auth/DmLoginForm";
import PlayerPlaceholder from "@/components/auth/PlayerPlaceholder";

type LoginStep = "role" | "dm" | "player";

export default function LoginPage() {
  const navigate = useNavigate();
  const authState = useAuthStore((s) => s.state);
  const role = useAuthStore((s) => s.role);
  const [step, setStep] = useState<LoginStep>("role");

  useEffect(() => {
    if (authState === "authenticated" && role === "dm") {
      navigate("/campaign/dashboard", { replace: true });
    }
  }, [authState, role, navigate]);

  return (
    <div className="h-screen w-screen overflow-hidden bg-obsidian-radial flex items-center justify-center p-4 relative">
      {/* Atmospheric haze layers */}
      <div className="atmo-haze-top" />
      <div className="atmo-haze-bottom" />

      {/* Depth ring */}
      <div className="depth-ring absolute inset-0" />

      {/* Ambient fantasy glow orbs — gold/amber tinted */}
      <div className="absolute inset-0 overflow-hidden pointer-events-none">
        <div className="absolute top-1/4 -left-24 w-[600px] h-[600px] bg-gold-500/8 rounded-full blur-[140px] animate-pulse-glow" style={{ animationDuration: "5s" }} />
        <div className="absolute bottom-1/4 -right-24 w-[500px] h-[500px] bg-amber-400/6 rounded-full blur-[120px] animate-pulse-glow" style={{ animationDelay: "2.5s", animationDuration: "6s" }} />
        <div className="absolute top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2 w-[700px] h-[700px] bg-amber-500/4 rounded-full blur-[160px] animate-pulse-glow" style={{ animationDelay: "1.25s", animationDuration: "7s" }} />
        <div className="absolute top-3/4 left-1/4 w-[400px] h-[400px] bg-gold-600/4 rounded-full blur-[100px] animate-pulse-glow" style={{ animationDelay: "3s", animationDuration: "8s" }} />
        {/* Particle sparkle overlay */}
        <div className="absolute inset-0 bg-particle opacity-60" />
      </div>

      <div className="relative w-full max-w-md animate-scale-in">
        <div className="glass-gold rounded-2xl p-8 border border-gold/15 shadow-obsidian-xl relative overflow-hidden">
          {/* Decorative gold corner runes */}
          <div className="corner-ornament corner-tl corner-gold corner-gold-glow" />
          <div className="corner-ornament corner-tr corner-gold corner-gold-glow" />
          <div className="corner-ornament corner-bl corner-gold corner-gold-glow" />
          <div className="corner-ornament corner-br corner-gold corner-gold-glow" />

          {/* Header */}
          <div className="text-center mb-8">
            <div className="text-5xl mb-4 float-arcane select-none text-gold-400 drop-shadow-[0_0_12px_rgba(234,179,8,0.2)]" aria-hidden="true">ᚱ</div>
            <h1 className="text-3xl font-black text-gold tracking-tight drop-shadow-[0_0_12px_rgba(234,179,8,0.15)]">
              STᚱ VTT
            </h1>
            <div className="rune-gold my-3 justify-center">✦ ✦ ✦</div>
            <p className="text-surface-500 text-sm">The Obelisks of Arkla</p>
          </div>

          {step === "role" && <RoleSelection onSelect={setStep} />}
          {step === "dm" && <DmLoginForm onBack={() => setStep("role")} />}
          {step === "player" && <PlayerPlaceholder onBack={() => setStep("role")} />}
        </div>

        <p className="text-center mt-6 text-surface-600 text-xs tracking-wider uppercase">
          Premium Virtual Tabletop — Arkla Campaign
        </p>
      </div>
    </div>
  );
}
