// ReadAloud.jsx — text-to-speech using the browser's free speechSynthesis API.
// Drops onto any resource detail panel and reads the body out loud.
//
// Accessibility: visible play/pause/stop controls, speed slider, voice picker.
// No external API calls — entirely on-device.

import { useEffect, useMemo, useRef, useState } from 'react';

const SUPPORTED = typeof window !== 'undefined' && 'speechSynthesis' in window;

function buildText(resource) {
  if (!resource) return '';
  const parts = [
    resource.title,
    resource.author ? `By ${resource.author}.` : '',
    resource.summary,
    resource.body,
    resource.keyQuote ? `Key quote: ${resource.keyQuote}` : '',
    resource.whyRead || resource.whyStudy || '',
  ].filter(Boolean);
  return parts.join('. ');
}

function ReadAloud({ resource }) {
  const [voices, setVoices] = useState([]);
  const [voiceURI, setVoiceURI] = useState('');
  const [rate, setRate] = useState(1.0);
  const [state, setState] = useState('idle');  // idle | playing | paused
  const [progress, setProgress] = useState(0); // 0-1
  const utterRef = useRef(null);

  // Voice list loads asynchronously in Chrome — listen for it.
  useEffect(() => {
    if (!SUPPORTED) return;
    const update = () => {
      const list = window.speechSynthesis.getVoices() || [];
      setVoices(list);
      // Default to the first English voice if none picked yet
      if (!voiceURI && list.length) {
        const en = list.find(v => v.lang && v.lang.startsWith('en')) || list[0];
        setVoiceURI(en.voiceURI);
      }
    };
    update();
    window.speechSynthesis.addEventListener('voiceschanged', update);
    return () => window.speechSynthesis.removeEventListener('voiceschanged', update);
  }, []); // eslint-disable-line react-hooks/exhaustive-deps

  // Stop speaking when the user navigates away or the resource changes.
  useEffect(() => () => stop(), [resource?.id]); // eslint-disable-line react-hooks/exhaustive-deps

  const text = useMemo(() => buildText(resource), [resource]);

  const play = () => {
    if (!SUPPORTED || !text) return;
    stop();
    const u = new SpeechSynthesisUtterance(text);
    u.rate = rate;
    u.pitch = 1;
    const v = voices.find(x => x.voiceURI === voiceURI);
    if (v) u.voice = v;
    u.onstart   = () => setState('playing');
    u.onend     = () => { setState('idle'); setProgress(0); };
    u.onpause   = () => setState('paused');
    u.onresume  = () => setState('playing');
    u.onerror   = () => setState('idle');
    u.onboundary = (e) => {
      if (text.length) setProgress(Math.min(1, e.charIndex / text.length));
    };
    utterRef.current = u;
    window.speechSynthesis.speak(u);
  };

  const pause = () => {
    if (!SUPPORTED) return;
    window.speechSynthesis.pause();
  };
  const resume = () => {
    if (!SUPPORTED) return;
    window.speechSynthesis.resume();
  };
  const stop = () => {
    if (!SUPPORTED) return;
    try { window.speechSynthesis.cancel(); } catch { /* ignore */ }
    setState('idle');
    setProgress(0);
  };

  // When user changes speed mid-playback, restart from the beginning at new rate.
  const setRateAndMaybeRestart = (newRate) => {
    setRate(newRate);
    if (state === 'playing') {
      // give React a tick to apply the new rate, then re-play
      setTimeout(play, 0);
    }
  };

  if (!SUPPORTED) {
    return (
      <div style={box}>
        <strong>🔊 Read Aloud</strong>
        <p style={{ margin: '8px 0 0', fontSize: 13, color: '#94a3b8' }}>
          Your browser doesn't support text-to-speech.
        </p>
      </div>
    );
  }

  return (
    <div style={box} role="region" aria-label="Read aloud controls">
      <div style={{ display: 'flex', alignItems: 'center', gap: 12, flexWrap: 'wrap' }}>
        <strong style={{ marginRight: 4 }}>🔊 Read Aloud</strong>

        {state === 'idle' && (
          <button onClick={play} style={btnPrimary} aria-label="Start reading">
            ▶ Listen
          </button>
        )}
        {state === 'playing' && (
          <>
            <button onClick={pause} style={btn} aria-label="Pause reading">⏸ Pause</button>
            <button onClick={stop}  style={btn} aria-label="Stop reading">⏹ Stop</button>
          </>
        )}
        {state === 'paused' && (
          <>
            <button onClick={resume} style={btnPrimary} aria-label="Resume reading">▶ Resume</button>
            <button onClick={stop}   style={btn}        aria-label="Stop reading">⏹ Stop</button>
          </>
        )}

        <label style={{ display: 'flex', alignItems: 'center', gap: 6, fontSize: 13 }}>
          Speed
          <input
            type="range" min="0.5" max="2" step="0.1"
            value={rate}
            onChange={e => setRateAndMaybeRestart(parseFloat(e.target.value))}
            style={{ width: 100 }}
            aria-label="Reading speed"
          />
          <span style={{ width: 28, fontVariantNumeric: 'tabular-nums' }}>{rate.toFixed(1)}×</span>
        </label>

        {voices.length > 0 && (
          <label style={{ display: 'flex', alignItems: 'center', gap: 6, fontSize: 13 }}>
            Voice
            <select
              value={voiceURI}
              onChange={e => setVoiceURI(e.target.value)}
              style={{ padding: '4px 8px', borderRadius: 6, border: '1px solid #cbd5e1', fontSize: 13 }}
              aria-label="Voice selection"
            >
              {voices
                .filter(v => v.lang && (v.lang.startsWith('en') || v.lang.startsWith('hi') || v.lang.startsWith('te')))
                .map(v => (
                  <option key={v.voiceURI} value={v.voiceURI}>
                    {v.name} ({v.lang})
                  </option>
                ))}
            </select>
          </label>
        )}
      </div>

      {(state !== 'idle' || progress > 0) && (
        <div style={{
          height: 4, background: '#e2e8f0', borderRadius: 2, marginTop: 10,
          overflow: 'hidden',
        }} aria-hidden="true">
          <div style={{
            height: '100%', width: `${progress * 100}%`,
            background: '#0f172a', transition: 'width 0.2s',
          }} />
        </div>
      )}
    </div>
  );
}

const box       = { background: '#f8fafc', border: '1px solid #e2e8f0', borderRadius: 10, padding: 12, marginTop: 12 };
const btn       = { padding: '6px 14px', borderRadius: 6, border: '1px solid #cbd5e1', background: 'white', cursor: 'pointer', fontSize: 13 };
const btnPrimary = { ...btn, background: '#0f172a', color: 'white', border: '1px solid #0f172a', fontWeight: 600 };

export default ReadAloud;
