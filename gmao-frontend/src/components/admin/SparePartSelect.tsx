import { useEffect, useMemo, useRef, useState } from "react";

import type { SparePart } from "../../types/sparePart";

import "./SparePartSelect.css";

interface SparePartSelectProps {
  spareParts: SparePart[];
  excludedIds: number[];
  onSelect: (sparePart: SparePart) => void;
  placeholder?: string;
}

function formatPrice(sparePart: SparePart): string {
  const amount = sparePart.unitPrice ?? 0;
  const currency = sparePart.currency?.trim();

  return currency ? `${amount} ${currency}` : `${amount}`;
}

function SparePartSelect({
  spareParts,
  excludedIds,
  onSelect,
  placeholder = "Sélectionner une pièce de rechange",
}: SparePartSelectProps) {
  const [query, setQuery] = useState("");
  const [open, setOpen] = useState(false);
  const containerRef = useRef<HTMLDivElement | null>(null);

  useEffect(() => {
    function handleClickOutside(event: MouseEvent): void {
      if (
        containerRef.current &&
        !containerRef.current.contains(event.target as Node)
      ) {
        setOpen(false);
      }
    }

    document.addEventListener("mousedown", handleClickOutside);
    return () =>
      document.removeEventListener("mousedown", handleClickOutside);
  }, []);

  const availableParts = useMemo(
    () => spareParts.filter((part) => !excludedIds.includes(part.id)),
    [spareParts, excludedIds],
  );

  const filteredParts = useMemo(() => {
    const term = query.trim().toLowerCase();

    if (!term) {
      return availableParts;
    }

    return availableParts.filter((part) => {
      const haystack = [part.name, part.code, part.location]
        .filter(Boolean)
        .join(" ")
        .toLowerCase();

      return haystack.includes(term);
    });
  }, [availableParts, query]);

  function handleSelect(part: SparePart): void {
    onSelect(part);
    setQuery("");
    setOpen(false);
  }

  return (
    <div className="spare-part-select" ref={containerRef}>
      <input
        type="text"
        className="spare-part-select-input"
        placeholder={placeholder}
        value={query}
        onFocus={() => setOpen(true)}
        onChange={(e) => {
          setQuery(e.target.value);
          setOpen(true);
        }}
      />

      {open && (
        <div className="spare-part-select-dropdown">
          {filteredParts.length === 0 && (
            <p className="spare-part-select-empty">
              Aucune pièce de rechange trouvée.
            </p>
          )}

          {filteredParts.map((part) => (
            <button
              type="button"
              key={part.id}
              className="spare-part-select-option"
              onClick={() => handleSelect(part)}
            >
              <span className="spare-part-select-name">{part.name}</span>

              <span className="spare-part-select-meta">
                <span>
                  Code&nbsp;: <strong>{part.code || "—"}</strong>
                </span>
                <span>
                  Emplacement&nbsp;: <strong>{part.location || "—"}</strong>
                </span>
                <span>
                  Stock&nbsp;: <strong>{part.quantity}</strong>
                </span>
                <span>
                  Prix unitaire&nbsp;: <strong>{formatPrice(part)}</strong>
                </span>
              </span>
            </button>
          ))}
        </div>
      )}
    </div>
  );
}

export default SparePartSelect;