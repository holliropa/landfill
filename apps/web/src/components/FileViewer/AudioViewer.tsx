import { getFileRawUrl } from "@/lib/client";
import type { FileResponse } from "@/lib/client/api";
import {
  MusicIcon,
  PauseIcon,
  PlayIcon,
  RepeatIcon,
  Volume2Icon,
  VolumeXIcon,
} from "lucide-react";
import { useEffect, useRef, useState } from "react";
import styles from "./FileViewer.module.css";

export function AudioViewer({ file }: { file: FileResponse }) {
  const audioRef = useRef<HTMLAudioElement>(null);
  const [isPlaying, setIsPlaying] = useState(false);
  const [currentTime, setCurrentTime] = useState(0);
  const [duration, setDuration] = useState(0);
  const [playbackRate, setPlaybackRate] = useState(1);
  const [isLooping, setIsLooping] = useState(false);
  const [isMuted, setIsMuted] = useState(false);

  useEffect(() => {
    const audio = audioRef.current;
    if (!audio) return;

    const onPlay = () => setIsPlaying(true);
    const onPause = () => setIsPlaying(false);
    const onTimeUpdate = () => setCurrentTime(audio.currentTime);
    const onLoadedMetadata = () => setDuration(audio.duration || 0);

    audio.addEventListener("play", onPlay);
    audio.addEventListener("pause", onPause);
    audio.addEventListener("timeupdate", onTimeUpdate);
    audio.addEventListener("loadedmetadata", onLoadedMetadata);

    return () => {
      audio.removeEventListener("play", onPlay);
      audio.removeEventListener("pause", onPause);
      audio.removeEventListener("timeupdate", onTimeUpdate);
      audio.removeEventListener("loadedmetadata", onLoadedMetadata);
    };
  }, []);

  const togglePlay = () => {
    if (!audioRef.current) return;
    if (isPlaying) {
      audioRef.current.pause();
    } else {
      audioRef.current.play();
    }
  };

  const handleSeek = (e: React.ChangeEvent<HTMLInputElement>) => {
    const time = Number(e.target.value);
    setCurrentTime(time);
    if (audioRef.current) {
      audioRef.current.currentTime = time;
    }
  };

  const cyclePlaybackRate = () => {
    const rates = [0.75, 1, 1.25, 1.5, 2];
    const currentIndex = rates.indexOf(playbackRate);
    const nextRate = rates[(currentIndex + 1) % rates.length];
    setPlaybackRate(nextRate);
    if (audioRef.current) {
      audioRef.current.playbackRate = nextRate;
    }
  };

  const toggleLoop = () => {
    setIsLooping((prev) => {
      const next = !prev;
      if (audioRef.current) audioRef.current.loop = next;
      return next;
    });
  };

  const toggleMute = () => {
    setIsMuted((prev) => {
      const next = !prev;
      if (audioRef.current) audioRef.current.muted = next;
      return next;
    });
  };

  const formatTime = (seconds: number) => {
    if (Number.isNaN(seconds) || seconds === 0) return "0:00";
    const mins = Math.floor(seconds / 60);
    const secs = Math.floor(seconds % 60);
    return `${mins}:${secs.toString().padStart(2, "0")}`;
  };

  return (
    <div className={styles.customAudioPlayer}>
      <audio ref={audioRef} src={getFileRawUrl(file.id)} autoPlay playsInline />

      <div className={styles.audioCover}>
        <MusicIcon size={48} className={styles.audioIcon} />
        <div className={styles.audioTitle} title={file.name}>
          {file.name}
        </div>
      </div>

      <div className={styles.audioControls}>
        <div className={styles.audioTimeline}>
          <span className={styles.audioTime}>{formatTime(currentTime)}</span>
          <input
            type="range"
            min={0}
            max={duration || 100}
            step={0.1}
            value={currentTime}
            onChange={handleSeek}
            className={styles.audioSeeker}
          />
          <span className={styles.audioTime}>{formatTime(duration)}</span>
        </div>

        <div className={styles.audioButtonRow}>
          <button
            type="button"
            className={`${styles.audioControlBtn} ${isLooping ? styles.audioBtnActive : ""}`}
            onClick={toggleLoop}
            title={isLooping ? "Disable loop" : "Enable loop"}
          >
            <RepeatIcon size={16} />
          </button>

          <button
            type="button"
            className={styles.audioPlayBtn}
            onClick={togglePlay}
            aria-label={isPlaying ? "Pause" : "Play"}
          >
            {isPlaying ? <PauseIcon size={20} /> : <PlayIcon size={20} />}
          </button>

          <button
            type="button"
            className={styles.audioRateBtn}
            onClick={cyclePlaybackRate}
            title="Cycle playback speed"
          >
            {playbackRate}x
          </button>

          <button
            type="button"
            className={styles.audioControlBtn}
            onClick={toggleMute}
            title={isMuted ? "Unmute" : "Mute"}
          >
            {isMuted ? <VolumeXIcon size={16} /> : <Volume2Icon size={16} />}
          </button>
        </div>
      </div>
    </div>
  );
}
