import { useState, useRef, useEffect, useCallback } from "react";
import { facilities, children, Child } from "../data";

type Props = { facilityId: string };

const ratioLabels: Record<string, string> = {
  infant: "1:4 max (FL §402.305)",
  toddler: "1:6 max (FL §402.305)",
  preschool: "1:15 max (FL §402.305)",
  "school-age": "1:20 max (FL §402.305)",
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
}: {
  request: SignatureRequest;
  onConfirm: (record: SignatureRecord) => void;
  onCancel: () => void;
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
    ctx.fillStyle = "#f9f8f5";
    ctx.fillRect(0, 0, canvas.width, canvas.height);
    ctx.strokeStyle = "#1e2d4e";
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
    ctx.fillStyle = "#f9f8f5";
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
        className="bg-white rounded-2xl shadow-2xl w-full max-w-md"
        onClick={(e) => e.stopPropagation()}
      >
        {/* Header */}
        <div className="px-6 py-5 border-b border-[#e2dfd8]">
          <div className="flex items-start justify-between">
            <div>
              <p className="text-xs font-mono uppercase tracking-widest text-[#6b6860] mb-1">
                {request.action === "in" ? "Check-In" : "Check-Out"} Signature Required
              </p>
              <h2 className="text-lg font-bold text-[#1e2d4e]">{request.child.name}</h2>
              <p className="text-sm text-[#6b6860]">{request.child.room}</p>
            </div>
            <button onClick={onCancel} className="text-[#6b6860] hover:text-[#1e2d4e] text-xl leading-none mt-1">×</button>
          </div>
        </div>

        <div className="p-6 space-y-5">
          {/* Signature canvas */}
          <div>
            <div className="flex items-center justify-between mb-1.5">
              <label className="text-xs font-mono uppercase tracking-widest text-[#6b6860]">
                Signature <span className="text-[#dc2626]">*</span>
              </label>
              {hasMark && (
                <button onClick={clearCanvas} className="text-xs text-[#6b6860] hover:text-[#dc2626] transition-colors">
                  Clear
                </button>
              )}
            </div>
            <div className="border-2 border-dashed border-[#e2dfd8] rounded-xl overflow-hidden relative">
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
                <p className="absolute inset-0 flex items-center justify-center text-xs text-[#6b6860] pointer-events-none select-none">
                  Sign here with mouse or finger
                </p>
              )}
            </div>
          </div>

          {/* Florida notice */}
          <div className="bg-[#f3f2ee] rounded-xl p-3 text-xs text-[#6b6860]">
            <span className="font-semibold text-[#1e2d4e]">Florida requirement:</span> Signatures must be obtained at each pick-up and drop-off and retained for a minimum of two years (Fla. Admin. Code §65C-22.001).
          </div>
        </div>

        {/* Footer */}
        <div className="px-6 pb-6 flex gap-3">
          <button onClick={onCancel} className="flex-1 py-2.5 border border-[#e2dfd8] rounded-lg text-sm text-[#6b6860] hover:border-[#1e2d4e] transition-colors">
            Cancel
          </button>
          <button
            onClick={handleConfirm}
            disabled={!canConfirm}
            className={`flex-1 py-2.5 rounded-lg text-sm font-semibold transition-colors ${
              canConfirm
                ? request.action === "in"
                  ? "bg-[#1e2d4e] text-white hover:bg-[#2a3f6b]"
                  : "bg-[#dc2626] text-white hover:bg-[#b91c1c]"
                : "bg-[#e2dfd8] text-[#6b6860] cursor-not-allowed"
            }`}
          >
            Confirm {request.action === "in" ? "Check-In" : "Check-Out"}
          </button>
        </div>
      </div>
    </div>
  );
}

export default function CheckIn({ facilityId }: Props) {
  const facility = facilities.find((f) => f.id === facilityId) ?? facilities[0];
  const facilityChildren = children.filter((c) => c.facilityId === facilityId);
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

    if (!isCheckedIn) {
      const currentIn = facilityChildren.filter((c) => childStates[c.id] && c.room === room.name).length;
      const newCount = currentIn + 1;
      const ratio = newCount / room.staffCount;
      if (ratio > room.ratioLimit) {
        setAlert(`⚠ Ratio alert: ${room.name} would be at 1:${ratio.toFixed(1)} — exceeds Florida limit of 1:${room.ratioLimit}. Check-in blocked until staff is added.`);
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
    <div className="p-8 max-w-7xl mx-auto">
      <div className="mb-8 flex items-start justify-between">
        <div>
          <p className="text-sm font-mono text-[#6b6860] uppercase tracking-widest mb-1">Check-in / Check-out</p>
          <h1 className="text-3xl font-bold text-[#1e2d4e]">{facility.name}</h1>
          <p className="text-[#6b6860] mt-1">
            {Object.values(childStates).filter(Boolean).length} of {facilityChildren.length} children present
          </p>
        </div>
        <div className="flex items-center gap-2 text-xs font-mono text-[#6b6860] bg-[#f3f2ee] px-3 py-2 rounded-lg">
          <span className="w-2 h-2 rounded-full bg-[#16a34a] animate-pulse" />
          LIVE · {new Date().toLocaleTimeString("en-US", { hour: "2-digit", minute: "2-digit" })}
        </div>
      </div>

      {alert && (
        <div className="mb-6 bg-[#fee2e2] border border-[#fca5a5] rounded-xl p-4 flex items-start gap-3">
          <span className="text-[#dc2626] text-lg">⚠</span>
          <div>
            <p className="font-semibold text-[#dc2626] text-sm">Ratio Violation Prevented</p>
            <p className="text-sm text-[#991b1b] mt-0.5">{alert}</p>
          </div>
          <button onClick={() => setAlert(null)} className="ml-auto text-[#dc2626] hover:text-[#991b1b] text-lg leading-none">×</button>
        </div>
      )}

      <div className="mb-6">
        <input
          value={search}
          onChange={(e) => setSearch(e.target.value)}
          placeholder="Search children or guardians..."
          className="w-full max-w-sm bg-white border border-[#e2dfd8] rounded-lg px-4 py-2.5 text-sm focus:outline-none focus:border-[#0f7173] transition-colors"
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
              <h2 className="font-bold text-lg text-[#1e2d4e]">{room.name}</h2>
              <span className="text-xs text-[#6b6860] font-mono">{ratioLabels[room.ageGroup]}</span>
              <span className={`ml-auto font-mono text-sm font-bold px-3 py-1 rounded-lg ${over ? "bg-[#fee2e2] text-[#dc2626]" : "bg-[#dcfce7] text-[#16a34a]"}`}>
                {over ? "⚠ " : ""}Live ratio 1:{ratio > 0 ? ratio.toFixed(1) : "—"} · {room.staffCount} staff on duty
              </span>
            </div>
            <div className="grid grid-cols-3 gap-3">
              {roomChildren.map((child) => {
                const isIn = childStates[child.id];
                const sig = signatures[child.id];
                return (
                  <div key={child.id} className={`bg-white border rounded-xl p-4 transition-all ${isIn ? "border-[#0f7173] shadow-sm" : "border-[#e2dfd8]"}`}>
                    <div className="flex items-start justify-between mb-3">
                      <div>
                        <p className="font-semibold text-[#1e2d4e]">{child.name}</p>
                        <p className="text-xs text-[#6b6860]">{child.guardian}</p>
                      </div>
                      <div className="flex flex-col items-end gap-1">
                        {child.immunizationStatus === "missing" && (
                          <span className="text-xs bg-[#fee2e2] text-[#dc2626] px-2 py-0.5 rounded font-medium">DH 680</span>
                        )}
                        {child.immunizationStatus === "expires-soon" && (
                          <span className="text-xs bg-[#fef3c7] text-[#d97706] px-2 py-0.5 rounded font-medium">Expires soon</span>
                        )}
                      </div>
                    </div>

                    <button
                      onClick={() => requestToggle(child)}
                      className={`w-full py-2 rounded-lg text-sm font-semibold transition-colors ${
                        isIn
                          ? "bg-[#e8f4f4] text-[#0f7173] hover:bg-[#fee2e2] hover:text-[#dc2626]"
                          : "bg-[#1e2d4e] text-white hover:bg-[#2a3f6b]"
                      }`}
                    >
                      {isIn ? "Check Out" : "Check In"}
                    </button>

                    {/* Signature record */}
                    {sig && (
                      <div className="mt-2 flex items-center gap-1.5 text-xs text-[#6b6860]">
                        <span className="text-[#16a34a]">✓</span>
                        <span className="truncate">
                          {isIn ? "In" : "Out"} · {sig.signerName} · {sig.timestamp}
                        </span>
                      </div>
                    )}
                    {!sig && isIn && (
                      <p className="text-xs text-center font-mono text-[#6b6860] mt-2">
                        In since {checkInTimes[child.id] ?? "—"}
                      </p>
                    )}
                  </div>
                );
              })}
              {roomChildren.length === 0 && (
                <div className="col-span-3 border-2 border-dashed border-[#e2dfd8] rounded-xl p-6 text-center text-sm text-[#6b6860]">
                  No children match the search
                </div>
              )}
            </div>
          </div>
        );
      })}

      <div className="mt-8 bg-[#f3f2ee] border border-[#e2dfd8] rounded-xl p-4 flex gap-3">
        <span className="text-[#0f7173] text-lg">ℹ</span>
        <div className="text-xs text-[#6b6860]">
          <p className="font-semibold text-[#1e2d4e] mb-0.5">Florida Signature &amp; Ratio Rules</p>
          <p>A signature is required at every check-in and check-out and must be retained for two years (Fla. Admin. Code §65C-22.001). Ratio limits per FL Statute §402.305 apply at all times — check-in is blocked when adding a child would breach the room limit.</p>
        </div>
      </div>

      {signatureRequest && (
        <SignatureModal
          request={signatureRequest}
          onConfirm={handleSignatureConfirm}
          onCancel={() => setSignatureRequest(null)}
        />
      )}
    </div>
  );
}
