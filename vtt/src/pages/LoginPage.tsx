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
    <div className="min-h-screen bg-surface-950 flex items-center justify-center p-4 relative overflow-hidden">
      {/* Ambient fantasy glow orbs */}
      <div className="absolute inset-0 overflow-hidden pointer-events-none">
        <div className="absolute top-1/4 -left-24 w-[500px] h-[500px] bg-accent-500/8 rounded-full blur-[120px] animate-pulse-glow" style={{ animationDuration: "5s" }} />
        <div className="absolute bottom-1/4 -right-24 w-[450px] h-[450px] bg-mage-500/8 rounded-full blur-[100px] animate-pulse-glow" style={{ animationDelay: "2.5s", animationDuration: "6s" }} />
        <div className="absolute top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2 w-[600px] h-[600px] bg-divine-500/4 rounded-full blur-[140px] animate-pulse-glow" style={{ animationDelay: "1.25s", animationDuration: "7s" }} />

        {/* Particle sparkle overlay */}
        <div className="absolute inset-0 bg-particle opacity-50" />
      </div>

      <div className="relative w-full max-w-md animate-scale-in">
        <div className="glass-arcane rounded-2xl p-8 border border-accent-500/10 shadow-2xl shadow-accent-500/5 relative overflow-hidden">
          {/* Decorative corner runes */}
          <div className="corner-ornament corner-tl" />
          <div className="corner-ornament corner-tr" />
          <div className="corner-ornament corner-bl" />
          <div className="corner-ornament corner-br" />

          {/* Header */}
          <div className="text-center mb-8">
            <div className="text-5xl mb-4 float-arcane select-none" aria-hidden="true">ᚱ</div>
            <h1 className="text-3xl font-black text-gradient-arcane tracking-tight">STᚱ VTT</h1>
            <div className="rune-divider my-3">✦ ✦ ✦</div>
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
