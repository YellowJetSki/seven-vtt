/* ── Spotify Auth + API Service ─────────────────────────────────
 * Pure service layer: PKCE OAuth flow, token management,
 * search, and playback control. No React dependencies.
 * ─────────────────────────────────────────────────────────────── */

const SPOTIFY_AUTH_URL = "https://accounts.spotify.com/authorize";
const SPOTIFY_TOKEN_URL = "https://accounts.spotify.com/api/token";
const SPOTIFY_API_BASE = "https://api.spotify.com/v1";

const SCOPES = [
  "streaming",
  "user-read-playback-state",
  "user-modify-playback-state",
  "user-read-currently-playing",
  "user-read-email",
  "user-read-private",
].join(" ");

/* ── Types ──────────────────────────────────────────────────── */

export interface SpotifyTokens {
  accessToken: string;
  refreshToken: string;
  expiresAt: number; // epoch ms
}

export interface SpotifyTrack {
  id: string;
  uri: string;
  name: string;
  artists: { name: string }[];
  album: {
    name: string;
    images: { url: string; width: number; height: number }[];
  };
  durationMs: number;
  explicit: boolean;
}

export interface SpotifyDevice {
  id: string;
  name: string;
  type: string;
  isActive: boolean;
  volumePercent: number;
}

export interface PlaybackState {
  isPlaying: boolean;
  track: SpotifyTrack | null;
  device: SpotifyDevice | null;
  progressMs: number;
  shuffleState: boolean;
  repeatState: "off" | "context" | "track";
}

/* ── Token Persistence (localStorage) ───────────────────────── */

const STORAGE_KEY = "str_vtt_spotify_tokens";

function persistTokens(tokens: SpotifyTokens): void {
  localStorage.setItem(STORAGE_KEY, JSON.stringify(tokens));
}

function loadTokens(): SpotifyTokens | null {
  try {
    const raw = localStorage.getItem(STORAGE_KEY);
    if (!raw) return null;
    return JSON.parse(raw) as SpotifyTokens;
  } catch {
    return null;
  }
}

function clearTokens(): void {
  localStorage.removeItem(STORAGE_KEY);
}

/* ── PKCE Code Generation ───────────────────────────────────── */

function generateCodeVerifier(): string {
  const charset =
    "ABCDEFGHIJKLMNOPQRSTUVWXYZabcdefghijklmnopqrstuvwxyz0123456789-._~";
  const array = new Uint8Array(64);
  crypto.getRandomValues(array);
  return Array.from(array, (byte) => charset[byte % charset.length]).join("");
}

async function generateCodeChallenge(verifier: string): Promise<string> {
  const encoder = new TextEncoder();
  const data = encoder.encode(verifier);
  const digest = await crypto.subtle.digest("SHA-256", data);
  return btoa(String.fromCharCode(...new Uint8Array(digest)))
    .replace(/=/g, "")
    .replace(/\+/g, "-")
    .replace(/\//g, "_");
}

/* ── OAuth Flow ─────────────────────────────────────────────── */

let _pendingVerifier: string | null = null;

/**
 * Redirect the user to Spotify's authorization page.
 * Call this in response to a user click (must be user-initiated).
 */
export function initiateLogin(clientId: string, redirectUri: string): void {
  const verifier = generateCodeVerifier();
  _pendingVerifier = verifier;
  generateCodeChallenge(verifier).then((challenge) => {
    const params = new URLSearchParams({
      response_type: "code",
      client_id: clientId,
      scope: SCOPES,
      redirect_uri: redirectUri,
      code_challenge_method: "S256",
      code_challenge: challenge,
    });
    window.location.href = `${SPOTIFY_AUTH_URL}?${params.toString()}`;
  });
}

/**
 * Handle the OAuth callback after Spotify redirects back.
 * Call this on app mount to check for an auth code in the URL.
 * Returns true if a code was consumed.
 */
export async function handleCallback(
  clientId: string,
  redirectUri: string,
): Promise<boolean> {
  const params = new URLSearchParams(window.location.search);
  const code = params.get("code");
  const error = params.get("error");

  // Clean up the URL immediately
  window.history.replaceState({}, "", redirectUri);

  if (error || !code) return false;

  const verifier = _pendingVerifier;
  _pendingVerifier = null;
  if (!verifier) return false;

  const body = new URLSearchParams({
    grant_type: "authorization_code",
    code,
    redirect_uri: redirectUri,
    client_id: clientId,
    code_verifier: verifier,
  });

  const res = await fetch(SPOTIFY_TOKEN_URL, {
    method: "POST",
    headers: { "Content-Type": "application/x-www-form-urlencoded" },
    body,
  });

  if (!res.ok) {
    console.error("[Spotify] Token exchange failed:", await res.text());
    return false;
  }

  const data = await res.json();
  const tokens: SpotifyTokens = {
    accessToken: data.access_token,
    refreshToken: data.refresh_token,
    expiresAt: Date.now() + data.expires_in * 1000,
  };
  persistTokens(tokens);
  return true;
}

/* ── Token Management ───────────────────────────────────────── */

/**
 * Returns a valid access token, refreshing automatically if expired.
 * Returns null if no tokens exist or refresh fails.
 */
export async function getValidToken(
  clientId: string,
): Promise<string | null> {
  const tokens = loadTokens();
  if (!tokens) return null;

  // If still valid, return it
  if (Date.now() < tokens.expiresAt - 60_000) {
    return tokens.accessToken;
  }

  // Refresh
  const body = new URLSearchParams({
    grant_type: "refresh_token",
    refresh_token: tokens.refreshToken,
    client_id: clientId,
  });

  const res = await fetch(SPOTIFY_TOKEN_URL, {
    method: "POST",
    headers: { "Content-Type": "application/x-www-form-urlencoded" },
    body,
  });

  if (!res.ok) {
    clearTokens();
    return null;
  }

  const data = await res.json();
  const updated: SpotifyTokens = {
    accessToken: data.access_token,
    refreshToken: data.refresh_token ?? tokens.refreshToken,
    expiresAt: Date.now() + data.expires_in * 1000,
  };
  persistTokens(updated);
  return updated.accessToken;
}

/** Check if a user is currently authenticated. */
export function isAuthenticated(): boolean {
  return loadTokens() !== null;
}

/** Log out and clear all stored tokens. */
export function logout(): void {
  clearTokens();
}

/* ── API Methods ────────────────────────────────────────────── */

async function fetchApi<T>(
  endpoint: string,
  clientId: string,
  options: RequestInit = {},
): Promise<T> {
  const token = await getValidToken(clientId);
  if (!token) throw new Error("Not authenticated with Spotify");

  const res = await fetch(`${SPOTIFY_API_BASE}${endpoint}`, {
    ...options,
    headers: {
      Authorization: `Bearer ${token}`,
      "Content-Type": "application/json",
      ...options.headers,
    },
  });

  if (res.status === 204) return {} as T;
  if (!res.ok) {
    const text = await res.text();
    throw new Error(`Spotify API error (${res.status}): ${text}`);
  }

  return res.json();
}

/* ── Search ─────────────────────────────────────────────────── */

export interface SearchResult {
  tracks: SpotifyTrack[];
}

export async function searchTracks(
  query: string,
  clientId: string,
  limit = 10,
): Promise<SpotifyTrack[]> {
  const params = new URLSearchParams({
    q: query,
    type: "track",
    limit: String(limit),
  });
  const data = await fetchApi<{ tracks: { items: any[] } }>(
    `/search?${params.toString()}`,
    clientId,
  );
  return data.tracks.items.map(mapTrack);
}

function mapTrack(item: any): SpotifyTrack {
  return {
    id: item.id,
    uri: item.uri,
    name: item.name,
    artists: item.artists.map((a: any) => ({ name: a.name })),
    album: {
      name: item.album.name,
      images: item.album.images ?? [],
    },
    durationMs: item.duration_ms,
    explicit: item.explicit,
  };
}

/* ── Playback ───────────────────────────────────────────────── */

export async function getPlaybackState(
  clientId: string,
): Promise<PlaybackState | null> {
  try {
    const data = await fetchApi<any>("/me/player", clientId);
    if (!data || !data.item) return null;
    return {
      isPlaying: data.is_playing,
      track: mapTrack(data.item),
      device: data.device
        ? {
            id: data.device.id,
            name: data.device.name,
            type: data.device.type,
            isActive: data.device.is_active,
            volumePercent: data.device.volume_percent,
          }
        : null,
      progressMs: data.progress_ms,
      shuffleState: data.shuffle_state,
      repeatState: data.repeat_state,
    };
  } catch {
    return null;
  }
}

export async function playTrack(
  trackUri: string,
  clientId: string,
  deviceId?: string,
): Promise<void> {
  const body: any = { uris: [trackUri] };
  const query = deviceId ? `?device_id=${deviceId}` : "";
  await fetchApi(`/me/player/play${query}`, clientId, {
    method: "PUT",
    body: JSON.stringify(body),
  });
}

export async function playContext(
  contextUri: string,
  clientId: string,
  offset?: { position: number },
  deviceId?: string,
): Promise<void> {
  const body: any = { context_uri: contextUri };
  if (offset) body.offset = offset;
  const query = deviceId ? `?device_id=${deviceId}` : "";
  await fetchApi(`/me/player/play${query}`, clientId, {
    method: "PUT",
    body: JSON.stringify(body),
  });
}

export async function pausePlayback(clientId: string): Promise<void> {
  await fetchApi("/me/player/pause", clientId, { method: "PUT" });
}

export async function resumePlayback(clientId: string): Promise<void> {
  await fetchApi("/me/player/play", clientId, { method: "PUT" });
}

export async function nextTrack(clientId: string): Promise<void> {
  await fetchApi("/me/player/next", clientId, { method: "POST" });
}

export async function previousTrack(clientId: string): Promise<void> {
  await fetchApi("/me/player/previous", clientId, { method: "POST" });
}

export async function setVolume(
  volumePercent: number,
  clientId: string,
): Promise<void> {
  await fetchApi(
    `/me/player/volume?volume_percent=${Math.round(volumePercent)}`,
    clientId,
    { method: "PUT" },
  );
}

export async function getDevices(
  clientId: string,
): Promise<SpotifyDevice[]> {
  const data = await fetchApi<{ devices: any[] }>("/me/player/devices", clientId);
  return data.devices.map((d) => ({
    id: d.id,
    name: d.name,
    type: d.type,
    isActive: d.is_active,
    volumePercent: d.volume_percent,
  }));
}

export async function transferPlayback(
  deviceId: string,
  clientId: string,
  play = true,
): Promise<void> {
  await fetchApi("/me/player", clientId, {
    method: "PUT",
    body: JSON.stringify({ device_ids: [deviceId], play }),
  });
}

/* ── Playlists (for ambiance/combat tracks) ─────────────────── */

export async function getPlaylistTracks(
  playlistId: string,
  clientId: string,
  limit = 20,
): Promise<SpotifyTrack[]> {
  const params = new URLSearchParams({ limit: String(limit) });
  const data = await fetchApi<{ items: any[] }>(
    `/playlists/${playlistId}/tracks?${params.toString()}`,
    clientId,
  );
  return data.items
    .filter((i) => i.track)
    .map((i) => mapTrack(i.track));
}
