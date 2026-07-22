import {
  ArrowLeft,
  Building2,
  CalendarClock,
  Check,
  Clock,
  FileDown,
  FileText,
  HelpCircle,
  History,
  MapPin,
  MoreVertical,
  PackageCheck,
  Pencil,
  Plus,
  Save,
  Search,
  Settings,
  Tag,
  Trash2,
  Type,
} from "lucide-react";
import { useEffect, useMemo, useState } from "react";
import { useNavigate, useParams, useSearchParams } from "react-router-dom";

import {
  getPurchaseOrderById,
  updatePurchaseOrder,
  updatePurchaseOrderStatus,
} from "../../services/purchaseOrderService";
import { getSpareParts } from "../../services/sparePartService";
import { getSuppliers } from "../../services/supplierService";
import type {
  PurchaseOrder,
  PurchaseOrderLine,
  PurchaseOrderStatus,
} from "../../types/purchaseOrder";
import type { SparePart } from "../../types/sparePart";
import type { Supplier } from "../../types/supplier";

type LineMode = "SPARE_PART" | "FREE_TEXT";

type PurchaseAddress = {
  id: string;
  label: string;
  companyName: string;
  phone: string;
  address: string;
  apartment: string;
  postalCode: string;
  city: string;
  state: string;
  country: string;
  defaultBilling: boolean;
  defaultDelivery: boolean;
};

const ADDRESS_BOOK_STORAGE_KEY = "gmao_purchase_address_book";

function emptyAddress(): PurchaseAddress {
  return {
    id: crypto.randomUUID(),
    label: "",
    companyName: "",
    phone: "+33",
    address: "",
    apartment: "",
    postalCode: "",
    city: "",
    state: "",
    country: "",
    defaultBilling: false,
    defaultDelivery: false,
  };
}

function readAddressBook(): PurchaseAddress[] {
  const rawValue = localStorage.getItem(ADDRESS_BOOK_STORAGE_KEY);

  if (!rawValue) return [];

  try {
    return JSON.parse(rawValue) as PurchaseAddress[];
  } catch {
    return [];
  }
}

function writeAddressBook(addresses: PurchaseAddress[]) {
  localStorage.setItem(ADDRESS_BOOK_STORAGE_KEY, JSON.stringify(addresses));
}

const STATUS_LABELS: Record<Exclude<PurchaseOrderStatus, "ALL">, string> = {
  DRAFT: "Brouillon",
  CONFIRMED: "Confirmé",
  IN_PROGRESS: "En cours",
  DONE: "Terminé",
  CANCELLED: "Annulé",
  ARCHIVED: "Archivé",
};

const STATUS_CLASS_NAMES: Record<Exclude<PurchaseOrderStatus, "ALL">, string> = {
  DRAFT: "draft",
  CONFIRMED: "confirmed",
  IN_PROGRESS: "progress",
  DONE: "done",
  CANCELLED: "cancelled",
  ARCHIVED: "cancelled",
};

function emptyLine(mode: LineMode): PurchaseOrderLine {
  return {
    id: crypto.randomUUID(),
    type: mode,
    sparePartId: null,
    sparePartName: "",
    description: "",
    quantity: 1,
    unitPrice: 0,
    currency: "EUR",
  };
}

function formatCurrency(value: number) {
  return new Intl.NumberFormat("fr-FR", {
    style: "currency",
    currency: "EUR",
  }).format(value);
}

function relativeDate(value: string) {
  const days = Math.max(
    0,
    Math.floor((Date.now() - new Date(value).getTime()) / 86_400_000),
  );

  if (days === 0) return "aujourd'hui";
  if (days === 1) return "il y a 1 jour";
  return `il y a ${days} jours`;
}

function formatHistoryDate(value: string) {
  return new Intl.DateTimeFormat("fr-FR", {
    day: "2-digit",
    month: "2-digit",
    year: "numeric",
    hour: "2-digit",
    minute: "2-digit",
  }).format(new Date(value));
}

function orderTotal(order: PurchaseOrder) {
  return order.lines.reduce(
    (total, line) => total + line.quantity * line.unitPrice,
    0,
  );
}

function toIsoDate(value: Date) {
  const year = value.getFullYear();
  const month = String(value.getMonth() + 1).padStart(2, "0");
  const day = String(value.getDate()).padStart(2, "0");

  return `${year}-${month}-${day}`;
}

function formatMonthTitle(value: Date) {
  return new Intl.DateTimeFormat("fr-FR", {
    month: "long",
    year: "numeric",
  }).format(value);
}

function toPdfHex(value: string) {
  return Array.from(`\uFEFF${value}`)
    .map((char) => char.charCodeAt(0).toString(16).padStart(4, "0"))
    .join("")
    .toUpperCase();
}

function buildCalendarDays(monthDate: Date) {
  const firstDay = new Date(monthDate.getFullYear(), monthDate.getMonth(), 1);
  const mondayOffset = (firstDay.getDay() + 6) % 7;
  const start = new Date(firstDay);
  start.setDate(firstDay.getDate() - mondayOffset);

  return Array.from({ length: 42 }, (_, index) => {
    const date = new Date(start);
    date.setDate(start.getDate() + index);
    return date;
  });
}

export default function PurchaseOrderDetailsPage() {
  const { id } = useParams();
  const navigate = useNavigate();
  const [searchParams, setSearchParams] = useSearchParams();
  const panel = searchParams.get("panel");
  const lineId = searchParams.get("lineId");

  const [order, setOrder] = useState<PurchaseOrder | null>(null);
  const [spareParts, setSpareParts] = useState<SparePart[]>([]);
  const [suppliers, setSuppliers] = useState<Supplier[]>([]);
  const [error, setError] = useState("");
  const [lineMode, setLineMode] = useState<LineMode>("SPARE_PART");
  const [draftLine, setDraftLine] = useState<PurchaseOrderLine>(() =>
    emptyLine("SPARE_PART"),
  );
  const [supplierReferenceSupplier, setSupplierReferenceSupplier] = useState("");
  const [supplierReferenceCode, setSupplierReferenceCode] = useState("");
  const [supplierReferenceError, setSupplierReferenceError] = useState(false);
  const [showSupplierReferenceForm, setShowSupplierReferenceForm] = useState(false);
  const [editReference, setEditReference] = useState("");
  const [supplierDraftId, setSupplierDraftId] = useState("");
  const [activeTab, setActiveTab] = useState<"details" | "history">("details");
  const [isEditingNotes, setIsEditingNotes] = useState(false);
  const [notesDraft, setNotesDraft] = useState("");
  const [addressBook, setAddressBook] = useState<PurchaseAddress[]>(() =>
    readAddressBook(),
  );
  const [selectedAddressId, setSelectedAddressId] = useState("");
  const [addressSearch, setAddressSearch] = useState("");
  const [addressDraft, setAddressDraft] = useState<PurchaseAddress>(() =>
    emptyAddress(),
  );
  const [addressError, setAddressError] = useState(false);
  const [datePickerOpen, setDatePickerOpen] = useState(false);
  const [calendarMonth, setCalendarMonth] = useState(() => new Date());
  const [taxes, setTaxes] = useState(0);
  const [deliveryFees, setDeliveryFees] = useState(0);
  const [otherFees, setOtherFees] = useState(0);
  const [sameAddress, setSameAddress] = useState(true);

  useEffect(() => {
    async function loadData() {
      if (!id) return;

      try {
        const [orderData, sparePartData, supplierData] = await Promise.all([
          getPurchaseOrderById(id),
          getSpareParts(),
          getSuppliers(),
        ]);

        setOrder(orderData);
        setSpareParts(sparePartData);
        setSuppliers(supplierData);
        setEditReference(orderData.reference);
        setNotesDraft(orderData.notes);
        setSupplierDraftId(orderData.supplierId ? String(orderData.supplierId) : "");
        setCalendarMonth(
          orderData.expectedDeliveryDate
            ? new Date(`${orderData.expectedDeliveryDate}T00:00:00`)
            : new Date(),
        );
      } catch {
        setError("Impossible de charger le bon de commande.");
      }
    }

    void loadData();
  }, [id]);

  const editedLine = useMemo(() => {
    return order?.lines.find((line) => line.id === lineId) ?? null;
  }, [lineId, order?.lines]);

  useEffect(() => {
    if (panel === "edit-line" && editedLine) {
      setDraftLine(editedLine);
      setLineMode(editedLine.type);
    }

    if (panel === "add-line") {
      setDraftLine(emptyLine("SPARE_PART"));
      setLineMode("SPARE_PART");
      setSupplierReferenceSupplier("");
      setSupplierReferenceCode("");
      setSupplierReferenceError(false);
      setShowSupplierReferenceForm(false);
    }

    if (panel === "supplier" && order) {
      setSupplierDraftId(order.supplierId ? String(order.supplierId) : "");
    }
  }, [editedLine, order, panel]);

  const selectedSparePart = useMemo(
    () => spareParts.find((part) => part.id === draftLine.sparePartId) ?? null,
    [draftLine.sparePartId, spareParts],
  );

  const filteredAddresses = useMemo(() => {
    const query = addressSearch.trim().toLowerCase();

    if (!query) return addressBook;

    return addressBook.filter((address) =>
      [
        address.label,
        address.companyName,
        address.address,
        address.city,
        address.country,
      ]
        .join(" ")
        .toLowerCase()
        .includes(query),
    );
  }, [addressBook, addressSearch]);

  if (!order) {
    return (
      <section className="admin-page">
        <div className="resource-loading">{error || "Chargement..."}</div>
      </section>
    );
  }

  function closePanel() {
    setSearchParams({});
  }

  async function refresh(updatedOrder: PurchaseOrder) {
    setOrder(updatedOrder);
  }

  async function confirmOrder() {
    const updatedOrder = await updatePurchaseOrderStatus(order.id, "CONFIRMED");
    await refresh(updatedOrder);
  }

  async function registerReception() {
    const updatedOrder = await updatePurchaseOrderStatus(order.id, "IN_PROGRESS");
    await refresh(updatedOrder);
  }

  async function finishOrder() {
    const updatedOrder = await updatePurchaseOrderStatus(order.id, "DONE");
    await refresh(updatedOrder);
  }

  async function saveGeneralInfo() {
    const updatedOrder = await updatePurchaseOrder(order.id, {
      reference: editReference.trim() || order.reference,
    });
    await refresh(updatedOrder);
    setSupplierReferenceSupplier("");
    setSupplierReferenceCode("");
    setSupplierReferenceError(false);
    closePanel();
  }

  async function saveSupplier() {
    const selectedSupplier =
      suppliers.find((supplier) => supplier.id === Number(supplierDraftId)) ?? null;
    const updatedOrder = await updatePurchaseOrder(order.id, {
      supplierId: selectedSupplier?.id ?? null,
      supplierName: selectedSupplier?.name ?? null,
    });

    await refresh(updatedOrder);
    closePanel();
  }

  async function saveExpectedDeliveryDate(value: Date) {
    const updatedOrder = await updatePurchaseOrder(order.id, {
      expectedDeliveryDate: toIsoDate(value),
    });

    await refresh(updatedOrder);
    setDatePickerOpen(false);
    setCalendarMonth(value);
  }

  async function saveNotes() {
    const updatedOrder = await updatePurchaseOrder(order.id, {
      notes: notesDraft.trim(),
    });

    await refresh(updatedOrder);
    setIsEditingNotes(false);
  }

  function cancelNotesEdition() {
    setNotesDraft(order.notes);
    setIsEditingNotes(false);
  }

  function updateAddressDraft<Key extends keyof PurchaseAddress>(
    key: Key,
    value: PurchaseAddress[Key],
  ) {
    setAddressDraft((current) => ({
      ...current,
      [key]: value,
    }));
  }

  function saveAddress() {
    if (
      !addressDraft.label.trim() ||
      !addressDraft.companyName.trim() ||
      !addressDraft.address.trim() ||
      !addressDraft.postalCode.trim() ||
      !addressDraft.city.trim() ||
      !addressDraft.country.trim()
    ) {
      setAddressError(true);
      return;
    }

    const normalizedAddress = {
      ...addressDraft,
      label: addressDraft.label.trim(),
      companyName: addressDraft.companyName.trim(),
      address: addressDraft.address.trim(),
      postalCode: addressDraft.postalCode.trim(),
      city: addressDraft.city.trim(),
      country: addressDraft.country.trim(),
    };
    const nextAddressBook = [normalizedAddress, ...addressBook];

    setAddressBook(nextAddressBook);
    writeAddressBook(nextAddressBook);
    setSelectedAddressId(normalizedAddress.id);
    setAddressDraft(emptyAddress());
    setAddressError(false);
    setSearchParams({ panel: "address-select" });
  }

  function downloadPurchaseOrderFile() {
    const pageWidth = 595;
    const blue = "0.086 0.518 0.761";
    const dark = "0.063 0.157 0.271";
    const gray = "0.32 0.38 0.45";
    const commands: string[] = [];
    const total = orderTotal(order);

    function text(value: string, x: number, y: number, size = 11, color = dark) {
      commands.push(`BT ${color} rg /F1 ${size} Tf ${x} ${y} Td <${toPdfHex(value)}> Tj ET`);
    }

    function rect(
      x: number,
      y: number,
      width: number,
      height: number,
      color: string,
      fill = false,
    ) {
      commands.push(`${color} ${fill ? "rg" : "RG"} ${x} ${y} ${width} ${height} re ${fill ? "f" : "S"}`);
    }

    rect(0, 0, pageWidth, 842, "1 1 1", true);
    text("SNOP API", 52, 765, 16, blue);
    text("Le numéro suivant doit apparaître sur toute correspondance,", 52, 715, 9, gray);
    text("document d'expédition et facture.", 52, 702, 9, gray);
    text(`N° de commande: ${order.reference}`, 52, 678, 11, dark);
    text("Bon de", 418, 755, 26, blue);
    text("commande", 396, 727, 26, blue);

    rect(52, 610, 491, 24, blue, true);
    text("Notes", 60, 617, 12, "1 1 1");
    rect(52, 584, 491, 26, blue);
    text(order.notes || "-", 60, 592, 11, dark);

    const tableTop = 548;
    const rowHeight = 42;
    const columns = [
      { label: "Quantité", x: 52, width: 62 },
      { label: "Spare Part", x: 114, width: 128 },
      { label: "Référence", x: 242, width: 100 },
      { label: "Réf. fournisseur", x: 342, width: 95 },
      { label: "Prix unitaire", x: 437, width: 58 },
      { label: "Total", x: 495, width: 48 },
    ];

    rect(52, tableTop, 491, 32, blue, true);
    columns.forEach((column) => text(column.label, column.x + 5, tableTop + 11, 10, "1 1 1"));

    order.lines.forEach((line, index) => {
      const y = tableTop - rowHeight * (index + 1);
      const reference = line.sparePartId
        ? `MM-${String(line.sparePartId).padStart(8, "0")}`
        : "-";

      columns.forEach((column) => rect(column.x, y, column.width, rowHeight, blue));
      text(String(line.quantity), 60, y + 17, 11);
      text(line.sparePartName || line.description, 120, y + 17, 10);
      text(reference, 248, y + 17, 10);
      text("-", 348, y + 17, 11);
      text(formatCurrency(line.unitPrice), 443, y + 17, 10);
      text(formatCurrency(line.quantity * line.unitPrice), 500, y + 17, 10);
    });

    const totalsY = tableTop - rowHeight * order.lines.length - 42;
    text("Sous-total", 350, totalsY + 20, 12, gray);
    text(formatCurrency(total), 465, totalsY + 20, 12, gray);
    rect(350, totalsY - 25, 95, 34, blue);
    rect(458, totalsY - 25, 85, 34, blue);
    text("Total", 360, totalsY - 3, 15, dark);
    text(formatCurrency(total), 468, totalsY - 3, 15, blue);

    rect(52, 88, 491, 1, "0.85 0.89 0.93", true);
    text(order.reference, 52, 62, 13, dark);
    text(`Date d'ajout : ${formatHistoryDate(order.createdAt)}`, 52, 42, 10, gray);

    const content = commands.join("\n");
    const objects = [
      "<< /Type /Catalog /Pages 2 0 R >>",
      "<< /Type /Pages /Kids [3 0 R] /Count 1 >>",
      "<< /Type /Page /Parent 2 0 R /MediaBox [0 0 595 842] /Resources << /Font << /F1 4 0 R >> >> /Contents 5 0 R >>",
      "<< /Type /Font /Subtype /Type1 /BaseFont /Helvetica >>",
      `<< /Length ${content.length} >>\nstream\n${content}\nendstream`,
    ];
    let pdf = "%PDF-1.4\n";
    const offsets = [0];

    objects.forEach((object, index) => {
      offsets.push(pdf.length);
      pdf += `${index + 1} 0 obj\n${object}\nendobj\n`;
    });

    const xrefOffset = pdf.length;
    pdf += `xref\n0 ${objects.length + 1}\n0000000000 65535 f \n`;
    offsets.slice(1).forEach((offset) => {
      pdf += `${String(offset).padStart(10, "0")} 00000 n \n`;
    });
    pdf += `trailer\n<< /Size ${objects.length + 1} /Root 1 0 R >>\nstartxref\n${xrefOffset}\n%%EOF`;

    const blob = new Blob([pdf], { type: "application/pdf" });
    const url = URL.createObjectURL(blob);
    const link = document.createElement("a");

    link.href = url;
    link.download = `${order.reference}.pdf`;
    document.body.appendChild(link);
    link.click();
    link.remove();
    URL.revokeObjectURL(url);
  }

  function selectSparePart(value: string) {
    const sparePart = spareParts.find((item) => item.id === Number(value));

    setDraftLine((current) => ({
      ...current,
      sparePartId: sparePart?.id ?? null,
      sparePartName: sparePart?.name ?? "",
      description: sparePart?.name ?? "",
      unitPrice: sparePart?.unitPrice ?? 0,
      currency: sparePart?.currency || "EUR",
    }));
  }

  async function saveLine() {
    if (lineMode === "SPARE_PART" && !draftLine.sparePartId) {
      setError("Sélectionnez une pièce détachée.");
      return;
    }

    if (lineMode === "FREE_TEXT" && !draftLine.description.trim()) {
      setError("Saisissez une description de ligne.");
      return;
    }

    const normalizedLine = {
      ...draftLine,
      description: draftLine.description.trim(),
      sparePartName: draftLine.sparePartName || draftLine.description.trim(),
    };

    const lines =
      panel === "edit-line"
        ? order.lines.map((line) =>
            line.id === normalizedLine.id ? normalizedLine : line,
          )
        : [...order.lines, normalizedLine];

    const updatedOrder = await updatePurchaseOrder(order.id, { lines });
    await refresh(updatedOrder);
    closePanel();
  }

  function createSupplierReference() {
    if (!supplierReferenceSupplier.trim() || !supplierReferenceCode.trim()) {
      setSupplierReferenceError(true);
      return;
    }

    setSupplierReferenceError(false);
  }

  async function removeLine(lineToRemove: PurchaseOrderLine) {
    const updatedOrder = await updatePurchaseOrder(order.id, {
      lines: order.lines.filter((line) => line.id !== lineToRemove.id),
    });
    await refresh(updatedOrder);
  }

  const receivedQuantity = order.status === "DONE"
    ? order.lines.reduce((total, line) => total + line.quantity, 0)
    : 0;
  const orderedQuantity = order.lines.reduce((total, line) => total + line.quantity, 0);
  const calendarDays = buildCalendarDays(calendarMonth);
  const selectedDeliveryDate = order.expectedDeliveryDate ?? "";
  const todayDate = toIsoDate(new Date());

  return (
    <section className="admin-page purchase-details-page">
      <div className="purchase-details-topbar">
        <button
          type="button"
          className="details-back-button"
          onClick={() => navigate("/admin/purchase-orders")}
          aria-label="Retour"
        >
          <ArrowLeft size={22} />
        </button>

        <div>
          <h1>{order.reference}</h1>
          <span className={`purchase-status-pill ${STATUS_CLASS_NAMES[order.status]}`}>
            {STATUS_LABELS[order.status]}
          </span>
        </div>

        <div className="purchase-detail-actions">
          {order.status === "DRAFT" ? (
            <>
              <button
                type="button"
                className="resource-secondary-button"
                onClick={() => setSearchParams({ panel: "edit" })}
              >
                <Pencil size={17} />
                Modifier
              </button>
              <button
                type="button"
                className="resource-primary-button"
                onClick={confirmOrder}
              >
                <Check size={17} />
                Confirmer
              </button>
            </>
          ) : (
            <>
              <button
                type="button"
                className="resource-secondary-button"
                onClick={() => setSearchParams({ panel: "preview" })}
              >
                <FileDown size={17} />
                Prévisualiser le bon de commande
              </button>
              <button
                type="button"
                className="resource-primary-button"
                onClick={registerReception}
              >
                <PackageCheck size={17} />
                Enregistrer la réception
              </button>
              <button
                type="button"
                className="resource-primary-button"
                onClick={finishOrder}
              >
                <Check size={17} />
                Terminer
              </button>
            </>
          )}
          <button type="button" className="icon-link-button">
            <MoreVertical size={19} />
          </button>
        </div>
      </div>

      <div className="purchase-detail-tabs">
        <button
          className={activeTab === "details" ? "active" : ""}
          type="button"
          onClick={() => setActiveTab("details")}
        >
          <FileText size={18} />
          Détails
        </button>
        <button
          className={activeTab === "history" ? "active" : ""}
          type="button"
          onClick={() => setActiveTab("history")}
        >
          <History size={18} />
          Historique
        </button>
      </div>

      {activeTab === "details" ? (
        <>
      <section
        className={`purchase-info-grid ${
          order.status !== "DRAFT" ? "purchase-info-grid-confirmed" : ""
        }`}
      >
        {order.status === "DRAFT" && (
          <button
            type="button"
            className="purchase-info-action-card purchase-info-supplier"
            onClick={() => setSearchParams({ panel: "supplier" })}
          >
            <Building2 size={22} />
            <div>
              <span>Fournisseur</span>
              <strong>{order.supplierName || "Aucun fournisseur sélectionné"}</strong>
            </div>
            <Plus size={18} />
          </button>
        )}

        <div className="purchase-date-card-wrapper">
          <button
            type="button"
            className="purchase-info-action-card purchase-info-delivery"
            onClick={() => setDatePickerOpen((current) => !current)}
          >
            <CalendarClock size={22} />
            <div>
              <span>Date de livraison espérée</span>
              <strong>{order.expectedDeliveryDate || "-"}</strong>
            </div>
            <Pencil size={18} />
          </button>

          {datePickerOpen && (
            <div className="purchase-calendar-popover">
              <header>
                <strong>{formatMonthTitle(calendarMonth)}</strong>
                <button
                  type="button"
                  onClick={() =>
                    setCalendarMonth(
                      new Date(
                        calendarMonth.getFullYear(),
                        calendarMonth.getMonth() + 1,
                        1,
                      ),
                    )
                  }
                  aria-label="Mois suivant"
                >
                  ›
                </button>
              </header>
              <div className="purchase-calendar-weekdays">
                {["L", "M", "M", "J", "V", "S", "D"].map((day) => (
                  <span key={day}>{day}</span>
                ))}
              </div>
              <div className="purchase-calendar-days">
                {calendarDays.map((day) => {
                  const isoDate = toIsoDate(day);
                  const isOutsideMonth = day.getMonth() !== calendarMonth.getMonth();

                  return (
                    <button
                      key={isoDate}
                      type="button"
                      className={[
                        isOutsideMonth ? "outside" : "",
                        isoDate === selectedDeliveryDate ? "selected" : "",
                        isoDate === todayDate ? "today" : "",
                      ].join(" ")}
                      onClick={() => saveExpectedDeliveryDate(day)}
                    >
                      {day.getDate()}
                    </button>
                  );
                })}
              </div>
            </div>
          )}
        </div>
        <article className="purchase-info-created">
          <Clock size={22} />
          <div>
            <span>Créé le</span>
            <strong>{relativeDate(order.createdAt)}</strong>
          </div>
        </article>
        <article className="purchase-info-updated">
          <Clock size={22} />
          <div>
            <span>Mis à jour le</span>
            <strong>{relativeDate(order.updatedAt)}</strong>
          </div>
        </article>
      </section>

      <section
        className={`purchase-notes-card ${
          isEditingNotes ? "purchase-notes-card-editing" : ""
        }`}
      >
        <FileText size={22} />
        <div>
          <span>Notes</span>
          {isEditingNotes ? (
            <>
              <textarea
                value={notesDraft}
                onChange={(event) => setNotesDraft(event.target.value)}
                maxLength={2000}
                placeholder="Ex : instructions de livraison, conditions particulières..."
              />
              <small>{notesDraft.length} / 2000</small>
              <div className="purchase-notes-actions">
                <button
                  type="button"
                  className="resource-cancel-button"
                  onClick={cancelNotesEdition}
                >
                  Annuler
                </button>
                <button
                  type="button"
                  className="resource-primary-button"
                  onClick={saveNotes}
                >
                  Enregistrer
                </button>
              </div>
            </>
          ) : (
            <strong>{order.notes || "Aucune note pour le moment..."}</strong>
          )}
        </div>
        {!isEditingNotes && (
          <button
            type="button"
            className="purchase-notes-edit-button"
            onClick={() => {
              setNotesDraft(order.notes);
              setIsEditingNotes(true);
            }}
            aria-label="Modifier les notes"
          >
            <Pencil size={18} />
          </button>
        )}
      </section>

      <section className="purchase-lines-card">
        <header>
          <div>
            Lignes de commande <strong>{order.lines.length}</strong>
          </div>
          <button
            type="button"
            className="resource-secondary-button"
            onClick={() => setSearchParams({ panel: "add-line" })}
          >
            <Plus size={17} />
            Ajouter une ligne
          </button>
        </header>

        <table className="resource-table">
          <thead>
            <tr>
              <th>Pièce détachée</th>
              <th>Réf. fournisseur</th>
              <th>Statut</th>
              <th>Réception</th>
              <th>Prix unitaire</th>
              <th>Qté commandée</th>
              <th>Total</th>
              <th />
            </tr>
          </thead>
          <tbody>
            {order.lines.map((line) => (
              <tr key={line.id}>
                <td>
                  <div className="purchase-line-main">
                    <strong>{line.sparePartName || line.description}</strong>
                    <span>{line.sparePartId ? `MM-${String(line.sparePartId).padStart(8, "0")}` : "Texte libre"}</span>
                  </div>
                </td>
                <td>-</td>
                <td>
                  <span className="purchase-status-pill waiting">En attente</span>
                </td>
                <td>{order.status === "DONE" ? line.quantity : 0} / {line.quantity}</td>
                <td>{formatCurrency(line.unitPrice)}</td>
                <td>{line.quantity}</td>
                <td>{formatCurrency(line.quantity * line.unitPrice)}</td>
                <td>
                  <div className="table-actions">
                    <button
                      type="button"
                      onClick={() =>
                        setSearchParams({
                          panel: "edit-line",
                          lineId: line.id,
                        })
                      }
                      title="Modifier"
                    >
                      <Pencil size={17} />
                    </button>
                    <button
                      type="button"
                      className="danger-action"
                      onClick={() => removeLine(line)}
                      title="Supprimer"
                    >
                      <Trash2 size={17} />
                    </button>
                  </div>
                </td>
              </tr>
            ))}
          </tbody>
        </table>

        <footer>
          <span>Progression globale</span>
          <strong>{receivedQuantity} / {orderedQuantity}</strong>
          <i />
          <span>Total</span>
          <strong>{formatCurrency(orderTotal(order))}</strong>
        </footer>
      </section>
        </>
      ) : (
        <section className="purchase-history-card">
          <div className="purchase-history-timeline">
            <article className="purchase-history-item">
              <span className="purchase-history-dot">
                <FileText size={14} />
              </span>
              <div>
                <p>
                  <strong>Administrateur</strong> a créé le bon de commande
                </p>
                <span>Référence : {order.reference}</span>
                <time>{formatHistoryDate(order.createdAt)}</time>
              </div>
            </article>

            {order.updatedAt !== order.createdAt && (
              <article className="purchase-history-item">
                <span className="purchase-history-dot">
                  <History size={14} />
                </span>
                <div>
                  <p>
                    <strong>Administrateur</strong> a mis à jour le bon de commande
                  </p>
                  <span>Statut : {STATUS_LABELS[order.status]}</span>
                  <time>{formatHistoryDate(order.updatedAt)}</time>
                </div>
              </article>
            )}
          </div>
        </section>
      )}

      {(panel === "add-line" ||
        panel === "edit-line" ||
        panel === "edit" ||
        panel === "supplier" ||
        panel === "address-select" ||
        panel === "address-add" ||
        panel === "preview") && (
        <div
          className={`purchase-side-panel ${
            panel === "preview" ? "purchase-preview-panel" : ""
          }`}
        >
          <button
            type="button"
            className="purchase-panel-backdrop"
            onClick={closePanel}
            aria-label="Fermer"
          />

          <aside>
            {panel === "preview" ? (
              <>
                <header>
                  <button type="button" onClick={closePanel} aria-label="Retour">
                    <ArrowLeft size={21} />
                  </button>
                  <h2>Prévisualiser le bon de commande</h2>
                </header>

                <section className="purchase-preview-document">
                  <div className="purchase-preview-page">
                    <header>
                      <div>
                        <h3>SNOP API</h3>
                        <p>
                          Le numéro suivant doit apparaître sur toute correspondance,
                          document d'expédition et facture.
                        </p>
                        <strong>N° de commande: {order.reference}</strong>
                      </div>
                      <h2>Bon de<br />commande</h2>
                    </header>

                    <div className="purchase-preview-notes">
                      <strong>Notes</strong>
                      <span>{order.notes || "-"}</span>
                    </div>

                    <table>
                      <thead>
                        <tr>
                          <th>Quantité</th>
                          <th>Spare Part</th>
                          <th>Référence</th>
                          <th>Réf. fournisseur</th>
                          <th>Prix unitaire</th>
                          <th>Total</th>
                        </tr>
                      </thead>
                      <tbody>
                        {order.lines.map((line) => (
                          <tr key={line.id}>
                            <td>{line.quantity}</td>
                            <td>{line.sparePartName || line.description}</td>
                            <td>
                              {line.sparePartId
                                ? `MM-${String(line.sparePartId).padStart(8, "0")}`
                                : "-"}
                            </td>
                            <td>-</td>
                            <td>{formatCurrency(line.unitPrice)}</td>
                            <td>{formatCurrency(line.quantity * line.unitPrice)}</td>
                          </tr>
                        ))}
                      </tbody>
                    </table>

                    <div className="purchase-preview-total">
                      <span>Sous-total</span>
                      <strong>{formatCurrency(orderTotal(order))}</strong>
                      <b>Total</b>
                      <em>{formatCurrency(orderTotal(order))}</em>
                    </div>

                  </div>

                  <footer>
                    <h3>{order.reference}</h3>
                    <span>Date d'ajout : {formatHistoryDate(order.createdAt)}</span>
                    <button
                      type="button"
                      className="resource-secondary-button"
                      onClick={downloadPurchaseOrderFile}
                    >
                      <FileDown size={17} />
                      Télécharger
                    </button>
                  </footer>
                </section>
              </>
            ) : panel === "address-select" ? (
              <>
                <header>
                  <button
                    type="button"
                    onClick={() => setSearchParams({ panel: "edit" })}
                    aria-label="Retour"
                  >
                    <ArrowLeft size={21} />
                  </button>
                  <h2>Sélectionner des éléments</h2>
                </header>

                <section className="purchase-address-select-panel">
                  <div className="purchase-address-help">
                    <HelpCircle size={20} />
                    <span>Recherchez et sélectionnez des éléments.</span>
                  </div>

                  <label className="purchase-address-search">
                    <Search size={17} />
                    <input
                      type="search"
                      value={addressSearch}
                      onChange={(event) => setAddressSearch(event.target.value)}
                      placeholder="Rechercher..."
                    />
                  </label>

                  <div className="purchase-address-list-header">
                    <span>Adresses</span>
                    {filteredAddresses.length === 0 && (
                      <p>Aucune adresse dans le carnet d'adresses.</p>
                    )}
                  </div>

                  {filteredAddresses.length > 0 && (
                    <div className="purchase-address-list">
                      {filteredAddresses.map((address) => (
                        <button
                          key={address.id}
                          type="button"
                          className={selectedAddressId === address.id ? "active" : ""}
                          onClick={() => {
                            setSelectedAddressId(address.id);
                            setSearchParams({ panel: "edit" });
                          }}
                        >
                          <MapPin size={18} />
                          <span>
                            <strong>{address.label}</strong>
                            {address.companyName} · {address.address}, {address.city}
                          </span>
                        </button>
                      ))}
                    </div>
                  )}

                  <button
                    type="button"
                    className="resource-secondary-button purchase-address-add-link"
                    onClick={() => {
                      setAddressDraft(emptyAddress());
                      setAddressError(false);
                      setSearchParams({ panel: "address-add" });
                    }}
                  >
                    <Plus size={18} />
                    network.address_book.action.action.add_address
                  </button>
                </section>
              </>
            ) : panel === "address-add" ? (
              <>
                <header>
                  <button
                    type="button"
                    onClick={() => setSearchParams({ panel: "address-select" })}
                    aria-label="Retour"
                  >
                    <ArrowLeft size={21} />
                  </button>
                  <h2>Ajout d'une adresse</h2>
                </header>

                <section className="purchase-address-form">
                  <h3>Informations générales</h3>

                  <label className={`measure-form-group ${addressError && !addressDraft.label.trim() ? "is-invalid" : ""}`}>
                    <span>Libellé *</span>
                    <input
                      value={addressDraft.label}
                      onChange={(event) => updateAddressDraft("label", event.target.value)}
                      placeholder="Ex : Siège social, Entrepôt"
                    />
                    {addressError && !addressDraft.label.trim() && (
                      <small>Champ obligatoire</small>
                    )}
                  </label>

                  <label className="measure-form-group">
                    <span>Nom de l'entreprise *</span>
                    <input
                      value={addressDraft.companyName}
                      onChange={(event) =>
                        updateAddressDraft("companyName", event.target.value)
                      }
                      placeholder="Ex : Mobility Work"
                    />
                  </label>

                  <label className="measure-form-group purchase-phone-field">
                    <span>Téléphone</span>
                    <input
                      value={addressDraft.phone}
                      onChange={(event) => updateAddressDraft("phone", event.target.value)}
                    />
                  </label>

                  <h3>Localisation géographique</h3>

                  <label className="measure-form-group">
                    <span>Adresse *</span>
                    <input
                      value={addressDraft.address}
                      onChange={(event) =>
                        updateAddressDraft("address", event.target.value)
                      }
                      placeholder="Ex : 10, rue la paix"
                    />
                  </label>

                  <label className="measure-form-group">
                    <span>Appartement, suite, unité, etc.</span>
                    <input
                      value={addressDraft.apartment}
                      onChange={(event) =>
                        updateAddressDraft("apartment", event.target.value)
                      }
                      placeholder="Facultatif"
                    />
                  </label>

                  <div className="equipment-form-grid">
                    <label className="measure-form-group">
                      <span>Code postal *</span>
                      <input
                        value={addressDraft.postalCode}
                        onChange={(event) =>
                          updateAddressDraft("postalCode", event.target.value)
                        }
                        placeholder="Ex : 75001"
                      />
                    </label>
                    <label className="measure-form-group">
                      <span>Ville *</span>
                      <input
                        value={addressDraft.city}
                        onChange={(event) =>
                          updateAddressDraft("city", event.target.value)
                        }
                        placeholder="Ex : Paris"
                      />
                    </label>
                  </div>

                  <div className="equipment-form-grid purchase-address-small-grid">
                    <label className="measure-form-group">
                      <span>État/Province</span>
                      <input
                        value={addressDraft.state}
                        onChange={(event) =>
                          updateAddressDraft("state", event.target.value)
                        }
                        placeholder="Facultatif"
                      />
                    </label>
                    <label className="measure-form-group">
                      <span>Pays *</span>
                      <input
                        value={addressDraft.country}
                        onChange={(event) =>
                          updateAddressDraft("country", event.target.value)
                        }
                        placeholder="Ex : France"
                      />
                    </label>
                  </div>

                  <label className="purchase-checkbox-row">
                    <input
                      type="checkbox"
                      checked={addressDraft.defaultBilling}
                      onChange={(event) =>
                        updateAddressDraft("defaultBilling", event.target.checked)
                      }
                    />
                    <span>Définir comme adresse de facturation par défaut</span>
                  </label>

                  <label className="purchase-checkbox-row">
                    <input
                      type="checkbox"
                      checked={addressDraft.defaultDelivery}
                      onChange={(event) =>
                        updateAddressDraft("defaultDelivery", event.target.checked)
                      }
                    />
                    <span>Définir comme adresse de livraison par défaut</span>
                  </label>
                </section>

                <footer>
                  <button
                    type="button"
                    className="resource-cancel-button"
                    onClick={() => setSearchParams({ panel: "address-select" })}
                  >
                    Annuler
                  </button>
                  <button
                    type="button"
                    className="resource-primary-button"
                    onClick={saveAddress}
                  >
                    Ajouter une adresse
                  </button>
                </footer>
              </>
            ) : panel === "supplier" ? (
              <>
                <header>
                  <button type="button" onClick={closePanel} aria-label="Retour">
                    <ArrowLeft size={21} />
                  </button>
                  <h2>Ajout d'un fournisseur au bon de commande</h2>
                </header>

                <section className="purchase-form-card">
                  <header>
                    <Building2 size={20} />
                    <h2>Fournisseur</h2>
                  </header>

                  <label className="measure-form-group">
                    <span>Fournisseur</span>
                    <select
                      value={supplierDraftId}
                      onChange={(event) => setSupplierDraftId(event.target.value)}
                    >
                      <option value="">Rechercher un fournisseur</option>
                      {suppliers.map((supplier) => (
                        <option key={supplier.id} value={supplier.id}>
                          {supplier.name}
                        </option>
                      ))}
                    </select>
                    <small>
                      Le choix d'un fournisseur permet de réutiliser automatiquement les références fournisseur précédemment définies.
                    </small>
                  </label>

                  <button
                    type="button"
                    className="purchase-create-supplier-link"
                    onClick={() => navigate("/admin/suppliers/create")}
                  >
                    <Plus size={15} />
                    Créer un fournisseur
                  </button>
                </section>

                <footer>
                  <button
                    type="button"
                    className="resource-primary-button"
                    onClick={saveSupplier}
                    disabled={!supplierDraftId}
                  >
                    <Save size={17} />
                    Enregistrer
                  </button>
                </footer>
              </>
            ) : panel === "edit" ? (
              <>
                <header>
                  <button type="button" onClick={closePanel} aria-label="Retour">
                    <ArrowLeft size={21} />
                  </button>
                  <h2>Modification du bon de commande</h2>
                </header>

                <section className="purchase-form-card">
                  <header>
                    <FileText size={20} />
                    <h2>Informations générales</h2>
                  </header>
                  <label className="measure-form-group">
                    <span>Référence *</span>
                    <input
                      value={editReference}
                      maxLength={50}
                      onChange={(event) => setEditReference(event.target.value)}
                    />
                    <small>{editReference.length} / 50</small>
                  </label>
                </section>

                <section className="purchase-edit-section">
                  <h3>Frais supplémentaires</h3>
                  <div className="equipment-form-grid">
                    <label className="measure-form-group">
                      <span>Montant des taxes</span>
                      <input type="number" value={taxes} onChange={(event) => setTaxes(Number(event.target.value))} />
                    </label>
                    <label className="measure-form-group">
                      <span>Frais de livraison</span>
                      <input type="number" value={deliveryFees} onChange={(event) => setDeliveryFees(Number(event.target.value))} />
                    </label>
                    <label className="measure-form-group">
                      <span>Autres frais</span>
                      <input type="number" value={otherFees} onChange={(event) => setOtherFees(Number(event.target.value))} />
                    </label>
                  </div>
                </section>

                <section className="purchase-edit-section">
                  <h3>Adresses</h3>
                  <label className="teams-toggle-row">
                    <input
                      type="checkbox"
                      checked={sameAddress}
                      onChange={(event) => setSameAddress(event.target.checked)}
                    />
                    <span>L'adresse de livraison est identique à l'adresse de facturation</span>
                  </label>
                  <button
                    type="button"
                    className="resource-secondary-button"
                    onClick={() => setSearchParams({ panel: "address-select" })}
                  >
                    Sélectionner
                  </button>
                </section>

                <footer className="purchase-edit-footer">
                  <button
                    type="button"
                    className="resource-primary-button"
                    onClick={saveGeneralInfo}
                  >
                    <Save size={17} />
                    Enregistrer
                  </button>
                </footer>
              </>
            ) : (
              <>
                <header>
                  <button type="button" onClick={closePanel} aria-label="Retour">
                    <ArrowLeft size={21} />
                  </button>
                  <h2>{panel === "add-line" ? "Ajouter une ligne" : "Modification de la ligne"}</h2>
                </header>

                <section className="purchase-form-card purchase-line-entry-card">
                  <header>
                    <Settings size={20} />
                    <h2>
                      {panel === "add-line"
                        ? "Lignes de commande"
                        : "Pièce détachée"}
                    </h2>
                  </header>

                  <div className="purchase-line-mode">
                    <button
                      type="button"
                      className={lineMode === "SPARE_PART" ? "active" : ""}
                      onClick={() => {
                        setLineMode("SPARE_PART");
                        setDraftLine(emptyLine("SPARE_PART"));
                        setSupplierReferenceError(false);
                        setShowSupplierReferenceForm(false);
                      }}
                    >
                      <Settings size={22} />
                      Sélection d'une pièce détachée
                    </button>
                    <button
                      type="button"
                      className={lineMode === "FREE_TEXT" ? "active" : ""}
                      onClick={() => {
                        setLineMode("FREE_TEXT");
                        setDraftLine(emptyLine("FREE_TEXT"));
                        setSupplierReferenceError(false);
                        setShowSupplierReferenceForm(true);
                      }}
                    >
                      <Type size={22} />
                      Saisie de texte libre
                    </button>
                  </div>

                  {lineMode === "SPARE_PART" ? (
                    <label className="measure-form-group">
                      <span>Pièce détachée *</span>
                      <select
                        value={draftLine.sparePartId ?? ""}
                        onChange={(event) => selectSparePart(event.target.value)}
                      >
                        <option value="">Sélectionner une pièce détachée</option>
                        {spareParts.map((part) => (
                          <option key={part.id} value={part.id}>
                            {part.name}
                          </option>
                        ))}
                      </select>
                    </label>
                  ) : (
                    <label className="measure-form-group">
                      <span>Nom *</span>
                      <input
                        value={draftLine.description}
                        onChange={(event) =>
                          setDraftLine((current) => ({
                            ...current,
                            description: event.target.value,
                          }))
                        }
                      />
                    </label>
                  )}

                  <div className="equipment-form-grid">
                    <label className="measure-form-group">
                      <span>Quantité *</span>
                      <input
                        type="number"
                        min={1}
                        value={draftLine.quantity}
                        onChange={(event) =>
                          setDraftLine((current) => ({
                            ...current,
                            quantity: Number(event.target.value),
                          }))
                        }
                      />
                    </label>
                    <label className="measure-form-group">
                      <span>Prix unitaire</span>
                      <input
                        type="number"
                        min={0}
                        step="0.01"
                        value={draftLine.unitPrice}
                        onChange={(event) =>
                          setDraftLine((current) => ({
                            ...current,
                            unitPrice: Number(event.target.value),
                          }))
                        }
                      />
                    </label>
                  </div>

                  {selectedSparePart && (
                    <div className="purchase-reference-box">
                      <Tag size={18} />
                      <span>
                        {selectedSparePart.name} · MM-{String(selectedSparePart.id).padStart(8, "0")}
                      </span>
                    </div>
                  )}

                  <div className="purchase-reference-box purchase-line-total-box">
                    Total : <strong>{formatCurrency(draftLine.quantity * draftLine.unitPrice)}</strong>
                  </div>
                </section>

                <section className="purchase-form-card purchase-supplier-reference-card">
                  <header>
                    <Tag size={20} />
                    <h2>Références fournisseur</h2>
                  </header>
                  {lineMode === "FREE_TEXT" || showSupplierReferenceForm ? (
                    <>
                      <div className="purchase-reference-info">
                        <HelpCircle size={20} />
                        <span>
                          Renseignez la référence fournisseur associée à votre saisie texte ou créez une nouvelle référence fournisseur pour cette saisie.
                        </span>
                      </div>

                      <div className="equipment-form-grid purchase-reference-fields">
                        <label className={`measure-form-group ${supplierReferenceError && !supplierReferenceSupplier.trim() ? "is-invalid" : ""}`}>
                          <span>Fournisseur *</span>
                          <input
                            value={supplierReferenceSupplier}
                            onChange={(event) =>
                              setSupplierReferenceSupplier(event.target.value)
                            }
                            placeholder="Ex : TechniParts Supply"
                          />
                          {supplierReferenceError && !supplierReferenceSupplier.trim() && (
                            <small>Champ obligatoire</small>
                          )}
                        </label>

                        <label className={`measure-form-group ${supplierReferenceError && !supplierReferenceCode.trim() ? "is-invalid" : ""}`}>
                          <span>Référence *</span>
                          <input
                            value={supplierReferenceCode}
                            onChange={(event) =>
                              setSupplierReferenceCode(event.target.value)
                            }
                            placeholder="Ex : BIZ780204"
                          />
                        </label>
                      </div>

                      <div className="purchase-reference-actions">
                      <button
                        type="button"
                        className="resource-cancel-button"
                        onClick={() => {
                          setSupplierReferenceSupplier("");
                          setSupplierReferenceCode("");
                          setSupplierReferenceError(false);
                          setShowSupplierReferenceForm(lineMode === "FREE_TEXT");
                        }}
                      >
                        Annuler
                      </button>
                        <button
                          type="button"
                          className="resource-primary-button"
                          onClick={createSupplierReference}
                        >
                          Créer une nouvelle référence fournisseur
                        </button>
                      </div>
                    </>
                  ) : (
                    <>
                      <p className="purchase-panel-help">
                        Aucune référence fournisseur trouvée pour la pièce détachée.
                      </p>
                      <button
                        type="button"
                        className="resource-secondary-button purchase-panel-secondary"
                        onClick={() => setShowSupplierReferenceForm(true)}
                      >
                        <Plus size={17} />
                        Créer une nouvelle référence fournisseur
                      </button>
                    </>
                  )}
                </section>

                <div className="purchase-line-bottom-actions">
                  <button
                    type="button"
                    className="resource-primary-button"
                    onClick={saveLine}
                  >
                    {panel === "add-line" ? "Ajouter une ligne" : "Modifier la ligne"}
                  </button>
                </div>
              </>
            )}
          </aside>
        </div>
      )}
    </section>
  );
}
