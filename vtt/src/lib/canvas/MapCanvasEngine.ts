/* ── MapCanvasEngine ─────────────────────────────────────────────
 * Pure HTML5 Canvas renderer for the VTT battle map.
 * Renders: background map image, grid lines, fog of war,
 * movement range hexagons, tokens (circular + image), status
 * markers, and AOE templates — all on a single <canvas> element.
 *
 * This replaces the old DOM/SVG-based MapCanvas for SIGNIFICANTLY
 * better performance during drag, pan, and repaint loops.
 * ─────────────────────────────────────────────────────────────── */

import type { BattleMap, MapToken, MapDrawingStroke, FogZone } from "@/types";
import type { AoETemplate, AoE_Direction } from "@/types/aoe-templates";
import { getAoEShapePath } from "@/types/aoe-shapes";

export interface CanvasRenderOptions {
  gmView: boolean;
  showFog: boolean;
  showGrid: boolean;
  gridOpacity: number;
  selectedTokenId: string | null;
  hoveredCell: { x: number; y: number } | null;
  panOffset: { x: number; y: number };
  zoomLevel: number;
}

const GRID_LINE_COLOR = "rgba(255, 255, 255, 0.12)";
const GRID_LINE_ACCENT = "rgba(139, 48, 255, 0.06)";
const FOG_COLOR = "rgba(0, 0, 0, 0.75)";
const TOKEN_RADIUS_RATIO = 0.4;
const SELECTION_RING_COLOR = "#a35aff";
const MOVEMENT_COLOR = "rgba(57, 255, 144, 0.12)";
const MOVEMENT_BORDER = "rgba(57, 255, 144, 0.3)";
const DASH_COLOR = "rgba(255, 200, 57, 0.08)";
const DASH_BORDER = "rgba(255, 200, 57, 0.2)";
const HP_BAR_HEIGHT = 3;

export class MapCanvasEngine {
  private canvas: HTMLCanvasElement;
  private ctx: CanvasRenderingContext2D;
  private map: BattleMap | null = null;
  private options: CanvasRenderOptions;
  private animFrameId: number | null = null;
  private tokens: MapToken[] = [];
  private aoeTemplates: AoETemplate[] = [];
  private drawings: MapDrawingStroke[] = [];
  private fogZones: FogZone[] = [];
  private backgroundImage: HTMLImageElement | null = null;
  private imageCache: Map<string, HTMLImageElement> = new Map();

  /* ── Pixel Dimensions (computed each frame) ───────────── */
  private canvasW = 0;
  private canvasH = 0;
  private cellW = 0;
  private cellH = 0;

  constructor(canvas: HTMLCanvasElement) {
    this.canvas = canvas;
    this.ctx = canvas.getContext("2d", { alpha: true })!;
    this.ctx.imageSmoothingEnabled = true;
    this.ctx.imageSmoothingQuality = "high";
    this.options = {
      gmView: true,
      showFog: true,
      showGrid: true,
      gridOpacity: 0.08,
      selectedTokenId: null,
      hoveredCell: null,
      panOffset: { x: 0, y: 0 },
      zoomLevel: 1,
    };
  }

  /* ── Public API ────────────────────────────────────────── */

  setMap(map: BattleMap) {
    this.map = map;
    this.fogZones = map.fogOfWar ?? [];
    this.drawings = map.drawings ?? [];

    if (map.imageUrl && map.imageUrl !== this.backgroundImage?.src) {
      const img = new Image();
      img.crossOrigin = "anonymous";
      img.onload = () => { this.backgroundImage = img; this.render(); };
      img.onerror = () => { this.backgroundImage = null; this.render(); };
      img.src = map.imageUrl;
    } else if (!map.imageUrl) {
      this.backgroundImage = null;
    }
    this.render();
  }

  setTokens(tokens: MapToken[]) {
    this.tokens = tokens;
    // Preload token images
    for (const t of tokens) {
      if (t.imageUrl && !this.imageCache.has(t.imageUrl)) {
        const img = new Image();
        img.crossOrigin = "anonymous";
        img.src = t.imageUrl;
        this.imageCache.set(t.imageUrl, img);
      }
    }
    this.render();
  }

  setAoETemplates(templates: AoETemplate[]) {
    this.aoeTemplates = templates;
    this.render();
  }

  setDrawings(drawings: MapDrawingStroke[]) {
    this.drawings = drawings;
    this.render();
  }

  setFogZones(zones: FogZone[]) {
    this.fogZones = zones;
    this.render();
  }

  setOptions(opts: Partial<CanvasRenderOptions>) {
    Object.assign(this.options, opts);
    this.render();
  }

  updateSize(width: number, height: number) {
    const dpr = window.devicePixelRatio || 1;
    this.canvas.width = width * dpr;
    this.canvas.height = height * dpr;
    this.canvas.style.width = `${width}px`;
    this.canvas.style.height = `${height}px`;
    this.ctx.setTransform(dpr, 0, 0, dpr, 0, 0);
    this.canvasW = width;
    this.canvasH = height;
    this.render();
  }

  getGridCoords(clientX: number, clientY: number): { gridX: number; gridY: number } | null {
    if (!this.map) return null;
    const rect = this.canvas.getBoundingClientRect();
    const x = (clientX - rect.left - this.options.panOffset.x) / this.options.zoomLevel;
    const y = (clientY - rect.top - this.options.panOffset.y) / this.options.zoomLevel;
    const gridX = Math.floor((x / this.canvasW) * this.map.gridWidth);
    const gridY = Math.floor((y / this.canvasH) * this.map.gridHeight);
    if (gridX < 0 || gridX >= this.map.gridWidth || gridY < 0 || gridY >= this.map.gridHeight) return null;
    return { gridX, gridY };
  }

  getTokenAt(clientX: number, clientY: number): MapToken | null {
    if (!this.map) return null;
    const rect = this.canvas.getBoundingClientRect();
    const x = (clientX - rect.left - this.options.panOffset.x) / this.options.zoomLevel;
    const y = (clientY - rect.top - this.options.panOffset.y) / this.options.zoomLevel;

    const viewX = (x / this.canvasW) * this.map.gridWidth;
    const viewY = (y / this.canvasH) * this.map.gridHeight;

    // Check each token (reverse for top-most)
    for (let i = this.tokens.length - 1; i >= 0; i--) {
      const t = this.tokens[i];
      const r = (t.size * 0.4) + 0.3;
      if (Math.abs(viewX - t.x - t.size / 2) < r && Math.abs(viewY - t.y - t.size / 2) < r) {
        return t;
      }
    }
    return null;
  }

  /* ── Main Render ────────────────────────────────────────── */

  render() {
    if (!this.map || this.canvasW === 0) return;
    const ctx = this.ctx;
    const { zoomLevel, panOffset } = this.options;

    ctx.save();
    ctx.clearRect(0, 0, this.canvasW, this.canvasH);
    ctx.translate(panOffset.x, panOffset.y);
    ctx.scale(zoomLevel, zoomLevel);

    this.cellW = this.canvasW / this.map.gridWidth;
    this.cellH = this.canvasH / this.map.gridHeight;

    this.drawBackground(ctx);
    if (this.options.showGrid) this.drawGrid(ctx);
    this.drawDrawings(ctx);
    this.drawMovementRange(ctx);
    this.drawAoeTemplates(ctx);
    this.drawTokens(ctx);
    if (this.options.showFog && !this.options.gmView) this.drawFogOfWar(ctx);
    this.drawSelectedTokenOverlay(ctx);

    ctx.restore();

    this.animFrameId = null;
  }

  /* ── Private Render Helpers ─────────────────────────────── */

  private drawBackground(ctx: CanvasRenderingContext2D) {
    if (this.backgroundImage) {
      ctx.drawImage(this.backgroundImage, 0, 0, this.canvasW, this.canvasH);
    } else {
      ctx.fillStyle = "#1e1f2b";
      ctx.fillRect(0, 0, this.canvasW, this.canvasH);
      // Subtle grid texture
      ctx.fillStyle = "rgba(255,255,255,0.02)";
      for (let x = 0; x < this.canvasW; x += 40) {
        for (let y = 0; y < this.canvasH; y += 40) {
          ctx.beginPath();
          ctx.arc(x, y, 1, 0, Math.PI * 2);
          ctx.fill();
        }
      }
    }
  }

  private drawGrid(ctx: CanvasRenderingContext2D) {
    const { gridWidth, gridHeight } = this.map!;
    const op = this.options.gridOpacity;

    // Major grid lines (every 5 cells)
    ctx.strokeStyle = `rgba(139, 48, 255, ${op * 0.5})`;
    ctx.lineWidth = 1.5;
    for (let i = 0; i <= gridWidth; i += 5) {
      ctx.beginPath();
      ctx.moveTo(i * this.cellW, 0);
      ctx.lineTo(i * this.cellW, gridHeight * this.cellH);
      ctx.stroke();
    }
    for (let i = 0; i <= gridHeight; i += 5) {
      ctx.beginPath();
      ctx.moveTo(0, i * this.cellH);
      ctx.lineTo(gridWidth * this.cellW, i * this.cellH);
      ctx.stroke();
    }

    // Minor grid lines
    ctx.strokeStyle = `rgba(255, 255, 255, ${op})`;
    ctx.lineWidth = 0.5;
    for (let i = 0; i <= gridWidth; i++) {
      ctx.beginPath();
      ctx.moveTo(i * this.cellW, 0);
      ctx.lineTo(i * this.cellW, gridHeight * this.cellH);
      ctx.stroke();
    }
    for (let i = 0; i <= gridHeight; i++) {
      ctx.beginPath();
      ctx.moveTo(0, i * this.cellH);
      ctx.lineTo(gridWidth * this.cellW, i * this.cellH);
      ctx.stroke();
    }

    // Grid coordinate labels (every 5 cells)
    ctx.fillStyle = `rgba(255, 255, 255, ${op * 3})`;
    ctx.font = "10px monospace";
    for (let i = 0; i < gridWidth; i += 5) {
      ctx.fillText(`${i}`, i * this.cellW + 2, this.cellH - 2);
    }
    for (let i = 0; i < gridHeight; i += 5) {
      ctx.fillText(`${i}`, 2, i * this.cellH + this.cellH - 2);
    }
  }

  private drawMovementRange(ctx: CanvasRenderingContext2D) {
    const selToken = this.tokens.find((t) => t.id === this.options.selectedTokenId);
    if (!selToken || !this.options.gmView) return;

    const speed = selToken.speed ?? 30;
    const normalCells = Math.floor(speed / 5);
    const dashCells = Math.floor(speed * 2 / 5);

    // Draw dash range (outer)
    this.fillRadius(ctx, selToken.x, selToken.y, dashCells, DASH_COLOR, DASH_BORDER);
    // Draw normal range (inner)
    this.fillRadius(ctx, selToken.x, selToken.y, normalCells, MOVEMENT_COLOR, MOVEMENT_BORDER);
  }

  private fillRadius(
    ctx: CanvasRenderingContext2D,
    gx: number, gy: number, cells: number,
    fillColor: string, strokeColor: string,
  ) {
    const cx = (gx + 0.5) * this.cellW;
    const cy = (gy + 0.5) * this.cellH;
    const radius = cells * this.cellW;

    ctx.beginPath();
    ctx.arc(cx, cy, radius, 0, Math.PI * 2);
    ctx.fillStyle = fillColor;
    ctx.fill();
    ctx.strokeStyle = strokeColor;
    ctx.lineWidth = 2;
    ctx.setLineDash([4, 4]);
    ctx.stroke();
    ctx.setLineDash([]);
  }

  private drawAoeTemplates(ctx: CanvasRenderingContext2D) {
    for (const tpl of this.aoeTemplates) {
      if (!tpl.visibleToPlayers && !this.options.gmView) continue;

      const pathData = getAoEShapePath(tpl.shape, tpl.direction, tpl.size / 5);
      const centerX = (tpl.gridX + 0.5) * this.cellW;
      const centerY = (tpl.gridY + 0.5) * this.cellH;

      ctx.save();
      ctx.translate(centerX, centerY);

      // Scale path to grid
      const scaleX = this.cellW / 5;
      const scaleY = this.cellH / 5;
      ctx.scale(scaleX, scaleY);

      // Parse and draw SVG path
      const path = new Path2D(pathData);
      ctx.fillStyle = tpl.color ?? "rgba(139, 48, 255, 0.15)";
      ctx.strokeStyle = tpl.color ?? "rgba(139, 48, 255, 0.5)";
      ctx.lineWidth = 0.3;
      ctx.fill(path);
      ctx.stroke(path);

      ctx.restore();

      // Label
      ctx.fillStyle = "rgba(255,255,255,0.8)";
      ctx.font = "10px sans-serif";
      ctx.textAlign = "center";
      ctx.fillText(tpl.label, centerX, centerY + 16);

      if (tpl.damageDice) {
        ctx.fillStyle = "rgba(255,255,255,0.5)";
        ctx.font = "8px sans-serif";
        ctx.fillText(`${tpl.damageDice}`, centerX, centerY + 28);
      }
    }
  }

  private drawTokens(ctx: CanvasRenderingContext2D) {
    for (const token of this.tokens) {
      if (!token.visible && !this.options.gmView) continue;

      const cx = (token.x + token.size / 2) * this.cellW;
      const cy = (token.y + token.size / 2) * this.cellH;
      const radius = (token.size * TOKEN_RADIUS_RATIO) * Math.min(this.cellW, this.cellH);

      // Token shadow
      ctx.beginPath();
      ctx.arc(cx + 2, cy + 2, radius, 0, Math.PI * 2);
      ctx.fillStyle = "rgba(0,0,0,0.3)";
      ctx.fill();

      // Token circle
      ctx.beginPath();
      ctx.arc(cx, cy, radius, 0, Math.PI * 2);
      ctx.fillStyle = token.imageUrl ? "transparent" : (token.color ?? "#6366f1");
      ctx.fill();

      // Token border
      ctx.strokeStyle = this.options.selectedTokenId === token.id ? SELECTION_RING_COLOR : "rgba(255,255,255,0.2)";
      ctx.lineWidth = this.options.selectedTokenId === token.id ? 2.5 : 1.5;
      ctx.stroke();

      // Token image
      if (token.imageUrl) {
        const img = this.imageCache.get(token.imageUrl);
        if (img && img.complete) {
          ctx.save();
          ctx.beginPath();
          ctx.arc(cx, cy, radius, 0, Math.PI * 2);
          ctx.clip();
          ctx.drawImage(img, cx - radius, cy - radius, radius * 2, radius * 2);
          ctx.restore();
        } else {
          ctx.fillStyle = token.color ?? "#6366f1";
          const letter = token.label?.charAt(0)?.toUpperCase() ?? "?";
          ctx.font = `bold ${radius * 0.7}px sans-serif`;
          ctx.textAlign = "center";
          ctx.textBaseline = "middle";
          ctx.fillStyle = "#fff";
          ctx.fillText(letter, cx, cy);
        }
      } else {
        // Show letter if no image
        const letter = token.label?.charAt(0)?.toUpperCase() ?? "?";
        ctx.font = `bold ${radius * 0.6}px sans-serif`;
        ctx.textAlign = "center";
        ctx.textBaseline = "middle";
        ctx.fillStyle = "#fff";
        ctx.fillText(letter, cx, cy);
      }

      // HP Bar
      if (token.hp && token.hp.max > 0) {
        const barW = radius * 1.6;
        const barH = HP_BAR_HEIGHT;
        const barX = cx - barW / 2;
        const barY = cy + radius + 4;
        const pct = Math.max(0, token.hp.current / token.hp.max);

        // Background
        ctx.fillStyle = "rgba(0,0,0,0.5)";
        ctx.roundRect?.(barX, barY, barW, barH, 2) ?? ctx.fillRect(barX, barY, barW, barH);

        // HP fill
        const hpColor = pct > 0.5 ? "#27ae60" : pct > 0.25 ? "#f39c12" : "#e74c3c";
        ctx.fillStyle = hpColor;
        ctx.roundRect?.(barX, barY, barW * pct, barH, 2) ?? ctx.fillRect(barX, barY, barW * pct, barH);
      }

      // Status markers (simplified — small colored dots)
      if (token.statusMarkers && token.statusMarkers.length > 0) {
        const dots = Math.min(token.statusMarkers.length, 3);
        for (let i = 0; i < dots; i++) {
          const dx = cx + radius - 4 - i * 6;
          const dy = cy - radius + 4;
          ctx.beginPath();
          ctx.arc(dx, dy, 3, 0, Math.PI * 2);
          ctx.fillStyle = "#f39c12";
          ctx.fill();
          ctx.strokeStyle = "rgba(0,0,0,0.5)";
          ctx.lineWidth = 0.5;
          ctx.stroke();
        }
      }

      // Token label
      ctx.fillStyle = "rgba(255,255,255,0.6)";
      ctx.font = "8px sans-serif";
      ctx.textAlign = "center";
      ctx.textBaseline = "top";
      ctx.fillText(token.label, cx, cy + radius + HP_BAR_HEIGHT + 6);
    }
  }

  private drawFogOfWar(ctx: CanvasRenderingContext2D) {
    // Dark overlay for unexplored areas
    ctx.fillStyle = FOG_COLOR;
    ctx.fillRect(0, 0, this.canvasW, this.canvasH);

    // Clear revealed zones (using destination-out compositing)
    ctx.globalCompositeOperation = "destination-out";

    // Clear revealed fog zones
    for (const zone of this.fogZones) {
      const x = zone.x * this.cellW;
      const y = zone.y * this.cellH;
      const w = zone.width * this.cellW;
      const h = zone.height * this.cellH;
      ctx.fillRect(x, y, w, h);
    }

    // Clear vision around player tokens
    for (const token of this.tokens) {
      if (token.type !== "player") continue;
      const cx = (token.x + token.size / 2) * this.cellW;
      const cy = (token.y + token.size / 2) * this.cellH;
      const visionRadius = 8 * this.cellW; // ~40ft vision
      const gradient = ctx.createRadialGradient(cx, cy, 0, cx, cy, visionRadius);
      gradient.addColorStop(0, "rgba(0,0,0,1)");
      gradient.addColorStop(1, "rgba(0,0,0,0)");
      ctx.fillStyle = gradient;
      ctx.beginPath();
      ctx.arc(cx, cy, visionRadius, 0, Math.PI * 2);
      ctx.fill();
    }

    ctx.globalCompositeOperation = "source-over";
  }

  private drawDrawings(ctx: CanvasRenderingContext2D) {
    for (const stroke of this.drawings) {
      if (stroke.points.length < 2) continue;
      ctx.beginPath();
      const first = stroke.points[0];
      ctx.moveTo(first.x * this.cellW, first.y * this.cellH);
      for (let i = 1; i < stroke.points.length; i++) {
        const p = stroke.points[i];
        ctx.lineTo(p.x * this.cellW, p.y * this.cellH);
      }
      ctx.strokeStyle = stroke.color ?? "#e74c3c";
      ctx.lineWidth = (stroke.width ?? 2) * Math.min(this.cellW, this.cellH) / 100;
      ctx.lineCap = "round";
      ctx.lineJoin = "round";
      ctx.globalAlpha = stroke.opacity ?? 1;
      ctx.stroke();
      ctx.globalAlpha = 1;
    }
  }

  private drawSelectedTokenOverlay(ctx: CanvasRenderingContext2D) {
    const selToken = this.tokens.find((t) => t.id === this.options.selectedTokenId);
    if (!selToken) return;

    const cx = (selToken.x + selToken.size / 2) * this.cellW;
    const cy = (selToken.y + selToken.size / 2) * this.cellH;
    const radius = (selToken.size * TOKEN_RADIUS_RATIO) * Math.min(this.cellW, this.cellH) + 4;

    // Pulsing selection ring
    const pulse = 0.5 + 0.5 * Math.sin(Date.now() / 500);
    ctx.beginPath();
    ctx.arc(cx, cy, radius, 0, Math.PI * 2);
    ctx.strokeStyle = `rgba(163, 90, 255, ${0.3 + 0.3 * pulse})`;
    ctx.lineWidth = 2.5;
    ctx.stroke();
  }

  /* ── Lifecycle ──────────────────────────────────────────── */

  startRenderLoop() {
    const loop = () => {
      if (this.options.selectedTokenId) {
        this.render(); // Re-render for selection pulse animation
      }
      this.animFrameId = requestAnimationFrame(loop);
    };
    this.animFrameId = requestAnimationFrame(loop);
  }

  stopRenderLoop() {
    if (this.animFrameId !== null) {
      cancelAnimationFrame(this.animFrameId);
      this.animFrameId = null;
    }
  }

  destroy() {
    this.stopRenderLoop();
    this.backgroundImage = null;
    this.imageCache.clear();
    this.map = null;
    this.tokens = [];
    this.aoeTemplates = [];
  }
}
