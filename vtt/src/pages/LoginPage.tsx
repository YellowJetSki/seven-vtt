import { useState } from "react";
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

  if (authState === "authenticated" && role === "dm") {
    navigate("/campaign/dashboard", { replace: true });
  }

  return (
    <div className="min-h-screen bg-surface-950 flex items-center justify-center p-4 relative overflow-hidden">
      <div className="absolute inset-0 overflow-hidden pointer-events-none">
        <div className="absolute top-1/4 left-1/4 w-96 h-96 bg-accent-500/10 rounded-full blur-3xl animate-pulse-glow" />
        <div className="absolute bottom-1/4 right-1/4 w-80 h-80 bg-mage-500/10 rounded-full blur-3xl animate-pulse-glow" style={{ animationDelay: "1.5s" }} />
      </div>

      <div className="relative w-full max-w-md animate-scale-in">
        <div className="glass rounded-2xl p-8 border border-surface-700/30 shadow-2xl">
          <div className="text-center mb-8">
            <div className="text-5xl mb-4">ᚱ</div>
            <h1 className="text-2xl font-bold text-white">STᚱ VTT</h1>
            <p className="text-surface-400 text-sm mt-1">The Obelisks of Arkla</p>
          </div>

          {step === "role" && <RoleSelection onSelect={setStep} />}
          {step === "dm" && <DmLoginForm onBack={() => setStep("role")} />}
          {step === "player" && <PlayerPlaceholder onBack={() => setStep("role")} />}
        </div>

        <p className="text-center mt-6 text-surface-500 text-xs">
          STᚱ VTT — Premium Virtual Tabletop for the Arkla Campaign
        </p>
      </div>
    </div>
  );
}
