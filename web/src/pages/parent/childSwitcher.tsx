import { useState } from "react";
import { children } from "../../data";
import { useAuth } from "../../auth";

/** Parent's linked children; remembers selection per session via module state. */
let lastSelected: string | null = null;

export function useSelectedChild(): [string, (id: string) => void] {
  const { user } = useAuth();
  const ids = user?.childIds ?? [];
  const initial = lastSelected && ids.includes(lastSelected) ? lastSelected : ids[0] ?? "c1";
  const [id, setId] = useState(initial);
  return [id, (next) => { lastSelected = next; setId(next); }];
}

export function ChildSwitcher({ value, onChange }: { value: string; onChange: (id: string) => void }) {
  const { user } = useAuth();
  const kids = children.filter((c) => user?.childIds?.includes(c.id));
  if (kids.length < 2) return null;
  return (
    <div className="flex gap-2 mb-4" role="tablist" aria-label="Select child">
      {kids.map((k) => (
        <button
          key={k.id}
          role="tab"
          aria-selected={value === k.id}
          onClick={() => onChange(k.id)}
          className={`px-4 py-2 rounded-full text-sm font-medium min-h-11 focus:outline-none focus-visible:ring-2 focus-visible:ring-[#0f7173] ${value === k.id ? "bg-[#1e2d4e] text-white" : "bg-white border border-[#e2dfd8] text-[#6b6860]"}`}
        >
          {k.name.split(" ")[0]}
        </button>
      ))}
    </div>
  );
}
