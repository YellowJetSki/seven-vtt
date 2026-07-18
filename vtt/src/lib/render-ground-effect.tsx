/* ── Ground Effect SVG Renderers ────────────────────────────────
 * Individual shape renderers for each GroundEffect type.
 * Extracted from GroundEffectOverlay to keep files under 150 lines.
 * ─────────────────────────────────────────────────────────────── */

import type { GroundEffect } from "@/types/hazard-zones";

/** Opacity modifier accounting for fade progress */
export function effectOpacity(effect: GroundEffect): number {
  const base = effect.difficultTerrain ? 0.35 : 0.2;
  const fade = 1 - effect.fadeProgress;
  return Math.max(0.05, base * fade);
}

/** Render scorch marks (fire) */
function renderScorch(effect: GroundEffect, op: number) {
  const cells = Math.round(effect.radius / 5);
  return (
    <g key={effect.id}>
      <circle cx={0} cy={0} r={cells} fill="#1a0a00" opacity={op * 0.6} rx={0.1} />
      <circle cx={0} cy={0} r={cells * 0.7} fill="none" stroke="#442200" strokeWidth={0.03} opacity={op * 0.4} strokeDasharray="0.05 0.08" />
      {[-1, -0.7, -0.4, 0.4, 0.7, 1].map((offset, i) => (
        <line key={i} x1={offset * cells * 0.3} y1={-cells * 0.2} x2={offset * cells * 0.5} y2={cells * 0.4}
          stroke="#331100" strokeWidth={0.01} opacity={op * 0.3} />
      ))}
    </g>
  );
}

/** Render ice patch (cold) */
function renderIcePatch(effect: GroundEffect, op: number) {
  const cells = Math.round(effect.radius / 5);
  return (
    <g key={effect.id}>
      <circle cx={0} cy={0} r={cells} fill="#88ddff" opacity={op * 0.15} />
      <circle cx={0} cy={0} r={cells * 0.85} fill="none" stroke="#aaeeff" strokeWidth={0.02} opacity={op * 0.3} />
      {[-0.5, 0, 0.5].map((xOff, i) => (
        <line key={i} x1={xOff * cells * 0.5} y1={-cells * 0.3} x2={xOff * cells * 0.4} y2={cells * 0.3}
          stroke="#ccffff" strokeWidth={0.008} opacity={op * 0.25} />
      ))}
    </g>
  );
}

/** Render gas cloud (poison) */
function renderGasCloud(effect: GroundEffect, op: number) {
  const cells = Math.round(effect.radius / 5);
  return (
    <g key={effect.id}>
      <circle cx={0} cy={0} r={cells} fill="#44cc44" opacity={op * 0.12} />
      <circle cx={0} cy={0} r={cells * 0.5} fill="#66ee66" opacity={op * 0.08} />
      {[-0.4, -0.1, 0.3, 0.6].map((xOff, i) => (
        <circle key={i} cx={xOff * cells * 0.6} cy={(i % 2 === 0 ? 0.2 : -0.2) * cells} r={0.08 * cells}
          fill="#88ff88" opacity={op * 0.12} className="gas-drift" />
      ))}
    </g>
  );
}

/** Render static field (lightning) */
function renderStaticField(effect: GroundEffect, op: number) {
  const cells = Math.round(effect.radius / 5);
  return (
    <g key={effect.id}>
      <circle cx={0} cy={0} r={cells} fill="#ffdd00" opacity={op * 0.08} />
      {[0, 60, 120, 180, 240, 300].map((deg, i) => {
        const rad = (deg * Math.PI) / 180;
        const x1 = Math.cos(rad) * cells * 0.3;
        const y1 = Math.sin(rad) * cells * 0.3;
        const x2 = Math.cos(rad) * cells * 0.9;
        const y2 = Math.sin(rad) * cells * 0.9;
        const midX = (x1 + x2) / 2 + (i % 2 === 0 ? 0.2 : -0.2) * cells * 0.2;
        const midY = (y1 + y2) / 2 + (i % 2 === 0 ? -0.15 : 0.15) * cells * 0.2;
        return (
          <path key={i} d={`M ${x1} ${y1} Q ${midX} ${midY} ${x2} ${y2}`}
            fill="none" stroke="#ffee44" strokeWidth={0.02} opacity={op * 0.35}
            strokeDasharray="0.04 0.03" />
        );
      })}
    </g>
  );
}

/** Render radiant pool (radiant) */
function renderRadiantPool(effect: GroundEffect, op: number) {
  const cells = Math.round(effect.radius / 5);
  return (
    <g key={effect.id}>
      <circle cx={0} cy={0} r={cells} fill="#ffeecc" opacity={op * 0.1} />
      <circle cx={0} cy={0} r={cells * 0.8} fill="none" stroke="#ffdd88" strokeWidth={0.03} opacity={op * 0.35} />
      <circle cx={0} cy={0} r={cells * 0.5} fill="white" opacity={op * 0.06} />
    </g>
  );
}

/** Render shadow pool (necrotic) */
function renderShadowPool(effect: GroundEffect, op: number) {
  const cells = Math.round(effect.radius / 5);
  return (
    <g key={effect.id}>
      <circle cx={0} cy={0} r={cells} fill="#220033" opacity={op * 0.5} />
      {[0, 45, 90, 135].map((deg, i) => {
        const rad = (deg * Math.PI) / 180;
        const x1 = Math.cos(rad) * cells * 0.4;
        const y1 = Math.sin(rad) * cells * 0.4;
        const x2 = Math.cos(rad) * cells;
        const y2 = Math.sin(rad) * cells;
        return (
          <line key={i} x1={x1} y1={y1} x2={x2} y2={y2}
            stroke="#6633aa" strokeWidth={0.015} opacity={op * 0.25} />
        );
      })}
    </g>
  );
}

/** Render magnetic field (force/thunder) */
function renderMagneticField(effect: GroundEffect, op: number) {
  const cells = Math.round(effect.radius / 5);
  return (
    <g key={effect.id}>
      <circle cx={0} cy={0} r={cells} fill="#aa88ff" opacity={op * 0.08} />
      {[0.4, 0.7, 1].map((scale, i) => (
        <circle key={i} cx={0} cy={0} r={cells * scale}
          fill="none" stroke="#ccbbff" strokeWidth={0.015} opacity={op * (0.4 - i * 0.1)}
          strokeDasharray={`${0.04 + i * 0.02} ${0.03}`} />
      ))}
    </g>
  );
}

/** Render arcane residue (raw magic) */
function renderArcaneResidue(effect: GroundEffect, op: number) {
  const cells = Math.round(effect.radius / 5);
  return (
    <g key={effect.id}>
      <circle cx={0} cy={0} r={cells} fill="#aabbff" opacity={op * 0.06} />
      {[-0.3, 0, 0.3].map((xOff, i) => (
        <circle key={i} cx={xOff * cells * 0.5} cy={(i - 1) * cells * 0.25}
          r={0.04 * cells} fill="#ddddff" opacity={op * (0.15 + i * 0.05)} />
      ))}
    </g>
  );
}

/** Dispatch renderer by effect type */
export function renderGroundEffectShape(effect: GroundEffect): JSX.Element | null {
  const op = effectOpacity(effect);
  switch (effect.type) {
    case "scorch": return renderScorch(effect, op);
    case "ice_patch": return renderIcePatch(effect, op);
    case "gas_cloud": return renderGasCloud(effect, op);
    case "static_field": return renderStaticField(effect, op);
    case "radiant_pool": return renderRadiantPool(effect, op);
    case "shadow_pool": return renderShadowPool(effect, op);
    case "magnetic_field": return renderMagneticField(effect, op);
    case "arcane_residue": return renderArcaneResidue(effect, op);
    default: return null;
  }
}
