/**
 * Photo capture for log entries.
 *
 * Images are downscaled in the browser before they are held in state. A phone
 * photo is 3–8 MB of JPEG and we may attach several to one entry across a
 * dozen children, which is enough to make a tablet struggle — 1280px on the
 * long edge is more than the parent feed can display and roughly a tenth of
 * the bytes. When there is a backend, this is where the upload goes instead.
 */
import { useCallback, useEffect, useId, useRef, useState } from "react";
import { Camera, Circle, FileVideo, ImagePlus, Play, RefreshCw, RotateCcw, Square, Video, Volume2, VolumeX, X } from "lucide-react";
import type { VideoClip } from "./data";

const MAX_EDGE = 1280;
const QUALITY = 0.82;
/** Anything larger than this almost certainly isn't a camera photo. */
const MAX_BYTES = 25 * 1024 * 1024;

/** Downscale one image file to a JPEG data URL. */
export function readImage(file: File): Promise<string> {
  return new Promise((resolve, reject) => {
    if (!file.type.startsWith("image/")) return reject(new Error(`${file.name} isn't an image`));
    if (file.size > MAX_BYTES) return reject(new Error(`${file.name} is too large`));
    const url = URL.createObjectURL(file);
    const img = new Image();
    img.onload = () => {
      URL.revokeObjectURL(url);
      const scale = Math.min(1, MAX_EDGE / Math.max(img.width, img.height));
      const canvas = document.createElement("canvas");
      canvas.width = Math.round(img.width * scale);
      canvas.height = Math.round(img.height * scale);
      const ctx = canvas.getContext("2d");
      if (!ctx) return reject(new Error("Could not process the image"));
      ctx.drawImage(img, 0, 0, canvas.width, canvas.height);
      resolve(canvas.toDataURL("image/jpeg", QUALITY));
    };
    img.onerror = () => {
      URL.revokeObjectURL(url);
      // HEIC from an iPhone can land here — Safari decodes it, other browsers don't.
      reject(new Error(`Couldn't read ${file.name}. Try a JPEG or PNG.`));
    };
    img.src = url;
  });
}

export async function readImages(files: FileList | File[]): Promise<{ urls: string[]; errors: string[] }> {
  const urls: string[] = [];
  const errors: string[] = [];
  for (const file of Array.from(files)) {
    try {
      urls.push(await readImage(file));
    } catch (e) {
      errors.push(e instanceof Error ? e.message : "Couldn't read that file");
    }
  }
  return { urls, errors };
}

type Props = {
  value: string[];
  onChange: (next: string[]) => void;
  max?: number;
  label?: string;
};

export function PhotoPicker({ value, onChange, max = 6, label = "Photos" }: Props) {
  const cameraRef = useRef<HTMLInputElement>(null);
  const libraryRef = useRef<HTMLInputElement>(null);
  const [error, setError] = useState<string | null>(null);
  const [busy, setBusy] = useState(false);
  const id = useId();
  const full = value.length >= max;

  const take = async (files: FileList | null) => {
    if (!files || files.length === 0) return;
    setBusy(true);
    setError(null);
    const { urls, errors } = await readImages(files);
    const room = max - value.length;
    if (urls.length > room) errors.push(`Only ${room} more ${room === 1 ? "photo" : "photos"} fit on this entry.`);
    if (urls.length) onChange([...value, ...urls.slice(0, room)]);
    setError(errors[0] ?? null);
    setBusy(false);
  };

  return (
    <div className="mb-4">
      <div className="flex items-baseline justify-between mb-1.5">
        <p id={`${id}-label`} className="text-xs font-mono uppercase tracking-widest text-muted">{label}</p>
        <span className="text-xs text-muted">{value.length} of {max}</span>
      </div>

      {value.length > 0 && (
        <ul className="flex flex-wrap gap-2 mb-2.5">
          {value.map((src, i) => (
            <li key={i} className="relative">
              <img src={src} alt={`Attached photo ${i + 1}`} className="w-20 h-20 object-cover rounded-card border border-line" />
              <button
                type="button"
                onClick={() => onChange(value.filter((_, j) => j !== i))}
                aria-label={`Remove photo ${i + 1}`}
                className="absolute -top-2 -right-2 w-8 h-8 rounded-full bg-brand text-white flex items-center justify-center shadow-md hover:bg-brand-hover focus:outline-none focus-visible:ring-2 focus-visible:ring-offset-2 focus-visible:ring-accent"
              >
                <X size={15} aria-hidden />
              </button>
            </li>
          ))}
        </ul>
      )}

      <div className="flex gap-2">
        {/* capture="environment" opens the camera straight away on a phone or
            tablet; on a desktop the browser falls back to a file picker. */}
        <input ref={cameraRef} type="file" accept="image/*" capture="environment" className="sr-only" onChange={(e) => { take(e.target.files); e.target.value = ""; }} />
        <input ref={libraryRef} type="file" accept="image/*" multiple className="sr-only" onChange={(e) => { take(e.target.files); e.target.value = ""; }} />
        <button
          type="button"
          onClick={() => cameraRef.current?.click()}
          disabled={full || busy}
          className="flex-1 min-h-12 rounded-card border-2 border-line text-brand font-medium flex items-center justify-center gap-2 hover:border-accent disabled:opacity-40 focus:outline-none focus-visible:ring-2 focus-visible:ring-accent transition-colors"
        >
          <Camera size={18} className="text-accent" aria-hidden /> Take photo
        </button>
        <button
          type="button"
          onClick={() => libraryRef.current?.click()}
          disabled={full || busy}
          className="flex-1 min-h-12 rounded-card border-2 border-line text-brand font-medium flex items-center justify-center gap-2 hover:border-accent disabled:opacity-40 focus:outline-none focus-visible:ring-2 focus-visible:ring-accent transition-colors"
        >
          <ImagePlus size={18} className="text-accent" aria-hidden /> Upload
        </button>
      </div>

      <p role="status" className="text-xs mt-1.5 min-h-4">
        {busy && <span className="text-muted">Processing…</span>}
        {!busy && error && <span className="text-danger">{error}</span>}
        {!busy && !error && full && <span className="text-muted">Photo limit reached for this entry.</span>}
      </p>
    </div>
  );
}


// ─── Video ──────────────────────────────────────────────────────
//
// Clips are capped at ten seconds. Recording happens in-app so the cap can be
// enforced exactly — the phone's own camera app can't be told to stop at ten.
// Uploads longer than that are turned away rather than silently trimmed: the
// part that would be cut off can show other people's children, and a trim the
// teacher didn't see is one they didn't approve.

export const MAX_VIDEO_SECONDS = 10;
/** A 10-second phone clip is typically 5–25 MB; this leaves headroom for 4K. */
const MAX_VIDEO_BYTES = 60 * 1024 * 1024;
/** Container rounding — a "10 second" clip often reports 10.03. */
const DURATION_SLACK = 0.5;

const fmtSecs = (s: number) => `0:${String(Math.min(99, Math.round(s))).padStart(2, "0")}`;

/** Duration of a video file, working around Chrome's Infinity-for-WebM quirk. */
function probeDuration(url: string): Promise<number> {
  return new Promise((resolve, reject) => {
    const v = document.createElement("video");
    v.preload = "metadata";
    v.muted = true;
    v.onloadedmetadata = () => {
      if (Number.isFinite(v.duration)) return resolve(v.duration);
      // Recorded WebM has no duration header; seeking past the end forces one.
      v.currentTime = 1e101;
      v.ontimeupdate = () => {
        v.ontimeupdate = null;
        resolve(v.duration);
        v.currentTime = 0;
      };
    };
    v.onerror = () => reject(new Error("This video couldn't be read. Try an MP4 or MOV from your phone's camera."));
    v.src = url;
  });
}

/** A JPEG still from the start of the clip, for feeds and thumbnails. */
function capturePoster(url: string): Promise<string | undefined> {
  return new Promise((resolve) => {
    const v = document.createElement("video");
    v.muted = true;
    v.playsInline = true;
    v.preload = "auto";
    const done = (val?: string) => { v.removeAttribute("src"); v.load(); resolve(val); };
    const timer = window.setTimeout(() => done(undefined), 4000);
    v.onloadeddata = () => { v.currentTime = Math.min(0.2, (v.duration || 1) / 2); };
    v.onseeked = () => {
      window.clearTimeout(timer);
      const scale = Math.min(1, 640 / Math.max(v.videoWidth || 640, v.videoHeight || 360));
      const c = document.createElement("canvas");
      c.width = Math.round((v.videoWidth || 640) * scale);
      c.height = Math.round((v.videoHeight || 360) * scale);
      const ctx = c.getContext("2d");
      if (!ctx) return done(undefined);
      ctx.drawImage(v, 0, 0, c.width, c.height);
      try { done(c.toDataURL("image/jpeg", 0.72)); } catch { done(undefined); }
    };
    v.onerror = () => { window.clearTimeout(timer); done(undefined); };
    v.src = url;
  });
}

/** Validate an uploaded clip and turn it into a VideoClip. */
export async function readVideo(file: File): Promise<VideoClip> {
  if (!file.type.startsWith("video/")) throw new Error(`${file.name} isn't a video.`);
  if (file.size > MAX_VIDEO_BYTES) throw new Error(`${file.name} is too large. Keep clips under ${MAX_VIDEO_SECONDS} seconds.`);
  const url = URL.createObjectURL(file);
  try {
    const duration = await probeDuration(url);
    if (duration > MAX_VIDEO_SECONDS + DURATION_SLACK) {
      throw new Error(`That clip is ${Math.round(duration)} seconds — videos are capped at ${MAX_VIDEO_SECONDS}. Trim it in your phone's Photos app first, or record one here.`);
    }
    const poster = await capturePoster(url);
    return { src: url, poster, duration: Math.min(duration, MAX_VIDEO_SECONDS), mime: file.type };
  } catch (e) {
    URL.revokeObjectURL(url);
    throw e;
  }
}

function pickMime() {
  if (typeof MediaRecorder === "undefined") return null;
  // Safari records MP4; Chrome and Firefox record WebM.
  for (const m of ["video/mp4", "video/webm;codecs=vp9,opus", "video/webm;codecs=vp8,opus", "video/webm"]) {
    if (MediaRecorder.isTypeSupported(m)) return m;
  }
  return "";
}

/** Full-screen recorder that stops itself at ten seconds. */
export function VideoRecorder({ onDone, onClose }: { onDone: (clip: VideoClip) => void; onClose: () => void }) {
  const liveRef = useRef<HTMLVideoElement>(null);
  const streamRef = useRef<MediaStream | null>(null);
  const recRef = useRef<MediaRecorder | null>(null);
  const chunks = useRef<Blob[]>([]);
  const startedAt = useRef(0);
  const stopTimer = useRef<number | null>(null);
  const tick = useRef<number | null>(null);

  const [facing, setFacing] = useState<"environment" | "user">("environment");
  const [sound, setSound] = useState(true);
  const [phase, setPhase] = useState<"starting" | "ready" | "recording" | "review" | "error">("starting");
  const [elapsed, setElapsed] = useState(0);
  const [clipUrl, setClipUrl] = useState<string | null>(null);
  const [clipMime, setClipMime] = useState("video/webm");
  const [error, setError] = useState<string | null>(null);
  const [saving, setSaving] = useState(false);

  const stopStream = () => {
    streamRef.current?.getTracks().forEach((t) => t.stop());
    streamRef.current = null;
  };

  const startStream = useCallback(async () => {
    stopStream();
    setPhase("starting");
    if (pickMime() === null) {
      setError("Recording isn't supported in this browser. Use Upload video instead.");
      setPhase("error");
      return;
    }
    try {
      const stream = await navigator.mediaDevices.getUserMedia({
        video: { facingMode: facing, width: { ideal: 1280 }, height: { ideal: 720 } },
        audio: sound,
      });
      streamRef.current = stream;
      if (liveRef.current) {
        liveRef.current.srcObject = stream;
        await liveRef.current.play().catch(() => undefined);
      }
      setPhase("ready");
    } catch (e) {
      const name = e instanceof DOMException ? e.name : "";
      setError(
        name === "NotAllowedError"
          ? "Camera access was blocked. Allow it in your browser's site settings, or use Upload video instead."
          : name === "NotFoundError"
            ? "No camera found on this device. Use Upload video instead."
            : "The camera couldn't start. Close other apps using it and try again.",
      );
      setPhase("error");
    }
  }, [facing, sound]);

  useEffect(() => {
    if (phase === "review") return;
    startStream();
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [facing, sound]);

  // Release the camera no matter how the recorder closes.
  useEffect(() => () => {
    stopStream();
    if (stopTimer.current) window.clearTimeout(stopTimer.current);
    if (tick.current) window.clearInterval(tick.current);
  }, []);

  useEffect(() => {
    const onKey = (e: KeyboardEvent) => e.key === "Escape" && phase !== "recording" && onClose();
    window.addEventListener("keydown", onKey);
    return () => window.removeEventListener("keydown", onKey);
  }, [phase, onClose]);

  const start = () => {
    const stream = streamRef.current;
    if (!stream) return;
    const mime = pickMime() || undefined;
    const rec = new MediaRecorder(stream, mime ? { mimeType: mime, videoBitsPerSecond: 2_500_000 } : undefined);
    chunks.current = [];
    rec.ondataavailable = (e) => e.data.size && chunks.current.push(e.data);
    rec.onstop = () => {
      if (tick.current) window.clearInterval(tick.current);
      if (stopTimer.current) window.clearTimeout(stopTimer.current);
      const type = rec.mimeType || mime || "video/webm";
      const blob = new Blob(chunks.current, { type });
      setElapsed(Math.min(MAX_VIDEO_SECONDS, (performance.now() - startedAt.current) / 1000));
      setClipMime(type.split(";")[0]);
      setClipUrl(URL.createObjectURL(blob));
      setPhase("review");
      stopStream();
    };
    recRef.current = rec;
    startedAt.current = performance.now();
    setElapsed(0);
    rec.start(250);
    setPhase("recording");
    tick.current = window.setInterval(() => setElapsed((performance.now() - startedAt.current) / 1000), 100);
    // The cap. Nothing a teacher does can make this longer.
    stopTimer.current = window.setTimeout(() => rec.state === "recording" && rec.stop(), MAX_VIDEO_SECONDS * 1000);
  };

  const stop = () => recRef.current?.state === "recording" && recRef.current.stop();

  const retake = () => {
    if (clipUrl) URL.revokeObjectURL(clipUrl);
    setClipUrl(null);
    setElapsed(0);
    startStream();
  };

  const use = async () => {
    if (!clipUrl) return;
    setSaving(true);
    const poster = await capturePoster(clipUrl);
    onDone({ src: clipUrl, poster, duration: Math.max(1, Math.round(elapsed)), mime: clipMime });
    onClose();
  };

  const close = () => {
    if (phase === "recording") return;
    if (clipUrl && !saving) URL.revokeObjectURL(clipUrl);
    onClose();
  };

  const left = Math.max(0, MAX_VIDEO_SECONDS - elapsed);

  return (
    <div className="fixed inset-0 z-[70] bg-black flex flex-col" role="dialog" aria-modal="true" aria-label="Record a video">
      <div className="flex items-center justify-between px-4 py-3 text-white" style={{ paddingTop: "max(0.75rem, env(safe-area-inset-top, 0px))" }}>
        <button onClick={close} disabled={phase === "recording"} aria-label="Close recorder" className="w-11 h-11 rounded-full flex items-center justify-center hover:bg-white/10 disabled:opacity-30 focus:outline-none focus-visible:ring-2 focus-visible:ring-white">
          <X size={22} aria-hidden />
        </button>
        <p className="text-sm font-mono tabular-nums" aria-live="polite">
          {phase === "recording" ? <span className="text-red-400">● {fmtSecs(elapsed)} / 0:{MAX_VIDEO_SECONDS}</span> : phase === "review" ? `${fmtSecs(elapsed)} clip` : `Up to ${MAX_VIDEO_SECONDS} seconds`}
        </p>
        <div className="flex gap-1">
          <button onClick={() => setSound((x) => !x)} disabled={phase === "recording" || phase === "review"} aria-pressed={sound} aria-label={sound ? "Sound on" : "Sound off"} title={sound ? "Sound on" : "Sound off"} className="w-11 h-11 rounded-full flex items-center justify-center hover:bg-white/10 disabled:opacity-30 focus:outline-none focus-visible:ring-2 focus-visible:ring-white">
            {sound ? <Volume2 size={20} aria-hidden /> : <VolumeX size={20} aria-hidden />}
          </button>
          <button onClick={() => setFacing((f) => (f === "environment" ? "user" : "environment"))} disabled={phase === "recording" || phase === "review"} aria-label="Switch camera" title="Switch camera" className="w-11 h-11 rounded-full flex items-center justify-center hover:bg-white/10 disabled:opacity-30 focus:outline-none focus-visible:ring-2 focus-visible:ring-white">
            <RefreshCw size={20} aria-hidden />
          </button>
        </div>
      </div>

      {/* Progress toward the cap */}
      <div className="h-1 bg-white/15 mx-4 rounded-full overflow-hidden" aria-hidden>
        <div className="h-full bg-red-500" style={{ width: `${Math.min(100, (elapsed / MAX_VIDEO_SECONDS) * 100)}%`, transition: phase === "recording" ? "width 100ms linear" : "none" }} />
      </div>

      <div className="flex-1 min-h-0 flex items-center justify-center p-4">
        {phase === "review" && clipUrl ? (
          <video src={clipUrl} controls autoPlay playsInline className="max-h-full max-w-full rounded-xl bg-black" />
        ) : phase === "error" ? (
          <p className="text-white/85 text-center max-w-sm">{error}</p>
        ) : (
          <video ref={liveRef} muted playsInline autoPlay className={`max-h-full max-w-full rounded-xl bg-black ${facing === "user" ? "-scale-x-100" : ""}`} />
        )}
      </div>

      <div className="px-4 pb-6 pt-2 flex items-center justify-center gap-6" style={{ paddingBottom: "max(1.5rem, env(safe-area-inset-bottom, 0px))" }}>
        {phase === "review" ? (
          <>
            <button onClick={retake} className="inline-flex items-center gap-2 text-white font-medium px-5 min-h-12 rounded-full border border-white/40 hover:bg-white/10 focus:outline-none focus-visible:ring-2 focus-visible:ring-white">
              <RotateCcw size={18} aria-hidden /> Retake
            </button>
            <button onClick={use} disabled={saving} className="inline-flex items-center gap-2 text-black font-semibold px-6 min-h-12 rounded-full bg-white hover:bg-white/90 disabled:opacity-60 focus:outline-none focus-visible:ring-2 focus-visible:ring-white focus-visible:ring-offset-2 focus-visible:ring-offset-black">
              Use this clip
            </button>
          </>
        ) : phase === "recording" ? (
          <button onClick={stop} aria-label={`Stop recording, ${Math.ceil(left)} seconds left`} className="w-20 h-20 rounded-full border-4 border-white flex items-center justify-center focus:outline-none focus-visible:ring-4 focus-visible:ring-red-400">
            <Square size={28} className="text-red-500 fill-red-500" aria-hidden />
          </button>
        ) : (
          <button onClick={start} disabled={phase !== "ready"} aria-label="Start recording" className="w-20 h-20 rounded-full border-4 border-white flex items-center justify-center disabled:opacity-40 focus:outline-none focus-visible:ring-4 focus-visible:ring-red-400">
            <Circle size={56} className="text-red-500 fill-red-500" aria-hidden />
          </button>
        )}
      </div>
    </div>
  );
}

/** Thumbnails, Record and Upload — the video half of a log entry. */
export function VideoPicker({ value, onChange, max = 2, label = "Video" }: { value: VideoClip[]; onChange: (next: VideoClip[]) => void; max?: number; label?: string }) {
  const fileRef = useRef<HTMLInputElement>(null);
  const [recording, setRecording] = useState(false);
  const [busy, setBusy] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [playing, setPlaying] = useState<number | null>(null);
  const full = value.length >= max;

  const upload = async (files: FileList | null) => {
    const file = files?.[0];
    if (!file) return;
    setBusy(true);
    setError(null);
    try {
      const clip = await readVideo(file);
      onChange([...value, clip]);
    } catch (e) {
      setError(e instanceof Error ? e.message : "That video couldn't be added.");
    }
    setBusy(false);
  };

  const remove = (i: number) => {
    URL.revokeObjectURL(value[i].src);
    onChange(value.filter((_, j) => j !== i));
    if (playing === i) setPlaying(null);
  };

  return (
    <div className="mb-4">
      <div className="flex items-baseline justify-between mb-1.5">
        <p className="text-xs font-mono uppercase tracking-widest text-muted">{label}</p>
        <span className="text-xs text-muted">{MAX_VIDEO_SECONDS} sec max · {value.length} of {max}</span>
      </div>

      {value.length > 0 && (
        <ul className="flex flex-wrap gap-2 mb-2.5">
          {value.map((v, i) => (
            <li key={v.src} className="relative">
              {playing === i ? (
                <video src={v.src} controls autoPlay playsInline className="w-40 h-28 object-cover rounded-card border border-line bg-black" onEnded={() => setPlaying(null)} />
              ) : (
                <button type="button" onClick={() => setPlaying(i)} aria-label={`Play video ${i + 1}, ${Math.round(v.duration)} seconds`} className="relative block w-28 h-20 rounded-card border border-line overflow-hidden bg-black focus:outline-none focus-visible:ring-2 focus-visible:ring-accent">
                  {v.poster ? <img src={v.poster} alt="" className="w-full h-full object-cover" /> : null}
                  <span className="absolute inset-0 flex items-center justify-center bg-black/25"><Play size={22} className="text-white fill-white" aria-hidden /></span>
                  <span className="absolute bottom-1 right-1 text-[10px] font-mono text-white bg-black/60 px-1 rounded">{fmtSecs(v.duration)}</span>
                </button>
              )}
              <button type="button" onClick={() => remove(i)} aria-label={`Remove video ${i + 1}`} className="absolute -top-2 -right-2 w-8 h-8 rounded-full bg-brand text-white flex items-center justify-center shadow-md hover:bg-brand-hover focus:outline-none focus-visible:ring-2 focus-visible:ring-offset-2 focus-visible:ring-accent">
                <X size={15} aria-hidden />
              </button>
            </li>
          ))}
        </ul>
      )}

      <div className="flex gap-2">
        <input ref={fileRef} type="file" accept="video/*" className="sr-only" tabIndex={-1} aria-hidden onChange={(e) => { upload(e.target.files); e.target.value = ""; }} />
        <button type="button" onClick={() => { setError(null); setRecording(true); }} disabled={full || busy} className="flex-1 min-h-12 rounded-card border-2 border-line text-brand font-medium flex items-center justify-center gap-2 hover:border-accent disabled:opacity-40 focus:outline-none focus-visible:ring-2 focus-visible:ring-accent transition-colors">
          <Video size={18} className="text-accent" aria-hidden /> Record video
        </button>
        <button type="button" onClick={() => fileRef.current?.click()} disabled={full || busy} className="flex-1 min-h-12 rounded-card border-2 border-line text-brand font-medium flex items-center justify-center gap-2 hover:border-accent disabled:opacity-40 focus:outline-none focus-visible:ring-2 focus-visible:ring-accent transition-colors">
          <FileVideo size={18} className="text-accent" aria-hidden /> Upload video
        </button>
      </div>
      <p role="status" className="text-xs mt-1.5 min-h-4">
        {busy && <span className="text-muted">Checking the clip…</span>}
        {!busy && error && <span className="text-danger">{error}</span>}
      </p>

      {recording && <VideoRecorder onClose={() => setRecording(false)} onDone={(clip) => onChange([...value, clip])} />}
    </div>
  );
}

/** Plays a clip in a feed; shows the poster until tapped so feeds stay light. */
export function FeedVideo({ clip, label }: { clip: VideoClip; label: string }) {
  const [on, setOn] = useState(false);
  if (on) return <video src={clip.src} controls autoPlay playsInline poster={clip.poster} className="w-full aspect-[16/10] object-contain bg-black" aria-label={label} />;
  return (
    <button type="button" onClick={() => setOn(true)} aria-label={`Play video: ${label}, ${Math.round(clip.duration)} seconds`} className="relative block w-full aspect-[16/10] bg-black focus:outline-none focus-visible:ring-2 focus-visible:ring-inset focus-visible:ring-accent">
      {clip.poster && <img src={clip.poster} alt="" className="w-full h-full object-cover" />}
      <span className="absolute inset-0 flex items-center justify-center">
        <span className="w-16 h-16 rounded-full bg-black/55 flex items-center justify-center"><Play size={30} className="text-white fill-white ml-1" aria-hidden /></span>
      </span>
      <span className="absolute bottom-2 right-2 text-xs font-mono text-white bg-black/60 px-1.5 py-0.5 rounded">{fmtSecs(clip.duration)}</span>
    </button>
  );
}
