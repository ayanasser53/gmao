import { useEffect, useMemo, useRef, useState } from "react";
import { Wrench } from "lucide-react";

import type { Equipment } from "../../types/equipment";

import "./SparePartSelect.css";

const BACKEND_URL = "http://localhost:8090";

function getFileUrl(path: string | null): string | null {
  if (!path) {
    return null;
  }

  if (path.startsWith("http://") || path.startsWith("https://")) {
    return path;
  }

  return `${BACKEND_URL}${path.startsWith("/") ? path : `/${path}`}`;
}

interface EquipmentSelectProps {
  equipmentList: Equipment[];
  value: number | "";
  onSelect: (equipment: Equipment) => void;
  placeholder?: string;
}

function EquipmentSelect({
  equipmentList,
  value,
  onSelect,
  placeholder = "Sélectionner un équipement",
}: EquipmentSelectProps) {
  const [query, setQuery] = useState("");
  const [open, setOpen] = useState(false);
  const containerRef = useRef<HTMLDivElement | null>(null);

  const selected = useMemo(
    () => equipmentList.find((item) => item.id === value) ?? null,
    [equipmentList, value],
  );

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

  const filteredEquipment = useMemo(() => {
    const term = query.trim().toLowerCase();

    if (!term) {
      return equipmentList;
    }

    return equipmentList.filter((item) => {
      const haystack = [item.name, item.itemCode, item.costCenterName]
        .filter(Boolean)
        .join(" ")
        .toLowerCase();

      return haystack.includes(term);
    });
  }, [equipmentList, query]);

  function handleSelect(equipment: Equipment): void {
    onSelect(equipment);
    setQuery("");
    setOpen(false);
  }

  return (
    <div className="spare-part-select" ref={containerRef}>
      <input
        type="text"
        className="spare-part-select-input"
        placeholder={placeholder}
        value={open ? query : selected?.name ?? ""}
        onFocus={() => {
          setQuery("");
          setOpen(true);
        }}
        onChange={(e) => {
          setQuery(e.target.value);
          setOpen(true);
        }}
      />

      {open && (
        <div className="spare-part-select-dropdown">
          {filteredEquipment.length === 0 && (
            <p className="spare-part-select-empty">
              Aucun équipement trouvé.
            </p>
          )}

          {filteredEquipment.map((item) => {
            const image = getFileUrl(item.image);

            return (
              <button
                type="button"
                key={item.id}
                className="spare-part-select-option"
                onClick={() => handleSelect(item)}
              >
                <span className="spare-part-select-thumb">
                  {image ? (
                    <img src={image} alt={item.name} />
                  ) : (
                    <Wrench size={15} />
                  )}
                </span>

                <span className="spare-part-select-body">
                  <span className="spare-part-select-name">{item.name}</span>

                  <span className="spare-part-select-meta">
                    <span>
                      Code&nbsp;: <strong>{item.itemCode || "—"}</strong>
                    </span>
                    <span>
                      Centre de coût&nbsp;:{" "}
                      <strong>{item.costCenterName || "—"}</strong>
                    </span>
                  </span>
                </span>
              </button>
            );
          })}
        </div>
      )}
    </div>
  );
}

export default EquipmentSelect;