/**
 * Freehand signature pad. Used at check-in/check-out and on incident reports —
 * both are places Florida requires a signature on file.
 *
 * Emits a PNG data URL after each stroke, or null once cleared, so the parent
 * can gate its submit button on having an actual mark.
 */
import { useCallback, useEffect, useRef, useState } from "react";

const cssVar = (name: string, fallback: string) =>
  getComputedStyle(document.documentElement).getPropertyValue(name).trim() || fallback;

type Props = {
  value: string | null;
  onChange: (dataUrl: string | null) => void;
  label?: string;
  /** Accessible hint shown inside the empty pad. */
  placeholder?: string;
  height?: number;
};

export function SignaturePad({
  value,
  onChange,
  label = "Signature",
  placeholder = "Sign here with mouse or finger",
  height = 160,
}: Props) {
  const canvasRef = useRef<HTMLCanvasElement>(null);
  const [drawing, setDrawing] = useState(false);
  const lastPos = useRef<{ x: number; y: number } | null>(null);

  const paintBackground = useCallback(() => {
    const canvas = canvasRef.current;
    const ctx = canvas?.getContext("2d");
    if (!canvas || !ctx) return;
    ctx.fillStyle = cssVar("--t-row-hover", "#f9f8f5");
    ctx.fillRect(0, 0, canvas.width, canvas.height);
    ctx.strokeStyle = cssVar("--t-ink", "#1e2d4e");
    ctx.lineWidth = 2.5;
    ctx.lineCap = "round";
    ctx.lineJoin = "round";
  }, []);

  useEffect(paintBackground, [paintBackground]);

  const getPos = (e: React.MouseEvent | React.TouchEvent, canvas: HTMLCanvasElement) => {
    const rect = canvas.getBoundingClientRect();
    const scaleX = canvas.width / rect.width;
    const scaleY = canvas.height / rect.height;
    const point = "touches" in e ? e.touches[0] : e;
    return { x: (point.clientX - rect.left) * scaleX, y: (point.clientY - rect.top) * scaleY };
  };

  const start = useCallback((e: React.MouseEvent | React.TouchEvent) => {
    e.preventDefault();
    const canvas = canvasRef.current;
    if (!canvas) return;
    setDrawing(true);
    lastPos.current = getPos(e, canvas);
  }, []);

  const move = useCallback(
    (e: React.MouseEvent | React.TouchEvent) => {
      if (!drawing) return;
      e.preventDefault();
      const canvas = canvasRef.current;
      const ctx = canvas?.getContext("2d");
      if (!canvas || !ctx) return;
      const pos = getPos(e, canvas);
      if (lastPos.current) {
        ctx.beginPath();
        ctx.moveTo(lastPos.current.x, lastPos.current.y);
        ctx.lineTo(pos.x, pos.y);
        ctx.stroke();
      }
      lastPos.current = pos;
    },
    [drawing],
  );

  const end = useCallback(() => {
    if (!drawing) return;
    setDrawing(false);
    lastPos.current = null;
    const canvas = canvasRef.current;
    if (canvas) onChange(canvas.toDataURL());
  }, [drawing, onChange]);

  const clear = () => {
    paintBackground();
    onChange(null);
  };

  return (
    <div>
      <div className="flex items-center justify-between mb-1.5">
        <span className="text-xs font-mono uppercase tracking-widest text-muted">
          {label} <span className="text-danger">*</span>
        </span>
        {value && (
          <button type="button" onClick={clear} className="text-xs font-medium text-muted min-h-9 px-2 rounded hover:text-danger focus:outline-none focus-visible:ring-2 focus-visible:ring-accent">
            Clear
          </button>
        )}
      </div>
      <div className="border-2 border-dashed border-line rounded-card overflow-hidden relative">
        <canvas
          ref={canvasRef}
          width={560}
          height={height}
          aria-label={label}
          className="w-full touch-none cursor-crosshair block"
          onMouseDown={start}
          onMouseMove={move}
          onMouseUp={end}
          onMouseLeave={end}
          onTouchStart={start}
          onTouchMove={move}
          onTouchEnd={end}
        />
        {!value && (
          <p className="absolute inset-0 flex items-center justify-center text-xs text-muted pointer-events-none select-none">
            {placeholder}
          </p>
        )}
      </div>
    </div>
  );
}
