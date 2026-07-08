/** Music control (mute toggle + volume slider). Shared by the title menu and
 *  the battle top bar. */
import { useState } from 'react';
import { music } from './audio.ts';

export function MusicToggle() {
  const [muted, setMuted] = useState(() => music.isMuted());
  const [vol, setVol] = useState(() => Math.round(music.volume() * 100));
  return (
    <div className="musicCtl" onPointerDown={(e) => e.stopPropagation()}>
      <button className={`musicBtn${muted ? ' muted' : ''}`} title={muted ? 'Unmute music' : 'Mute music'}
        onClick={() => setMuted(music.toggleMute())}>♪</button>
      <input className="volSlider" type="range" min={0} max={100} value={vol} title="Music volume"
        onChange={(e) => { const v = Number(e.currentTarget.value); setVol(v); music.setVolume(v / 100); }} />
    </div>
  );
}
