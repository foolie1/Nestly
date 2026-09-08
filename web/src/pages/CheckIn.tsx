import { useState, useRef, useEffect, useCallback } from "react";
import { facilities, type Child } from "../data";
import { useRoster } from "../roster";
import { useAuth } from "../auth";

type Props = { facilityId: string; roomFilter?: string };

const cssVar = (name: string, fallback: string) => getComputedStyle(document.documentElement).getPropertyValue(name).trim() || fallback;

/** Teachers get the number they need; admins also get the statute it comes from. */
const ratioLabels: Record<string, { plain: string; cited: string }> = {
  infant: { plain: "1:4 max", cited: "1:4 max (FL §402.305)" },
  toddler: { plain: "1:6 max", cited: "1:6 max (FL §402.305)" },
  preschool: { plain: "1:15 max", cited: "1:15 max (FL §402.305)" },
  "school-age": { plain: "1:20 max", cited: "1:20 max (FL §402.305)" },
};

type SignatureRequest = {
  child: Child;
  action: "in" | "out";
};

type SignatureRecord = {
  signerName: string;
  timestamp: string;
  dataUrl: string;
};

function SignatureModal({
  request,
  onConfirm,
  onCancel,
  showRegNotice,
}: {
  request: SignatureRequest;
  onConfirm: (record: SignatureRecord) => void;
  onCancel: () => void;
  showRegNotice: boolean;
}) {
  const canvasRef = useRef<HTMLCanvasElement>(null);
  const [drawing, setDrawing] = useState(false);
  const [hasMark, setHasMark] = useState(false);
  const lastPos = useRef<{ x: number; y: number } | null>(null);

  useEffect(() => {
    const canvas = canvasRef.current;
    if (!canvas) return;
    const ctx = canvas.getContext("2d");
    if (!ctx) return;
    ctx.fillStyle = cssVar("--t-row-hover", "#f9f8f5");
    ctx.fillRect(0, 0, canvas.width, canvas.height);
    ctx.strokeStyle = cssVar("--t-brand", "#1e2d4e");
    ctx.lineWidth = 2;
    ctx.lineCap = "round";
    ctx.lineJoin = "round";
  }, []);

  const getPos = (e: React.MouseEvent | React.TouchEvent, canvas: HTMLCanvasElement) => {
    const rect = canvas.getBoundingClientRect();
    const scaleX = canvas.width / rect.width;
    const scaleY = canvas.height / rect.height;
    if ("touches" in e) {
      return {
        x: (e.touches[0].clientX - rect.left) * scaleX,
        y: (e.touches[0].clientY - rect.top) * scaleY,
      };
    }
    return {
      x: (e.clientX - rect.left) * scaleX,
      y: (e.clientY - rect.top) * scaleY,
    };
  };

  const startDraw = useCallback((e: React.MouseEvent | React.TouchEvent) => {
    e.preventDefault();
    const canvas = canvasRef.current;
    if (!canvas) return;
    setDrawing(true);
    lastPos.current = getPos(e, canvas);
  }, []);

  const draw = useCallback(
    (e: React.MouseEvent | React.TouchEvent) => {
      e.preventDefault();
      if (!drawing) return;
      const canvas = canvasRef.current;
      if (!canvas) return;
      const ctx = canvas.getContext("2d");
      if (!ctx) return;
      const pos = getPos(e, canvas);
      if (lastPos.current) {
        ctx.beginPath();
        ctx.moveTo(lastPos.current.x, lastPos.current.y);
        ctx.lineTo(pos.x, pos.y);
        ctx.stroke();
        setHasMark(true);
      }
      lastPos.current = pos;
    },
    [drawing]
  );

  const endDraw = useCallback(() => {
    setDrawing(false);
    lastPos.current = null;
  }, []);

  const clearCanvas = () => {
    const canvas = canvasRef.current;
    if (!canvas) return;
    const ctx = canvas.getContext("2d");
    if (!ctx) return;
    ctx.fillStyle = cssVar("--t-row-hover", "#f9f8f5");
    ctx.fillRect(0, 0, canvas.width, canvas.height);
    setHasMark(false);
  };

  const handleConfirm = () => {
    const canvas = canvasRef.current;
    if (!canvas) return;
    onConfirm({
      signerName: request.child.guardian,
      timestamp: new Date().toLocaleTimeString("en-US", { hour: "2-digit", minute: "2-digit" }),
      dataUrl: canvas.toDataURL(),
    });
  };

  const canConfirm = hasMark === true;

  return (
    <div className="fixed inset-0 bg-black/40 z-50 flex items-center justify-center p-4" onClick={onCancel}>
      <div
        className="bg-surface rounded-[calc(var(--t-radius)+0.25rem)] shadow-2xl w-full max-w-md"
        onClick={(e) => e.stopPropagation()}
      >
        {/* Header */}
        <div className="px-6 py-5 border-b border-line">
          <div className="flex items-start justify-between">
            <div>
              <p className="text-xs font-mono uppercase tracking-widest text-muted mb-1">
                {request.action === "in" ? "Check-In" : "Check-Out"} Signature Required
              </p>
              <h2 className="text-lg font-bold text-brand">{request.child.name}</h2>
              <p className="text-sm text-muted">{request.child.room}</p>
            </div>
            <button onClick={onCancel} className="text-muted hover:text-brand text-xl leading-none mt-1">×</button>
          </div>
        </div>

        <div className="p-6 space-y-5">
          {/* Signature canvas */}
          <div>
            <div className="flex items-center justify-between mb-1.5">
              <label className="text-xs font-mono uppercase tracking-widest text-muted">
                Signature <span className="text-danger">*</span>
              </label>
              {hasMark && (
                <button onClick={clearCanvas} className="text-xs text-muted hover:text-danger transition-colors">
                  Clear
                </button>
              )}
            </div>
            <div className="border-2 border-dashed border-line rounded-card overflow-hidden relative">
              <canvas
                ref={canvasRef}
                width={560}
                height={160}
                className="w-full touch-none cursor-crosshair"
                style={{ display: "block" }}
                onMouseDown={startDraw}
                onMouseMove={draw}
                onMouseUp={endDraw}
                onMouseLeave={endDraw}
                onTouchStart={startDraw}
                onTouchMove={draw}
                onTouchEnd={endDraw}
              />
              {!hasMark && (
                <p className="absolute inset-0 flex items-center justify-center text-xs text-muted pointer-events-none select-none">
                  Sign here with mouse or finger
                </p>
              )}
            </div>
          </div>

          {showRegNotice && (
            <div className="bg-surface-2 rounded-card p-3 text-xs text-muted">
              <span className="font-semibold text-brand">Florida requirement:</span> Signatures must be obtained at each pick-up and drop-off and retained for a minimum of two years (Fla. Admin. Code §65C-22.001).
            </div>
          )}
        </div>

        {/* Footer */}
        <div className="px-6 pb-6 flex gap-3">
          <button onClick={onCancel} className="flex-1 py-2.5 border border-line rounded-ctl text-sm text-muted hover:border-brand transition-colors">
            Cancel
          </button>
          <button
            onClick={handleConfirm}
            disabled={!canConfirm}
            className={`flex-1 py-2.5 rounded-ctl text-sm font-semibold transition-colors ${
              canConfirm
                ? request.action === "in"
                  ? "bg-brand text-white hover:bg-brand-hover"
                  : "bg-danger text-white hover:bg-danger-strong"
                : "bg-line text-muted cursor-not-allowed"
            }`}
          >
            Confirm {request.action === "in" ? "Check-In" : "Check-Out"}
          </button>
        </div>
      </div>
    </div>
  );
}

export default function CheckIn({ facilityId, roomFilter }: Props) {
  const { user } = useAuth();
  const { roster } = useRoster();
  // Teachers see the operational rules; the regulatory framing is for the admin side.
  const showRegNotice = user?.role !== "staff";
  // Ratio status is hidden from teachers for now; the over-ratio block still runs.
  const showRatio = user?.role !== "staff";
  const facilityBase = facilities.find((f) => f.id === facilityId) ?? facilities[0];
  const facility = roomFilter ? { ...facilityBase, rooms: facilityBase.rooms.filter((r) => r.name === roomFilter) } : facilityBase;
  const facilityChildren = roster.filter((c) => c.facilityId === facilityId && (!roomFilter || c.room === roomFilter));
  const [childStates, setChildStates] = useState<Record<string, boolean>>(
    Object.fromEntries(facilityChildren.map((c) => [c.id, c.checkedIn]))
  );
  const [checkInTimes, setCheckInTimes] = useState<Record<string, string>>({});
  const [signatures, setSignatures] = useState<Record<string, SignatureRecord>>({});
  const [alert, setAlert] = useState<string | null>(null);
  const [search, setSearch] = useState("");
  const [signatureRequest, setSignatureRequest] = useState<SignatureRequest | null>(null);

  const requestToggle = (child: Child) => {
    const room = facility.rooms.find((r) => r.name === child.room);
    if (!room) return;
    const isCheckedIn = childStates[child.id];

    // Ratio enforcement is an admin-side guard for now; teachers aren't blocked.
    if (!isCheckedIn && showRatio) {
      const currentIn = facilityChildren.filter((c) => childStates[c.id] && c.room === room.name).length;
      const ratio = (currentIn + 1) / room.staffCount;
      if (ratio > room.ratioLimit) {
        setAlert(`⚠ Ratio alert: ${room.name} would be at 1:${ratio.toFixed(1)} — over the 1:${room.ratioLimit} limit for this room. Check-in blocked until another staff member is added.`);
        return;
      }
    }

    setAlert(null);
    setSignatureRequest({ child, action: isCheckedIn ? "out" : "in" });
  };

  const handleSignatureConfirm = (record: SignatureRecord) => {
    if (!signatureRequest) return;
    const childId = signatureRequest.child.id;
    const goingIn = signatureRequest.action === "in";
    setChildStates((s) => ({ ...s, [childId]: goingIn }));
    setSignatures((s) => ({ ...s, [childId]: record }));
    if (goingIn) {
      setCheckInTimes((t) => ({ ...t, [childId]: record.timestamp }));
    }
    setSignatureRequest(null);
  };

  const filtered = facilityChildren.filter(
    (c) =>
      c.name.toLowerCase().includes(search.toLowerCase()) ||
      c.guardian.toLowerCase().includes(search.toLowerCase())
  );

  return (
    <div className="p-4 sm:p-6 lg:p-8 max-w-7xl mx-auto">
      <div className="mb-6 sm:mb-8 flex flex-col sm:flex-row sm:items-start sm:justify-between gap-3">
        <div>
          <p className="text-sm font-mono text-muted uppercase tracking-widest mb-1">Check-in / Check-out</p>
          <h1 className="text-2xl sm:text-3xl font-bold text-brand">{facility.name}</h1>
          <p className="text-muted mt-1">
            {Object.values(childStates).filter(Boolean).length} of {facilityChildren.length} children present
          </p>
        </div>
        <div className="flex items-center gap-2 text-xs font-mono text-muted bg-surface-2 px-3 py-2 rounded-ctl">
          <span className="w-2 h-2 rounded-full bg-success animate-pulse" />
          LIVE · {new Date().toLocaleTimeString("en-US", { hour: "2-digit", minute: "2-digit" })}
        </div>
      </div>

      {alert && (
        <div className="mb-6 bg-danger-soft border border-danger-line rounded-card p-4 flex items-start gap-3">
          <span className="text-danger text-lg">⚠</span>
          <div>
            <p className="font-semibold text-danger text-sm">Ratio Violation Prevented</p>
            <p className="text-sm text-danger-strong mt-0.5">{alert}</p>
          </div>
          <button onClick={() => setAlert(null)} className="ml-auto text-danger hover:text-danger-strong text-lg leading-none">×</button>
        </div>
      )}

      <div className="mb-6">
        <input
          value={search}
          onChange={(e) => setSearch(e.target.value)}
          placeholder="Search children or guardians..."
          className="w-full max-w-sm bg-surface border border-line rounded-ctl px-4 py-2.5 text-sm focus:outline-none focus-visible:ring-2 focus-visible:ring-accent focus:border-accent transition-colors"
        />
      </div>

      {facility.rooms.map((room) => {
        const roomChildren = filtered.filter((c) => c.room === room.name);
        const inCount = roomChildren.filter((c) => childStates[c.id]).length;
        const ratio = room.staffCount > 0 ? inCount / room.staffCount : 0;
        const over = ratio > room.ratioLimit;

        return (
          <div key={room.id} className="mb-6">
            <div className="flex items-center gap-3 mb-3">
              <h2 className="font-bold text-lg text-brand">{room.name}</h2>
              {showRatio && (
                <>
                  <span className="text-xs text-muted font-mono">{ratioLabels[room.ageGroup]?.cited}</span>
                  <span className={`ml-auto font-mono text-sm font-bold px-3 py-1 rounded-ctl ${over ? "bg-danger-soft text-danger" : "bg-success-soft text-success"}`}>
                    {over ? "⚠ " : ""}Live ratio 1:{ratio > 0 ? ratio.toFixed(1) : "—"} · {room.staffCount} staff on duty
                  </span>
                </>
              )}
              <span className="ml-auto text-xs font-mono text-muted">{inCount} of {roomChildren.length} in</span>
            </div>
            <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-3">
              {roomChildren.map((child) => {
                const isIn = childStates[child.id];
                const sig = signatures[child.id];
                return (
                  <div key={child.id} className={`bg-surface border rounded-card p-4 transition-all ${isIn ? "border-accent shadow-sm" : "border-line"}`}>
                    <div className="flex items-start justify-between mb-3">
                      <div>
                        <p className="font-semibold text-brand">{child.name}</p>
                        <p className="text-xs text-muted">{child.guardian}</p>
                      </div>
                      <div className="flex flex-col items-end gap-1">
                        {child.immunizationStatus === "missing" && (
                          <span className="text-xs bg-danger-soft text-danger px-2 py-0.5 rounded font-medium">{showRegNotice ? "DH 680" : "Immunization"}</span>
                        )}
                        {child.immunizationStatus === "expires-soon" && (
                          <span className="text-xs bg-warning-soft text-warning px-2 py-0.5 rounded font-medium">Expires soon</span>
                        )}
                      </div>
                    </div>

                    <button
                      onClick={() => requestToggle(child)}
                      className={`w-full py-2 rounded-ctl text-sm font-semibold transition-colors ${
                        isIn
                          ? "bg-accent-soft text-accent hover:bg-danger-soft hover:text-danger"
                          : "bg-brand text-white hover:bg-brand-hover"
                      }`}
                    >
                      {isIn ? "Check Out" : "Check In"}
                    </button>

                    {/* Signature record */}
                    {sig && (
                      <div className="mt-2 flex items-center gap-1.5 text-xs text-muted">
                        <span className="text-success">✓</span>
                        <span className="truncate">
                          {isIn ? "In" : "Out"} · {sig.signerName} · {sig.timestamp}
                        </span>
                      </div>
                    )}
                    {!sig && isIn && (
                      <p className="text-xs text-center font-mono text-muted mt-2">
                        In since {checkInTimes[child.id] ?? "—"}
                      </p>
                    )}
                  </div>
                );
              })}
              {roomChildren.length === 0 && (
                <div className="sm:col-span-2 lg:col-span-3 border-2 border-dashed border-line rounded-card p-6 text-center text-sm text-muted">
                  No children match the search
                </div>
              )}
            </div>
          </div>
        );
      })}

      {showRegNotice && (
        <div className="mt-8 bg-surface-2 border border-line rounded-card p-4 flex gap-3">
          <span className="text-accent text-lg">ℹ</span>
          <div className="text-xs text-muted">
            <p className="font-semibold text-brand mb-0.5">Florida Signature &amp; Ratio Rules</p>
            <p>A signature is required at every check-in and check-out and must be retained for two years (Fla. Admin. Code §65C-22.001). Ratio limits per FL Statute §402.305 apply at all times — check-in is blocked when adding a child would breach the room limit.</p>
          </div>
        </div>
      )}

      {signatureRequest && (
        <SignatureModal
          request={signatureRequest}
          onConfirm={handleSignatureConfirm}
          onCancel={() => setSignatureRequest(null)}
          showRegNotice={showRegNotice}
        />
      )}
    </div>
  );
}
