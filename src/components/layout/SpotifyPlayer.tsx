/* ── Spotify Mini-Player ────────────────────────────────────────
 * Collapsible music player embedded in the sidebar.
 * DM can search for tracks and control playback without leaving
 * the dashboard. Uses PKCE OAuth — no backend proxy needed.
 * ─────────────────────────────────────────────────────────────── */

import { useEffect, useRef, useState, useCallback } from "react";
import { useSpotifyStore } from "@/stores/spotifyStore";
import { ENV } from "@/lib/env";

const REDIRECT_URI = `${window.location.origin}/login`;

/* ── Helpers ────────────────────────────────────────────────── */

function formatDuration(ms: number): string {
  const totalSec = Math.floor(ms / 1000);
  const min = Math.floor(totalSec / 60);
  const sec = totalSec % 60;
  return `${min}:${sec.toString().padStart(2, "0")}`;
}

function formatProgress(ms: number): string {
  return formatDuration(ms);
}

/* ── Component ──────────────────────────────────────────────── */

export function SpotifyPlayer() {
  const isConnected = useSpotifyStore((s) => s.isConnected);
  const initialize = useSpotifyStore((s) => s.initialize);
  const clientId = ENV.SPOTIFY_CLIENT_ID;
  const hasClientId = clientId.length > 0;

  useEffect(() => {
    if (hasClientId) {
      initialize(clientId, REDIRECT_URI);
    }
    // Cleanup polling on unmount
    return () => {
      useSpotifyStore.getState().stopPolling();
    };
  }, [initialize, clientId, hasClientId]);

  // If no client ID configured, don't render anything
  if (!hasClientId) return null;

  return (
    <div className="border-t border-surface-700">
      {isConnected ? <ConnectedPlayer /> : <LoginPrompt />}
    </div>
  );
}

/* ── Login Prompt ──────────────────────────────────────────── */

function LoginPrompt() {
  const isConnecting = useSpotifyStore((s) => s.isConnecting);
  const connect = useSpotifyStore((s) => s.connect);
  const authError = useSpotifyStore((s) => s.authError);

  const handleConnect = useCallback(() => {
    connect(ENV.SPOTIFY_CLIENT_ID, REDIRECT_URI);
  }, [connect]);

  return (
    <div className="px-3 py-3">
      <button
        onClick={handleConnect}
        disabled={isConnecting}
        className="flex w-full items-center gap-2 rounded-lg bg-green-600/20 px-3 py-2 text-xs font-medium text-green-400 transition-all hover:bg-green-600/30 disabled:opacity-50"
      >
        <svg className="h-4 w-4" viewBox="0 0 24 24" fill="currentColor">
          <path d="M12 0C5.4 0 0 5.4 0 12s5.4 12 12 12 12-5.4 12-12S18.66 0 12 0zm5.521 17.34c-.24.359-.66.48-1.021.24-2.82-1.74-6.36-2.101-10.561-1.141-.418.122-.779-.179-.899-.539-.12-.421.18-.78.54-.9 4.56-1.021 8.52-.6 11.64 1.32.42.18.479.659.301 1.02zm1.44-3.3c-.301.42-.841.6-1.262.3-3.239-1.98-8.159-2.58-11.939-1.38-.479.12-1.02-.12-1.14-.6-.12-.48.12-1.021.6-1.141C9.6 9.9 15 10.561 18.72 12.84c.361.181.54.78.241 1.2zm.12-3.36C15.24 8.4 8.82 8.16 5.16 9.301c-.6.179-1.2-.181-1.38-.721-.18-.601.18-1.2.72-1.381 4.26-1.26 11.28-1.02 15.721 1.621.539.3.719 1.02.419 1.56-.299.421-1.02.599-1.559.3z"/>
        </svg>
        {isConnecting ? "Connecting..." : "Connect Spotify"}
      </button>
      {authError && (
        <p className="mt-1.5 text-[10px] text-red-400">{authError}</p>
      )}
    </div>
  );
}

/* ── Connected Player ───────────────────────────────────────── */

function ConnectedPlayer() {
  const currentTrack = useSpotifyStore((s) => s.currentTrack);
  const isPlaying = useSpotifyStore((s) => s.isPlaying);
  const progressMs = useSpotifyStore((s) => s.progressMs);
  const volumePercent = useSpotifyStore((s) => s.volumePercent);
  const isOpen = useSpotifyStore((s) => s.isOpen);
  const toggleOpen = useSpotifyStore((s) => s.toggleOpen);
  const pause = useSpotifyStore((s) => s.pause);
  const resume = useSpotifyStore((s) => s.resume);
  const next = useSpotifyStore((s) => s.next);
  const previous = useSpotifyStore((s) => s.previous);
  const changeVolume = useSpotifyStore((s) => s.changeVolume);
  const disconnect = useSpotifyStore((s) => s.disconnect);
  const search = useSpotifyStore((s) => s.search);
  const clearSearch = useSpotifyStore((s) => s.clearSearch);
  const searchResults = useSpotifyStore((s) => s.searchResults);
  const isSearching = useSpotifyStore((s) => s.isSearching);
  const searchQuery = useSpotifyStore((s) => s.searchQuery);
  const play = useSpotifyStore((s) => s.play);
  const devices = useSpotifyStore((s) => s.devices);
  const showDeviceList = useSpotifyStore((s) => s.showDeviceList);
  const selectDevice = useSpotifyStore((s) => s.selectDevice);
  const refreshDevices = useSpotifyStore((s) => s.refreshDevices);

  const searchInputRef = useRef<HTMLInputElement>(null);
  const [searchFocused, setSearchFocused] = useState(false);

  const handleTogglePlay = useCallback(() => {
    if (isPlaying) {
      pause(ENV.SPOTIFY_CLIENT_ID);
    } else {
      resume(ENV.SPOTIFY_CLIENT_ID);
    }
  }, [isPlaying, pause, resume]);

  const handleSearch = useCallback(
    (e: React.ChangeEvent<HTMLInputElement>) => {
      const q = e.target.value;
      search(q, ENV.SPOTIFY_CLIENT_ID);
    },
    [search],
  );

  const handleSelectTrack = useCallback(
    (uri: string) => {
      play(uri, ENV.SPOTIFY_CLIENT_ID);
      clearSearch();
      searchInputRef.current?.blur();
      setSearchFocused(false);
    },
    [play, clearSearch],
  );

  const handleDeviceClick = useCallback(() => {
    refreshDevices(ENV.SPOTIFY_CLIENT_ID);
    useSpotifyStore.setState({ showDeviceList: !showDeviceList });
  }, [refreshDevices, showDeviceList]);

  const progressPercent = currentTrack
    ? (progressMs / currentTrack.durationMs) * 100
    : 0;

  return (
    <div className="flex flex-col">
      {/* ── Mini-bar (always visible) ── */}
      <button
        onClick={toggleOpen}
        className="flex w-full items-center gap-2 px-3 py-2 text-left text-xs text-surface-400 hover:bg-surface-800 hover:text-surface-200 transition-colors"
      >
        {/* Album art or fallback */}
        {currentTrack?.album.images[0]?.url ? (
          <img
            src={currentTrack.album.images[0].url}
            alt=""
            className="h-7 w-7 rounded object-cover"
          />
        ) : (
          <svg className="h-7 w-7 text-green-400" viewBox="0 0 24 24" fill="currentColor">
            <path d="M12 0C5.4 0 0 5.4 0 12s5.4 12 12 12 12-5.4 12-12S18.66 0 12 0zm5.521 17.34c-.24.359-.66.48-1.021.24-2.82-1.74-6.36-2.101-10.561-1.141-.418.122-.779-.179-.899-.539-.12-.421.18-.78.54-.9 4.56-1.021 8.52-.6 11.64 1.32.42.18.479.659.301 1.02zm1.44-3.3c-.301.42-.841.6-1.262.3-3.239-1.98-8.159-2.58-11.939-1.38-.479.12-1.02-.12-1.14-.6-.12-.48.12-1.021.6-1.141C9.6 9.9 15 10.561 18.72 12.84c.361.181.54.78.241 1.2zm.12-3.36C15.24 8.4 8.82 8.16 5.16 9.301c-.6.179-1.2-.181-1.38-.721-.18-.601.18-1.2.72-1.381 4.26-1.26 11.28-1.02 15.721 1.621.539.3.719 1.02.419 1.56-.299.421-1.02.599-1.559.3z"/>
          </svg>
        )}

        <div className="min-w-0 flex-1">
          {currentTrack ? (
            <>
              <p className="truncate font-medium text-surface-200">
                {currentTrack.name}
              </p>
              <p className="truncate text-[10px] text-surface-500">
                {currentTrack.artists.map((a) => a.name).join(", ")}
              </p>
            </>
          ) : (
            <p className="text-surface-500">No track playing</p>
          )}
        </div>

        {/* Play/ Pause mini */}
        <button
          onClick={(e) => {
            e.stopPropagation();
            handleTogglePlay();
          }}
          disabled={!currentTrack}
          className="flex h-6 w-6 items-center justify-center rounded-full bg-surface-700 text-surface-300 hover:bg-surface-600 disabled:opacity-30"
        >
          {isPlaying ? (
            <svg className="h-3 w-3" viewBox="0 0 24 24" fill="currentColor">
              <rect x="6" y="4" width="4" height="16" rx="1"/>
              <rect x="14" y="4" width="4" height="16" rx="1"/>
            </svg>
          ) : (
            <svg className="ml-0.5 h-3 w-3" viewBox="0 0 24 24" fill="currentColor">
              <polygon points="5,3 19,12 5,21"/>
            </svg>
          )}
        </button>

        {/* Expand / Collapse */}
        <svg
          className={`h-3 w-3 transition-transform ${isOpen ? "rotate-180" : ""}`}
          viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2"
        >
          <polyline points="6 9 12 15 18 9"/>
        </svg>
      </button>

      {/* ── Expanded Panel ── */}
      {isOpen && (
        <div className="border-t border-surface-700 bg-surface-850 px-3 pb-3 pt-2 space-y-2">
          {/* Progress Bar */}
          {currentTrack && (
            <div className="flex items-center gap-2 text-[10px] text-surface-500">
              <span>{formatProgress(progressMs)}</span>
              <div className="h-1 flex-1 overflow-hidden rounded-full bg-surface-700">
                <div
                  className="h-full rounded-full bg-green-500 transition-all duration-500"
                  style={{ width: `${progressPercent}%` }}
                />
              </div>
              <span>{formatDuration(currentTrack.durationMs)}</span>
            </div>
          )}

          {/* Playback Controls */}
          <div className="flex items-center justify-center gap-3">
            <button
              onClick={() => previous(ENV.SPOTIFY_CLIENT_ID)}
              className="text-surface-400 hover:text-surface-200 transition-colors"
            >
              <svg className="h-4 w-4" viewBox="0 0 24 24" fill="currentColor">
                <path d="M6 6h2v12H6zm3.5 6l8.5 6V6z"/>
              </svg>
            </button>

            <button
              onClick={handleTogglePlay}
              disabled={!currentTrack}
              className="flex h-8 w-8 items-center justify-center rounded-full bg-white/10 text-surface-200 hover:bg-white/20 disabled:opacity-30 transition-all"
            >
              {isPlaying ? (
                <svg className="h-4 w-4" viewBox="0 0 24 24" fill="currentColor">
                  <rect x="6" y="4" width="4" height="16" rx="1"/>
                  <rect x="14" y="4" width="4" height="16" rx="1"/>
                </svg>
              ) : (
                <svg className="ml-0.5 h-4 w-4" viewBox="0 0 24 24" fill="currentColor">
                  <polygon points="5,3 19,12 5,21"/>
                </svg>
              )}
            </button>

            <button
              onClick={() => next(ENV.SPOTIFY_CLIENT_ID)}
              className="text-surface-400 hover:text-surface-200 transition-colors"
            >
              <svg className="h-4 w-4" viewBox="0 0 24 24" fill="currentColor">
                <path d="M6 18l8.5-6L6 6v12zM16 6v12h2V6h-2z"/>
              </svg>
            </button>
          </div>

          {/* Volume + Device */}
          <div className="flex items-center gap-2">
            <button
              onClick={handleDeviceClick}
              className="text-surface-500 hover:text-surface-300 transition-colors"
              title="Available devices"
            >
              <svg className="h-4 w-4" viewBox="0 0 24 24" fill="currentColor">
                <path d="M3 9v6h4l5 5V4L7 9H3zm13.5 3c0-1.77-1.02-3.29-2.5-4.03v8.05c1.48-.73 2.5-2.25 2.5-4.02zM14 3.23v2.06c2.89.86 5 3.54 5 6.71s-2.11 5.85-5 6.71v2.06c4.01-.91 7-4.49 7-8.77s-2.99-7.86-7-8.77z"/>
              </svg>
            </button>

            <input
              type="range"
              min={0}
              max={100}
              value={volumePercent}
              onChange={(e) =>
                changeVolume(Number(e.target.value), ENV.SPOTIFY_CLIENT_ID)
              }
              className="h-1 flex-1 cursor-pointer appearance-none rounded-full bg-surface-700 accent-green-500 [&::-webkit-slider-thumb]:h-3 [&::-webkit-slider-thumb]:w-3 [&::-webkit-slider-thumb]:appearance-none [&::-webkit-slider-thumb]:rounded-full [&::-webkit-slider-thumb]:bg-green-500"
            />

            <button
              onClick={disconnect}
              className="text-surface-500 hover:text-red-400 transition-colors"
              title="Disconnect Spotify"
            >
              <svg className="h-3.5 w-3.5" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
                <path d="M18.36 6.64a9 9 0 1 1-12.73 0"/>
                <line x1="12" y1="2" x2="12" y2="12"/>
              </svg>
            </button>
          </div>

          {/* Device List */}
          {showDeviceList && (
            <div className="rounded-lg border border-surface-700 bg-surface-800 p-1">
              <p className="px-2 py-1 text-[10px] font-semibold uppercase tracking-wider text-surface-500">
                Devices
              </p>
              {devices.length === 0 ? (
                <p className="px-2 py-2 text-[10px] text-surface-500">
                  No devices found. Open Spotify on a device first.
                </p>
              ) : (
                devices.map((d) => (
                  <button
                    key={d.id}
                    onClick={() => selectDevice(d.id, ENV.SPOTIFY_CLIENT_ID)}
                    className={`flex w-full items-center gap-2 rounded px-2 py-1.5 text-left text-[11px] transition-colors ${
                      d.isActive
                        ? "bg-green-600/20 text-green-400"
                        : "text-surface-400 hover:bg-surface-700 hover:text-surface-200"
                    }`}
                  >
                    <span className="flex h-5 w-5 items-center justify-center rounded-full bg-surface-700 text-[9px]">
                      {d.type === "Computer" ? "💻" : d.type === "Smartphone" ? "📱" : "🔊"}
                    </span>
                    <span className="flex-1 truncate">{d.name}</span>
                    {d.isActive && <span className="text-[9px] text-green-400">Active</span>}
                  </button>
                ))
              )}
            </div>
          )}

          {/* Search */}
          <div className="relative">
            <input
              ref={searchInputRef}
              type="text"
              value={searchQuery}
              onChange={handleSearch}
              onFocus={() => setSearchFocused(true)}
              onBlur={() => setTimeout(() => setSearchFocused(false), 200)}
              placeholder="Search tracks..."
              className="w-full rounded-lg border border-surface-700 bg-surface-800 px-3 py-1.5 text-xs text-surface-100 placeholder:text-surface-500 focus:border-green-500 focus:outline-none"
            />

            {/* Search Results */}
            {searchFocused && searchQuery.trim().length > 0 && (
              <div className="absolute bottom-full left-0 right-0 mb-1 max-h-48 overflow-y-auto rounded-lg border border-surface-700 bg-surface-800 shadow-lg">
                {isSearching ? (
                  <p className="px-3 py-2 text-[10px] text-surface-500">Searching...</p>
                ) : searchResults.length === 0 ? (
                  <p className="px-3 py-2 text-[10px] text-surface-500">No results</p>
                ) : (
                  searchResults.map((track) => (
                    <button
                      key={track.id}
                      onMouseDown={(e) => {
                        e.preventDefault();
                        handleSelectTrack(track.uri);
                      }}
                      className="flex w-full items-center gap-2 px-3 py-2 text-left text-[11px] hover:bg-surface-700 transition-colors"
                    >
                      {track.album.images[0]?.url && (
                        <img
                          src={track.album.images[0].url}
                          alt=""
                          className="h-8 w-8 rounded object-cover"
                        />
                      )}
                      <div className="min-w-0 flex-1">
                        <p className="truncate font-medium text-surface-200">{track.name}</p>
                        <p className="truncate text-[10px] text-surface-500">
                          {track.artists.map((a) => a.name).join(", ")}
                        </p>
                      </div>
                      <span className="text-[10px] text-surface-500">
                        {formatDuration(track.durationMs)}
                      </span>
                    </button>
                  ))
                )}
              </div>
            )}
          </div>
        </div>
      )}
    </div>
  );
}
