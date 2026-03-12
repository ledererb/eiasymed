'use client';
import { useState, useEffect, useRef } from 'react';
import { Microphone, PauseCircle, StopCircle } from '@phosphor-icons/react';
import styles from './VoiceRecordingBar.module.css';

export function VoiceRecordingBar() {
  const [recording, setRecording] = useState(true);
  const [seconds, setSeconds] = useState(216); // 3:36

  // Timer
  useEffect(() => {
    if (!recording) return;
    const id = setInterval(() => setSeconds(s => s + 1), 1000);
    return () => clearInterval(id);
  }, [recording]);

  const mins = Math.floor(seconds / 60);
  const secs = seconds % 60;
  const timeStr = `${String(mins).padStart(2, '0')}:${String(secs).padStart(2, '0')}:${String(Math.floor(Math.random() * 60)).padStart(2, '0')}`;

  // Generate waveform bars with varied heights
  const bars = useRef(
    Array.from({ length: 32 }, () => 6 + Math.random() * 30)
  ).current;

  return (
    <div className={styles.wrapper}>
      <div className={styles.badge}>
        {/* Gradient mic button */}
        <div className={styles.micCircle} onClick={() => setRecording(r => !r)}>
          <div className={styles.micInner}>
            <Microphone size={40} weight="regular" />
          </div>
        </div>

        {/* Waveform */}
        <div className={styles.waveform}>
          {bars.map((h, i) => (
            <div
              key={i}
              className={styles.waveBar}
              style={{ height: recording ? h : 4 }}
            />
          ))}
        </div>

        {/* Status text */}
        <span className={styles.statusText}>Hangfelvétel folyamatban</span>

        {/* Timer */}
        <span className={styles.timer}>{timeStr}</span>

        {/* Spacer */}
        <div className={styles.spacer} />

        {/* Pause */}
        <button className={styles.controlBtn} onClick={() => setRecording(r => !r)}>
          <PauseCircle size={50} weight="thin" />
        </button>

        {/* Stop */}
        <button className={styles.controlBtn} onClick={() => { setRecording(false); setSeconds(0); }}>
          <StopCircle size={50} weight="thin" />
        </button>
      </div>
    </div>
  );
}
