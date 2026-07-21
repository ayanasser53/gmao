import {
  ArrowLeft,
  Coins,
  FileText,
  Info,
  PackagePlus,
  Plus,
  Save,
  ShoppingCart,
  Trash2,
  Type,
  Warehouse,
} from "lucide-react";
import { useEffect, useMemo, useState } from "react";
import type { FormEvent } from "react";
import { useNavigate } from "react-router-dom";

import { createPurchaseOrder } from "../../services/purchaseOrderService";
import { getSpareParts } from "../../services/sparePartService";
import { getSuppliers } from "../../services/supplierService";
import type { PurchaseOrderLine } from "../../types/purchaseOrder";
import type { SparePart } from "../../types/sparePart";
import type { Supplier } from "../../types/supplier";

type LineMode = "SPARE_PART" | "FREE_TEXT";

function todayReferenceExample() {
  return `PO-${new Date().getFullYear()}-XXXX`;
}

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

export default function PurchaseOrderCreatePage() {
  const navigate = useNavigate();
  const [suppliers, setSuppliers] = useState<Supplier[]>([]);
  const [spareParts, setSpareParts] = useState<SparePart[]>([]);
  const [reference, setReference] = useState(todayReferenceExample());
  const [supplierId, setSupplierId] = useState("");
  const [expectedDeliveryDate, setExpectedDeliveryDate] = useState("");
  const [notes, setNotes] = useState("");
  const [lineMode, setLineMode] = useState<LineMode>("SPARE_PART");
  const [draftLine, setDraftLine] = useState<PurchaseOrderLine>(() =>
    emptyLine("SPARE_PART"),
  );
  const [lines, setLines] = useState<PurchaseOrderLine[]>([]);
  const [error, setError] = useState("");
  const [submitting, setSubmitting] = useState(false);

  useEffect(() => {
    async function loadData() {
      try {
        const [supplierData, sparePartData] = await Promise.all([
          getSuppliers(),
          getSpareParts(),
        ]);

        setSuppliers(supplierData);
        setSpareParts(sparePartData);
      } catch {
        setError("Impossible de charger les fournisseurs et pièces détachées.");
      }
    }

    void loadData();
  }, []);

  const selectedSupplier = useMemo(
    () => suppliers.find((supplier) => supplier.id === Number(supplierId)) ?? null,
    [supplierId, suppliers],
  );

  const selectedSparePart = useMemo(
    () => spareParts.find((sparePart) => sparePart.id === draftLine.sparePartId) ?? null,
    [draftLine.sparePartId, spareParts],
  );

  const totals = useMemo(() => {
    const quantity = lines.reduce((total, line) => total + line.quantity, 0);
    const subtotal = lines.reduce(
      (total, line) => total + line.quantity * line.unitPrice,
      0,
    );

    return {
      articles: lines.length,
      quantity,
      subtotal,
      total: subtotal,
    };
  }, [lines]);

  function switchMode(mode: LineMode) {
    setLineMode(mode);
    setDraftLine(emptyLine(mode));
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

  function addLine() {
    if (lineMode === "SPARE_PART" && !draftLine.sparePartId) {
      setError("Sélectionnez une pièce détachée.");
      return;
    }

    if (lineMode === "FREE_TEXT" && !draftLine.description.trim()) {
      setError("Saisissez une description de ligne.");
      return;
    }

    if (draftLine.quantity <= 0) {
      setError("La quantité doit être supérieure à 0.");
      return;
    }

    setLines((current) => [
      ...current,
      {
        ...draftLine,
        description: draftLine.description.trim(),
        sparePartName: draftLine.sparePartName || draftLine.description.trim(),
      },
    ]);
    setDraftLine(emptyLine(lineMode));
    setError("");
  }

  async function handleSubmit(event: FormEvent) {
    event.preventDefault();

    if (lines.length === 0) {
      setError("Ajoutez au moins une ligne de commande.");
      return;
    }

    if (!reference.trim()) {
      setError("Saisissez la référence du bon de commande.");
      return;
    }

    try {
      setSubmitting(true);
      setError("");

      await createPurchaseOrder({
        reference,
        supplierId: selectedSupplier?.id ?? null,
        supplierName: selectedSupplier?.name ?? null,
        expectedDeliveryDate: expectedDeliveryDate || null,
        notes,
        lines,
      });

      navigate("/admin/purchase-orders");
    } catch {
      setError("Impossible de créer le bon de commande.");
    } finally {
      setSubmitting(false);
    }
  }

  return (
    <section className="admin-page purchase-create-page">
      <form onSubmit={handleSubmit}>
        <div className="purchase-form-topbar">
          <button
            type="button"
            className="details-back-button"
            onClick={() => navigate("/admin/purchase-orders")}
            aria-label="Retour"
          >
            <ArrowLeft size={22} />
          </button>

          <h1>Créer un bon de commande</h1>
        </div>

        <div className="purchase-form-layout">
          <div className="purchase-form-main">
            <section className="purchase-form-card">
              <header>
                <Warehouse size={20} />
                <h2>Fournisseur</h2>
              </header>

              <label className="measure-form-group">
                <span>Fournisseur</span>
                <select
                  value={supplierId}
                  onChange={(event) => setSupplierId(event.target.value)}
                >
                  <option value="">Rechercher un fournisseur</option>
                  {suppliers.map((supplier) => (
                    <option key={supplier.id} value={supplier.id}>
                      {supplier.name}
                    </option>
                  ))}
                </select>
              </label>
            </section>

            <section className="purchase-form-card">
              <header>
                <FileText size={20} />
                <h2>Informations générales</h2>
              </header>

              <label className="measure-form-group">
                <span>Référence *</span>
                <input
                  type="text"
                  value={reference}
                  onChange={(event) => setReference(event.target.value)}
                  maxLength={50}
                  placeholder={todayReferenceExample()}
                  required
                />
                <small className="purchase-reference-hint">
                  <Info size={15} />
                  Exemple de référence : <strong>{todayReferenceExample()}</strong>
                </small>
              </label>

              <label className="measure-form-group purchase-date-field">
                <span>Date de livraison espérée</span>
                <input
                  type="date"
                  value={expectedDeliveryDate}
                  onChange={(event) => setExpectedDeliveryDate(event.target.value)}
                />
              </label>
            </section>

            <section className="purchase-form-card">
              <header>
                <FileText size={20} />
                <h2>Détails supplémentaires</h2>
              </header>

              <label className="measure-form-group">
                <span>Notes</span>
                <textarea
                  value={notes}
                  onChange={(event) => setNotes(event.target.value)}
                  maxLength={2000}
                  placeholder="Ex : instructions de livraison, conditions particulières..."
                />
                <small>{notes.length} / 2000</small>
              </label>
            </section>

            <section className="purchase-form-card">
              <header className="purchase-lines-header">
                <span>
                  <ShoppingCart size={20} />
                  <h2>Lignes de commande</h2>
                </span>

                <button
                  type="button"
                  className="resource-primary-button"
                  onClick={addLine}
                >
                  <Plus size={17} />
                  Ajouter une ligne
                </button>
              </header>

              <div className="purchase-line-mode">
                <button
                  type="button"
                  className={lineMode === "SPARE_PART" ? "active" : ""}
                  onClick={() => switchMode("SPARE_PART")}
                >
                  <PackagePlus size={22} />
                  Sélection d'une pièce détachée
                </button>

                <button
                  type="button"
                  className={lineMode === "FREE_TEXT" ? "active" : ""}
                  onClick={() => switchMode("FREE_TEXT")}
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
                    {spareParts.map((sparePart) => (
                      <option key={sparePart.id} value={sparePart.id}>
                        {sparePart.name}
                      </option>
                    ))}
                  </select>
                </label>
              ) : (
                <label className="measure-form-group">
                  <span>Description *</span>
                  <input
                    value={draftLine.description}
                    onChange={(event) =>
                      setDraftLine((current) => ({
                        ...current,
                        description: event.target.value,
                      }))
                    }
                    placeholder="Ex : prestation de contrôle"
                  />
                </label>
              )}

              <div className="equipment-form-grid">
                <label className="measure-form-group">
                  <span>Quantité</span>
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
                  <Coins size={18} />
                  <span>
                    Stock actuel : {selectedSparePart.quantity} · Prix catalogue :{" "}
                    {formatCurrency(selectedSparePart.unitPrice)}
                  </span>
                </div>
              )}

              {lines.length > 0 && (
                <div className="purchase-lines-list">
                  {lines.map((line) => (
                    <article key={line.id}>
                      <div>
                        <strong>{line.sparePartName || line.description}</strong>
                        <span>
                          {line.quantity} x {formatCurrency(line.unitPrice)}
                        </span>
                      </div>
                      <strong>{formatCurrency(line.quantity * line.unitPrice)}</strong>
                      <button
                        type="button"
                        onClick={() =>
                          setLines((current) =>
                            current.filter((item) => item.id !== line.id),
                          )
                        }
                        aria-label="Supprimer la ligne"
                      >
                        <Trash2 size={17} />
                      </button>
                    </article>
                  ))}
                </div>
              )}
            </section>
          </div>

          <aside className="purchase-summary-card">
            <h2>Récapitulatif</h2>

            <div>
              <span>Articles</span>
              <strong>{totals.articles}</strong>
            </div>
            <div>
              <span>Quantité totale</span>
              <strong>{totals.quantity} unité</strong>
            </div>
            <div>
              <span>Sous-total</span>
              <strong>{formatCurrency(totals.subtotal)}</strong>
            </div>
            <div className="purchase-summary-total">
              <span>Total TTC</span>
              <strong>{formatCurrency(totals.total)}</strong>
            </div>

            {error && (
              <div className="purchase-missing-fields">
                <strong>Champs manquants</strong>
                <span>{error}</span>
              </div>
            )}
          </aside>
        </div>

        <div className="purchase-form-footer">
          <button
            type="button"
            className="equipment-cancel-button"
            onClick={() => navigate("/admin/purchase-orders")}
            disabled={submitting}
          >
            Annuler
          </button>

          <button
            type="submit"
            className="equipment-primary-button"
            disabled={submitting || !reference.trim() || lines.length === 0}
          >
            <Save size={18} />
            Créer un bon de commande
          </button>
        </div>
      </form>
    </section>
  );
}
