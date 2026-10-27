/** Fullscreen toggle (PC, Android, and itch.io's embed). Uses the Fullscreen
 *  API on the whole document; hidden where the browser can't do it (iPhone
 *  Safari, which only allows video fullscreen — "Add to Home Screen" is the
 *  route there). The F key toggles it from anywhere except text fields. */
import { useEffect, useState } from 'react';

type FsDoc = Document & { webkitFullscreenElement?: Element; webkitExitFullscreen?: () => Promise<void>; webkitFullscreenEnabled?: boolean };
type FsEl = HTMLElement & { webkitRequestFullscreen?: () => Promise<void> };

const doc = () => document as FsDoc;
export const fullscreenSupported = () =>
  typeof document !== 'undefined' && !!(doc().fullscreenEnabled || doc().webkitFullscreenEnabled);
const isFull = () => !!(doc().fullscreenElement || doc().webkitFullscreenElement);

export function toggleFullscreen() {
  if (isFull()) {
    void (doc().exitFullscreen?.() ?? doc().webkitExitFullscreen?.())?.catch(() => {});
  } else {
    const el = document.documentElement as FsEl;
    void (el.requestFullscreen?.({ navigationUI: 'hide' }) ?? el.webkitRequestFullscreen?.())?.catch(() => {});
  }
}

/** true while the game is fullscreen; re-renders on change (incl. Esc) */
export function useFullscreen(): boolean {
  const [full, setFull] = useState(isFull);
  useEffect(() => {
    const on = () => setFull(isFull());
    document.addEventListener('fullscreenchange', on);
    document.addEventListener('webkitfullscreenchange', on);
    return () => {
      document.removeEventListener('fullscreenchange', on);
      document.removeEventListener('webkitfullscreenchange', on);
    };
  }, []);
  return full;
}

/** install once (App): F toggles fullscreen unless you're typing */
export function useFullscreenHotkey() {
  useEffect(() => {
    const onKey = (e: KeyboardEvent) => {
      if (e.key !== 'f' && e.key !== 'F') return;
      if (e.ctrlKey || e.metaKey || e.altKey) return;
      const t = e.target as HTMLElement | null;
      if (t && (t.tagName === 'INPUT' || t.tagName === 'TEXTAREA' || t.tagName === 'SELECT' || t.isContentEditable)) return;
      if (!fullscreenSupported()) return;
      e.preventDefault();
      toggleFullscreen();
    };
    window.addEventListener('keydown', onKey);
    return () => window.removeEventListener('keydown', onKey);
  }, []);
}

export function FullscreenButton() {
  const full = useFullscreen();
  if (!fullscreenSupported()) return null;
  return (
    <button className={`fsBtn${full ? ' on' : ''}`} onPointerDown={(e) => e.stopPropagation()}
      onClick={toggleFullscreen} aria-label={full ? 'Exit fullscreen' : 'Fullscreen'}
      data-tip={full ? 'Exit fullscreen (F or Esc)' : 'Fullscreen (F)'} data-tip-side="bottom">
      <svg viewBox="0 0 24 24" width="16" height="16" aria-hidden="true" fill="none" stroke="currentColor"
        strokeWidth="2.4" strokeLinecap="square">
        {full
          ? <path d="M9 3v6H3M15 3v6h6M9 21v-6H3M15 21v-6h6" />
          : <path d="M3 9V3h6M21 9V3h-6M3 15v6h6M21 15v6h-6" />}
      </svg>
    </button>
  );
}
