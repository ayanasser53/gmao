import { useEffect, useMemo, useRef, useState } from "react";
import { useNavigate, useParams } from "react-router-dom";
import {
  ArrowLeft,
  CalendarClock,
  Camera,
  CheckCircle2,
  ChevronLeft,
  ChevronRight,
  Clock,
  Coins,
  Download,
  FileText,
  Gauge,
  History,
  MapPin,
  Package,
  Plus,
  Scale,
  Tags,
  Trash2,
  UploadCloud,
  Users,
  Wrench,
  X,
} from "lucide-react";
import type { MaintenancePlan } from "../../types/maintenancePlan";
import {
  getMaintenancePlanById,
  updateMaintenancePlan,
  updateMaintenancePlanStatus,
} from "../../services/maintenancePlanService";
import { getMeasures } from "../../services/measureService";
import { getSpareParts } from "../../services/sparePartService";
import { getAuthenticatedEmail, getAuthenticatedUserId } from "../../services/authService";
import { getUsersDetailed } from "../../services/userService";
import type { Measure } from "../../types/measure";
import type { SparePart } from "../../types/sparePart";
import type { UserDetail } from "../../types/user";

import "./task-styles.css";

const BACKEND_URL = "http://localhost:8090";

function getImageUrl(imagePath?: string | null) {
  if (!imagePath) return null;

  if (
    imagePath.startsWith("http://") ||
    imagePath.startsWith("https://") ||
    imagePath.startsWith("blob:")
  ) {
    return imagePath;
  }

  return `${BACKEND_URL}${imagePath.startsWith("/") ? imagePath : `/${imagePath}`}`;
}

function formatDate(value?: string | null) {
  if (!value) return "-";

  return new Intl.DateTimeFormat("fr-FR", {
    day: "numeric",
    month: "long",
    year: "numeric",
  }).format(new Date(value));
}

function formatDuration(hours: number, minutes: number) {
  if (!hours && !minutes) return "N/A";
  return `${hours}h ${String(minutes).padStart(2, "0")}mn.`;
}

function toInputDate(date: Date) {
  const year = date.getFullYear();
  const month = String(date.getMonth() + 1).padStart(2, "0");
  const day = String(date.getDate()).padStart(2, "0");
  return `${year}-${month}-${day}`;
}

function toInputTime(date: Date) {
  return `${String(date.getHours()).padStart(2, "0")}:${String(
    date.getMinutes(),
  ).padStart(2, "0")}`;
}

type RealizationTab = "counter" | "sparePart" | "additionalCost";

interface RealizationDocument {
  id: string;
  name: string;
  type: string;
  url: string;
}

interface MaintenanceRealizationDraft {
  description: string;
  date: string;
  endTime: string;
  hours: number;
  minutes: number;
  tab: RealizationTab;
  measureId: string;
  measureValue: string;
  measureDate: string;
  measureTime: string;
  sparePartId: string;
  sparePartQuantity: number;
  additionalCost: string;
  additionalCostLabel: string;
  actorId: string;
  actorName: string;
  documents: RealizationDocument[];
}

function getRealizationStorageKey(planId: number) {
  return `maintenance-plan-realization-${planId}`;
}

function getUserDisplayName(user: UserDetail) {
  return `${user.firstName || ""} ${user.lastName || ""}`.trim() || user.email;
}

function isWordDocument(document: RealizationDocument) {
  return (
    document.type === "application/vnd.openxmlformats-officedocument.wordprocessingml.document" ||
    document.name.toLowerCase().endsWith(".docx")
  );
}

function isTextDocument(document: RealizationDocument) {
  return document.type.startsWith("text/") || document.name.toLowerCase().endsWith(".txt");
}

function decodeXmlEntities(value: string) {
  return value
    .replace(/&amp;/g, "&")
    .replace(/&lt;/g, "<")
    .replace(/&gt;/g, ">")
    .replace(/&quot;/g, '"')
    .replace(/&apos;/g, "'");
}

function docxXmlToText(xml: string) {
  return decodeXmlEntities(
    xml
      .replace(/<w:tab\s*\/>/g, "\t")
      .replace(/<\/w:p>/g, "\n")
      .replace(/<[^>]+>/g, "")
      .replace(/\n{3,}/g, "\n\n")
      .trim(),
  );
}

async function inflateZipEntry(data: Uint8Array, compressionMethod: number) {
  if (compressionMethod === 0) {
    return data;
  }

  if (compressionMethod !== 8) {
    throw new Error("Compression non supportee.");
  }

  const DecompressionStreamCtor = (
    globalThis as typeof globalThis & {
      DecompressionStream?: new (format: string) => TransformStream<Uint8Array, Uint8Array>;
    }
  ).DecompressionStream;

  if (!DecompressionStreamCtor) {
    throw new Error("La previsualisation Word n'est pas supportee par ce navigateur.");
  }

  const dataBuffer = data.buffer.slice(data.byteOffset, data.byteOffset + data.byteLength) as ArrayBuffer;
  const stream = new Blob([dataBuffer]).stream().pipeThrough(new DecompressionStreamCtor("deflate-raw"));
  return new Uint8Array(await new Response(stream).arrayBuffer());
}

async function readZipEntryText(buffer: ArrayBuffer, entryName: string) {
  const bytes = new Uint8Array(buffer);
  const view = new DataView(buffer);
  const decoder = new TextDecoder();

  let eocdOffset = -1;
  for (let index = bytes.length - 22; index >= 0; index -= 1) {
    if (view.getUint32(index, true) === 0x06054b50) {
      eocdOffset = index;
      break;
    }
  }

  if (eocdOffset < 0) {
    throw new Error("Document Word invalide.");
  }

  const entryCount = view.getUint16(eocdOffset + 10, true);
  let cursor = view.getUint32(eocdOffset + 16, true);

  for (let index = 0; index < entryCount; index += 1) {
    if (view.getUint32(cursor, true) !== 0x02014b50) break;

    const compressionMethod = view.getUint16(cursor + 10, true);
    const compressedSize = view.getUint32(cursor + 20, true);
    const fileNameLength = view.getUint16(cursor + 28, true);
    const extraLength = view.getUint16(cursor + 30, true);
    const commentLength = view.getUint16(cursor + 32, true);
    const localHeaderOffset = view.getUint32(cursor + 42, true);
    const fileName = decoder.decode(bytes.slice(cursor + 46, cursor + 46 + fileNameLength));

    if (fileName === entryName) {
      const localNameLength = view.getUint16(localHeaderOffset + 26, true);
      const localExtraLength = view.getUint16(localHeaderOffset + 28, true);
      const dataStart = localHeaderOffset + 30 + localNameLength + localExtraLength;
      const compressedData = bytes.slice(dataStart, dataStart + compressedSize);
      const inflatedData = await inflateZipEntry(compressedData, compressionMethod);
      return decoder.decode(inflatedData);
    }

    cursor += 46 + fileNameLength + extraLength + commentLength;
  }

  throw new Error("Contenu du document introuvable.");
}

async function readDocumentPreview(document: RealizationDocument) {
  const response = await fetch(document.url);

  if (isWordDocument(document)) {
    const xml = await readZipEntryText(await response.arrayBuffer(), "word/document.xml");
    return docxXmlToText(xml) || "Aucun texte lisible dans ce document.";
  }

  if (isTextDocument(document)) {
    return response.text();
  }

  return "";
}

function getDetailStatus(plan: MaintenancePlan) {
  if (plan.status === "DONE") return { className: "done", label: "Terminé" };
  if (plan.status === "LATE") return { className: "late", label: "En retard" };
  if (plan.status === "IN_PROGRESS") {
    return { className: "in_progress", label: "En cours" };
  }

  const due = plan.nextDueDate
    ? new Date(`${plan.nextDueDate.slice(0, 10)}T00:00:00`)
    : null;
  const today = new Date();
  today.setHours(0, 0, 0, 0);

  if (plan.status === "PLANNED") {
    if (due && due <= today) return { className: "late", label: "En retard" };
    return { className: "planned", label: "Planifié" };
  }

  if (due && due <= today) return { className: "late", label: "En retard" };
  if (due && due > today) return { className: "planned", label: "Planifié" };

  return { className: "in_progress", label: "En cours" };
}

function planToPayload(plan: MaintenancePlan) {
  return {
    equipmentId: plan.equipmentId,
    description: plan.description,
    equipmentOnly: plan.equipmentOnly,
    regulatory: plan.regulatory,
    triggerType: plan.triggerType,
    frequencyValue: plan.frequencyValue,
    frequencyUnit: plan.frequencyUnit as "DAYS" | "WEEKS" | "MONTHS" | "YEARS",
    startDate: plan.startDate || null,
    nextDueDate: plan.nextDueDate || null,
    plannedMaintenanceHours: plan.plannedMaintenanceHours,
    plannedMaintenanceMinutes: plan.plannedMaintenanceMinutes,
    plannedStoppedHours: plan.plannedStoppedHours,
    plannedStoppedMinutes: plan.plannedStoppedMinutes,
    spareParts: plan.spareParts.map((sparePart) => ({
      sparePartId: sparePart.sparePartId,
      quantity: sparePart.quantity,
    })),
  };
}

export default function MaintenancePlanDetailsPage() {
  const navigate = useNavigate();
  const { id } = useParams();
  const [plan, setPlan] = useState<MaintenancePlan | null>(null);
  const [spareParts, setSpareParts] = useState<SparePart[]>([]);
  const [measures, setMeasures] = useState<Measure[]>([]);
  const [users, setUsers] = useState<UserDetail[]>([]);
  const [selectedSparePartId, setSelectedSparePartId] = useState(0);
  const [selectedQuantity, setSelectedQuantity] = useState(1);
  const [showSpareSelector, setShowSpareSelector] = useState(false);
  const [realizationDescription, setRealizationDescription] = useState("");
  const [realizationDate, setRealizationDate] = useState(() => toInputDate(new Date()));
  const [realizationEndTime, setRealizationEndTime] = useState(() => toInputTime(new Date()));
  const [realizationHours, setRealizationHours] = useState(0);
  const [realizationMinutes, setRealizationMinutes] = useState(0);
  const [realizationTab, setRealizationTab] = useState<RealizationTab>("counter");
  const [realizationMeasureId, setRealizationMeasureId] = useState("");
  const [realizationMeasureValue, setRealizationMeasureValue] = useState("");
  const [realizationMeasureDate, setRealizationMeasureDate] = useState(() => toInputDate(new Date()));
  const [realizationMeasureTime, setRealizationMeasureTime] = useState(() => toInputTime(new Date()));
  const [realizationSparePartId, setRealizationSparePartId] = useState("");
  const [realizationSparePartQuantity, setRealizationSparePartQuantity] = useState(1);
  const [realizationAdditionalCost, setRealizationAdditionalCost] = useState("");
  const [realizationAdditionalCostLabel, setRealizationAdditionalCostLabel] = useState("");
  const [realizationActorId, setRealizationActorId] = useState("");
  const [realizationActorName, setRealizationActorName] = useState("");
  const [realizationDocuments, setRealizationDocuments] = useState<RealizationDocument[]>([]);
  const [selectedDocumentIndex, setSelectedDocumentIndex] = useState<number | null>(null);
  const [showCameraPreview, setShowCameraPreview] = useState(false);
  const [cameraError, setCameraError] = useState("");
  const [documentPreviewText, setDocumentPreviewText] = useState("");
  const [documentPreviewError, setDocumentPreviewError] = useState("");
  const [isDocumentPreviewLoading, setIsDocumentPreviewLoading] = useState(false);
  const [error, setError] = useState("");
  const [successMessage, setSuccessMessage] = useState("");
  const cameraVideoRef = useRef<HTMLVideoElement | null>(null);
  const cameraCanvasRef = useRef<HTMLCanvasElement | null>(null);
  const cameraStreamRef = useRef<MediaStream | null>(null);

  const selectedDocument =
    selectedDocumentIndex !== null ? realizationDocuments[selectedDocumentIndex] || null : null;

  useEffect(() => {
    if (!id) return;

    loadPlan(Number(id));
    loadSpareParts();
    loadMeasures();
    loadUsers();
  }, [id]);

  useEffect(() => {
    const currentUserId = getAuthenticatedUserId();
    const currentUser = users.find((user) => user.id === currentUserId);

    if (!realizationActorId && currentUser) {
      setRealizationActorId(String(currentUser.id));
      setRealizationActorName(getUserDisplayName(currentUser));
      return;
    }

    if (!realizationActorName) {
      setRealizationActorName(getAuthenticatedEmail() || "Administrateur");
    }
  }, [realizationActorId, realizationActorName, users]);

  useEffect(() => {
    if (selectedDocumentIndex === null) return;

    function handleDocumentNavigation(event: KeyboardEvent) {
      if (event.key === "Escape") {
        setSelectedDocumentIndex(null);
      }

      if (event.key === "ArrowLeft") {
        showPreviousDocument();
      }

      if (event.key === "ArrowRight") {
        showNextDocument();
      }
    }

    window.addEventListener("keydown", handleDocumentNavigation);
    return () => window.removeEventListener("keydown", handleDocumentNavigation);
  }, [selectedDocumentIndex, realizationDocuments.length]);

  useEffect(() => {
    if (!showCameraPreview) return;

    startCamera();

    return () => stopCamera();
  }, [showCameraPreview]);

  useEffect(() => {
    let canceled = false;

    setDocumentPreviewText("");
    setDocumentPreviewError("");
    setIsDocumentPreviewLoading(false);

    if (!selectedDocument || (!isWordDocument(selectedDocument) && !isTextDocument(selectedDocument))) {
      return () => {
        canceled = true;
      };
    }

    setIsDocumentPreviewLoading(true);
    readDocumentPreview(selectedDocument)
      .then((content) => {
        if (!canceled) {
          setDocumentPreviewText(content);
        }
      })
      .catch(() => {
        if (!canceled) {
          setDocumentPreviewError("Impossible d'afficher le contenu de ce document.");
        }
      })
      .finally(() => {
        if (!canceled) {
          setIsDocumentPreviewLoading(false);
        }
      });

    return () => {
      canceled = true;
    };
  }, [selectedDocument]);

  async function loadPlan(planId: number) {
    try {
      setError("");
      const data = await getMaintenancePlanById(planId);
      const normalizedPlan = { ...data, spareParts: data.spareParts || [] };
      setPlan(normalizedPlan);
      restoreRealizationDraft(normalizedPlan.id);
    } catch {
      setError("Impossible de charger le plan de maintenance.");
    }
  }

  async function loadSpareParts() {
    try {
      const data = await getSpareParts();
      setSpareParts(data);
    } catch {
      setSpareParts([]);
    }
  }

  async function loadMeasures() {
    try {
      const data = await getMeasures();
      setMeasures(data);
    } catch {
      setMeasures([]);
    }
  }

  async function loadUsers() {
    try {
      const data = await getUsersDetailed();
      setUsers(data);
    } catch {
      setUsers([]);
    }
  }

  function addRealizationMinutes(minutesToAdd: number) {
    const totalMinutes = realizationHours * 60 + realizationMinutes + minutesToAdd;
    setRealizationHours(Math.floor(totalMinutes / 60));
    setRealizationMinutes(totalMinutes % 60);
  }

  function addRealizationDocuments(fileList: FileList | null) {
    if (!fileList?.length) return;

    const documents = Array.from(fileList).map((file) => ({
      id: `${file.name}-${file.lastModified}-${crypto.randomUUID()}`,
      name: file.name,
      type: file.type,
      url: URL.createObjectURL(file),
    }));

    setRealizationDocuments((current) => [...current, ...documents]);
  }

  function removeRealizationDocument(documentId: string) {
    setRealizationDocuments((current) => {
      const documentToRemove = current.find((item) => item.id === documentId);
      if (documentToRemove?.url.startsWith("blob:")) {
        URL.revokeObjectURL(documentToRemove.url);
      }

      return current.filter((item) => item.id !== documentId);
    });
  }

  function openDocumentPreview(documentId: string) {
    const documentIndex = realizationDocuments.findIndex((document) => document.id === documentId);
    if (documentIndex >= 0) {
      setSelectedDocumentIndex(documentIndex);
    }
  }

  function showPreviousDocument() {
    setSelectedDocumentIndex((current) => {
      if (current === null || realizationDocuments.length === 0) return current;
      return current === 0 ? realizationDocuments.length - 1 : current - 1;
    });
  }

  function showNextDocument() {
    setSelectedDocumentIndex((current) => {
      if (current === null || realizationDocuments.length === 0) return current;
      return current === realizationDocuments.length - 1 ? 0 : current + 1;
    });
  }

  async function startCamera() {
    try {
      setCameraError("");

      if (!navigator.mediaDevices?.getUserMedia) {
        setCameraError("La caméra n'est pas disponible sur ce navigateur.");
        return;
      }

      const stream = await navigator.mediaDevices.getUserMedia({
        video: { facingMode: "environment" },
        audio: false,
      });

      cameraStreamRef.current = stream;
      if (cameraVideoRef.current) {
        cameraVideoRef.current.srcObject = stream;
        await cameraVideoRef.current.play();
      }
    } catch {
      setCameraError("Impossible d'ouvrir la caméra. Vérifiez l'autorisation du navigateur.");
    }
  }

  function stopCamera() {
    cameraStreamRef.current?.getTracks().forEach((track) => track.stop());
    cameraStreamRef.current = null;
  }

  function closeCameraPreview() {
    stopCamera();
    setShowCameraPreview(false);
  }

  function captureCameraPhoto() {
    const video = cameraVideoRef.current;
    const canvas = cameraCanvasRef.current;

    if (!video || !canvas) return;

    canvas.width = video.videoWidth || 1280;
    canvas.height = video.videoHeight || 720;
    const context = canvas.getContext("2d");
    if (!context) return;

    context.drawImage(video, 0, 0, canvas.width, canvas.height);
    canvas.toBlob((blob) => {
      if (!blob) return;

      const timestamp = new Date()
        .toISOString()
        .replace(/[-:]/g, "")
        .replace(/\..+/, "")
        .replace("T", "-");
      const document: RealizationDocument = {
        id: `photo-realisation-${timestamp}-${crypto.randomUUID()}`,
        name: `photo-realisation-${timestamp}.jpg`,
        type: "image/jpeg",
        url: URL.createObjectURL(blob),
      };

      setRealizationDocuments((current) => {
        const nextDocuments = [...current, document];
        setSelectedDocumentIndex(nextDocuments.length - 1);
        return nextDocuments;
      });
      closeCameraPreview();
    }, "image/jpeg", 0.92);
  }

  function updateRealizationActor(userId: string) {
    setRealizationActorId(userId);

    const user = users.find((item) => item.id === Number(userId));
    setRealizationActorName(user ? getUserDisplayName(user) : getAuthenticatedEmail() || "Administrateur");
  }

  function getCurrentRealizationDraft(): MaintenanceRealizationDraft {
    return {
      description: realizationDescription,
      date: realizationDate,
      endTime: realizationEndTime,
      hours: realizationHours,
      minutes: realizationMinutes,
      tab: realizationTab,
      measureId: realizationMeasureId,
      measureValue: realizationMeasureValue,
      measureDate: realizationMeasureDate,
      measureTime: realizationMeasureTime,
      sparePartId: realizationSparePartId,
      sparePartQuantity: realizationSparePartQuantity,
      additionalCost: realizationAdditionalCost,
      additionalCostLabel: realizationAdditionalCostLabel,
      actorId: realizationActorId,
      actorName: realizationActorName,
      documents: realizationDocuments,
    };
  }

  function applyRealizationDraft(draft: Partial<MaintenanceRealizationDraft>) {
    const now = new Date();
    setRealizationDescription(draft.description || "");
    setRealizationDate(draft.date || toInputDate(now));
    setRealizationEndTime(draft.endTime || toInputTime(now));
    setRealizationHours(Number(draft.hours) || 0);
    setRealizationMinutes(Number(draft.minutes) || 0);
    setRealizationTab(draft.tab || "counter");
    setRealizationMeasureId(draft.measureId || "");
    setRealizationMeasureValue(draft.measureValue || "");
    setRealizationMeasureDate(draft.measureDate || toInputDate(now));
    setRealizationMeasureTime(draft.measureTime || toInputTime(now));
    setRealizationSparePartId(draft.sparePartId || "");
    setRealizationSparePartQuantity(Number(draft.sparePartQuantity) || 1);
    setRealizationAdditionalCost(draft.additionalCost || "");
    setRealizationAdditionalCostLabel(draft.additionalCostLabel || "");
    setRealizationActorId(draft.actorId || "");
    setRealizationActorName(draft.actorName || getAuthenticatedEmail() || "Administrateur");
    setRealizationDocuments(
      Array.isArray(draft.documents)
        ? draft.documents.filter((document) => document && document.name && document.url)
        : [],
    );
  }

  function saveRealizationDraft(planId: number) {
    localStorage.setItem(
      getRealizationStorageKey(planId),
      JSON.stringify(getCurrentRealizationDraft()),
    );
  }

  function restoreRealizationDraft(planId: number) {
    const storedDraft = localStorage.getItem(getRealizationStorageKey(planId));

    if (!storedDraft) return;

    try {
      applyRealizationDraft(JSON.parse(storedDraft) as Partial<MaintenanceRealizationDraft>);
    } catch {
      localStorage.removeItem(getRealizationStorageKey(planId));
    }
  }

  function resetRealizationToDefaultValues() {
    realizationDocuments.forEach((document) => {
      if (document.url.startsWith("blob:")) {
        URL.revokeObjectURL(document.url);
      }
    });

    const now = new Date();
    setRealizationDescription("");
    setRealizationDate(toInputDate(now));
    setRealizationEndTime(toInputTime(now));
    setRealizationHours(0);
    setRealizationMinutes(0);
    setRealizationTab("counter");
    setRealizationMeasureId("");
    setRealizationMeasureValue("");
    setRealizationMeasureDate(toInputDate(now));
    setRealizationMeasureTime(toInputTime(now));
    setRealizationSparePartId("");
    setRealizationSparePartQuantity(1);
    setRealizationAdditionalCost("");
    setRealizationAdditionalCostLabel("");
    setRealizationActorId("");
    setRealizationActorName("");
    setRealizationDocuments([]);
  }

  function resetRealizationForm() {
    if (plan) {
      const storedDraft = localStorage.getItem(getRealizationStorageKey(plan.id));

      if (storedDraft) {
        try {
          applyRealizationDraft(JSON.parse(storedDraft) as Partial<MaintenanceRealizationDraft>);
          return;
        } catch {
          localStorage.removeItem(getRealizationStorageKey(plan.id));
        }
      }
    }

    resetRealizationToDefaultValues();
  }

  async function validateRealization() {
    if (!plan) return;
    setSuccessMessage("");

    if (!realizationDescription.trim()) {
      setError("La description de la réalisation est obligatoire.");
      return;
    }

    if (!realizationDate || !realizationEndTime) {
      setError("La date et l'heure de fin de réalisation sont obligatoires.");
      return;
    }

    try {
      setError("");
      saveRealizationDraft(plan.id);
      const updated = await updateMaintenancePlanStatus(plan.id, "DONE");
      setPlan({ ...updated, spareParts: updated.spareParts || plan.spareParts });
      setSuccessMessage("Votre plan est validé.");
    } catch {
      setError("Impossible de valider cette réalisation.");
    }
  }

  async function addSparePart() {
    if (!plan || !selectedSparePartId) return;

    const exists = plan.spareParts.some(
      (item) => item.sparePartId === selectedSparePartId
    );

    const nextSpareParts = exists
      ? plan.spareParts.map((item) =>
          item.sparePartId === selectedSparePartId
            ? { ...item, quantity: selectedQuantity }
            : item
        )
      : [
          ...plan.spareParts,
          {
            sparePartId: selectedSparePartId,
            sparePartName:
              spareParts.find((item) => item.id === selectedSparePartId)?.name ||
              "Pièce détachée",
            sparePartCode:
              spareParts.find((item) => item.id === selectedSparePartId)?.code ||
              null,
            sparePartImage:
              spareParts.find((item) => item.id === selectedSparePartId)?.image ||
              null,
            quantity: selectedQuantity,
          },
        ];

    try {
      setError("");
      setPlan({ ...plan, spareParts: nextSpareParts });

      const updated = await updateMaintenancePlan(plan.id, {
        ...planToPayload(plan),
        spareParts: nextSpareParts.map((item) => ({
          sparePartId: item.sparePartId,
          quantity: item.quantity,
        })),
      });

      setPlan({
        ...updated,
        spareParts:
          updated.spareParts && updated.spareParts.length > 0
            ? updated.spareParts
            : nextSpareParts,
      });
      setSelectedSparePartId(0);
      setSelectedQuantity(1);
      setShowSpareSelector(false);
    } catch {
      setPlan(plan);
      setError("Impossible d'ajouter la pièce détachée au plan.");
    }
  }

  async function removeSparePart(sparePartId: number) {
    if (!plan) return;

    const nextSpareParts = plan.spareParts.filter(
      (item) => item.sparePartId !== sparePartId
    );

    try {
      setError("");
      const updated = await updateMaintenancePlan(plan.id, {
        ...planToPayload(plan),
        spareParts: nextSpareParts.map((item) => ({
          sparePartId: item.sparePartId,
          quantity: item.quantity,
        })),
      });

      setPlan({ ...updated, spareParts: updated.spareParts || [] });
    } catch {
      setError("Impossible de retirer la pièce détachée du plan.");
    }
  }

  const availableSpareParts = useMemo(() => {
    if (!plan) return spareParts;

    return spareParts.filter(
      (sparePart) =>
        !plan.spareParts.some((item) => item.sparePartId === sparePart.id)
    );
  }, [plan, spareParts]);

  if (error && !plan) {
    return (
      <main className="admin-page">
        <div className="form-error">{error}</div>
      </main>
    );
  }

  if (!plan) {
    return (
      <main className="admin-page">
        <div className="empty-table-cell">Chargement...</div>
      </main>
    );
  }

  const equipmentImage = getImageUrl(plan.equipmentImage);
  const detailStatus = getDetailStatus(plan);

  return (
    <main className="admin-page">
      {error && <div className="form-error">{error}</div>}

      <section className="details-header">
        <div>
          <h1>
            <CalendarClock size={34} />
            Plan de maintenance
            <span className="activity-id-badge">#{plan.id}</span>
            <span className={`status-badge ${detailStatus.className}`}>{detailStatus.label}</span>
          </h1>
        </div>

        <button
          type="button"
          className="maintenance-form-back-button"
          onClick={() => navigate("/admin/maintenance-plans")}
        >
          <ArrowLeft size={18} />
          Retour aux plans de maintenance
        </button>
      </section>

      <section className="maintenance-details-layout">
        <div className="details-panel">
          <div className="details-row">
            <FileText size={22} />
            <div>
              <span>Description</span>
              <strong>{plan.description}</strong>
            </div>
          </div>

          <div className="details-row">
            <History size={22} />
            <div>
              <span>Périodicité</span>
              <strong>{plan.frequencyLabel}</strong>
            </div>
          </div>

          <div className="details-row">
            <CalendarClock size={22} />
            <div>
              <span>Prochaine échéance</span>
              <strong className="status-pill status-late">
                {formatDate(plan.nextDueDate)}
              </strong>
            </div>
          </div>

          <div className="details-row">
            <Users size={22} />
            <div>
              <span>Assignés</span>
              <strong>Aucun assigné.</strong>
            </div>
          </div>

          <div className="details-row">
            <Tags size={22} />
            <div>
              <span>Labels</span>
              <strong>Aucun label.</strong>
            </div>
          </div>

          <div className="details-row">
            <FileText size={22} />
            <div>
              <span>Checklist</span>
              <strong>Aucune checklist associée.</strong>
            </div>
          </div>
        </div>

        <aside className="details-side">
          <section className="details-card">
            <h3>Équipement</h3>

            <button
              type="button"
              className="linked-equipment-card linked-equipment-action"
              onClick={() => navigate(`/admin/equipment/${plan.equipmentId}`)}
            >
              {equipmentImage ? (
                <img src={equipmentImage} alt={plan.equipmentName} />
              ) : (
                <div className="linked-equipment-placeholder">
                  <Wrench size={28} />
                </div>
              )}

              <div>
                <span>Nom de l'équipement</span>
                <strong>{plan.equipmentName}</strong>
              </div>
            </button>

            <div className="details-row compact">
              <MapPin size={20} />
              <div>
                <span>Centre de coûts</span>
                <strong>{plan.costCenter || "-"}</strong>
              </div>
            </div>
          </section>

          <section className="details-card">
            <div className="details-row compact">
              <Scale size={20} />
              <div>
                <span>Réglementaire</span>
                <strong>{plan.regulatory ? "Oui" : "Non"}</strong>
              </div>
            </div>

            <div className="details-row compact">
              <History size={20} />
              <div>
                <span>Déclencheur</span>
                <strong>{plan.triggerLabel}</strong>
              </div>
            </div>

            <div className="details-row compact">
              <Clock size={20} />
              <div>
                <span>Temps de maintenance planifié</span>
                <strong>
                  {formatDuration(
                    plan.plannedMaintenanceHours,
                    plan.plannedMaintenanceMinutes
                  )}
                </strong>
              </div>
            </div>

            <div className="details-row compact">
              <Clock size={20} />
              <div>
                <span>Temps d'arrêt planifié</span>
                <strong>
                  {formatDuration(
                    plan.plannedStoppedHours,
                    plan.plannedStoppedMinutes
                  )}
                </strong>
              </div>
            </div>
          </section>
        </aside>
      </section>

      <section className="details-card full maintenance-spare-card">
        <div className="section-title-row">
          <h3>Pièces détachées à prévoir</h3>
          <button
            type="button"
            className="icon-link-button"
            onClick={() => setShowSpareSelector((current) => !current)}
            aria-label="Ajouter une pièce détachée"
          >
            <Plus size={20} />
          </button>
        </div>

        {showSpareSelector && (
          <div className="maintenance-spare-selector">
            <select
              value={selectedSparePartId}
              onChange={(event) =>
                setSelectedSparePartId(Number(event.target.value))
              }
            >
              <option value={0}>Sélectionner une pièce détachée</option>
              {availableSpareParts.map((sparePart) => (
                <option key={sparePart.id} value={sparePart.id}>
                  {sparePart.name}
                </option>
              ))}
            </select>

            <input
              type="number"
              min={1}
              value={selectedQuantity}
              onChange={(event) =>
                setSelectedQuantity(Math.max(1, Number(event.target.value)))
              }
              aria-label="Quantité à prévoir"
            />

            <button
              type="button"
              className="primary-action compact-action"
              onClick={addSparePart}
              disabled={!selectedSparePartId}
            >
              Ajouter
            </button>
          </div>
        )}

        {plan.spareParts.length === 0 ? (
          <p>Aucune pièce détachée liée.</p>
        ) : (
          <div className="maintenance-spare-list">
            {plan.spareParts.map((sparePart) => {
              const imageUrl = getImageUrl(sparePart.sparePartImage);

              return (
                <div className="maintenance-spare-item" key={sparePart.sparePartId}>
                  {imageUrl ? (
                    <img src={imageUrl} alt={sparePart.sparePartName} />
                  ) : (
                    <div className="maintenance-spare-placeholder">
                      <Package size={22} />
                    </div>
                  )}

                  <div>
                    <strong>{sparePart.sparePartName}</strong>
                    <span>
                      Code : {sparePart.sparePartCode || "Non défini"} · À prévoir : {sparePart.quantity}
                    </span>
                  </div>

                  <button
                    type="button"
                    className="icon-link-button danger"
                    onClick={() => removeSparePart(sparePart.sparePartId)}
                    aria-label="Retirer la pièce détachée"
                  >
                    <Trash2 size={18} />
                  </button>
                </div>
              );
            })}
          </div>
        )}
      </section>

      <section className="details-card full maintenance-realization-card">
        <div className="maintenance-realization-header">
          <h3>Réalisation</h3>
        </div>

        <div className="measure-form-group">
          <label htmlFor="realization-description">
            Description <span>*</span>
          </label>
          <textarea
            id="realization-description"
            value={realizationDescription}
            onChange={(event) => setRealizationDescription(event.target.value)}
            maxLength={2000}
            placeholder="Description"
          />
          <small>{realizationDescription.length} / 2000</small>
        </div>

        <div className="maintenance-realization-grid three">
          <div className="measure-form-group">
            <label htmlFor="realization-date">
              Réalisée le <span>*</span>
            </label>
            <input
              id="realization-date"
              type="date"
              value={realizationDate}
              onChange={(event) => setRealizationDate(event.target.value)}
            />
          </div>

          <div className="measure-form-group">
            <label htmlFor="realization-end-time">
              Heure de fin de réalisation <span>*</span>
            </label>
            <input
              id="realization-end-time"
              type="time"
              value={realizationEndTime}
              onChange={(event) => setRealizationEndTime(event.target.value)}
            />
          </div>

          <div className="measure-form-group">
            <label htmlFor="realization-actor">
              Réalisée par <span>*</span>
            </label>
            <select
              id="realization-actor"
              value={realizationActorId}
              onChange={(event) => updateRealizationActor(event.target.value)}
            >
              {realizationActorName && !realizationActorId && (
                <option value="">{realizationActorName}</option>
              )}
              {users.map((user) => (
                <option key={user.id} value={user.id}>
                  {getUserDisplayName(user)}
                </option>
              ))}
            </select>
          </div>
        </div>

        <div className="maintenance-realization-separator" />

        <div className="maintenance-realization-section-title">
          <Clock size={20} />
          <h4>Temps passé</h4>
        </div>

        <div className="maintenance-realization-grid two">
          <div className="measure-form-group">
            <label htmlFor="realization-hours">Heures</label>
            <input
              id="realization-hours"
              type="number"
              min={0}
              value={realizationHours}
              onChange={(event) => setRealizationHours(Math.max(0, Number(event.target.value)))}
            />
          </div>

          <div className="measure-form-group">
            <label htmlFor="realization-minutes">Minutes</label>
            <input
              id="realization-minutes"
              type="number"
              min={0}
              max={59}
              value={realizationMinutes}
              onChange={(event) =>
                setRealizationMinutes(Math.min(59, Math.max(0, Number(event.target.value))))
              }
            />
          </div>
        </div>

        <div className="maintenance-realization-quick-actions">
          <button type="button" onClick={() => addRealizationMinutes(15)}>
            +15min.
          </button>
          <button type="button" onClick={() => addRealizationMinutes(30)}>
            +30min.
          </button>
          <button type="button" onClick={() => addRealizationMinutes(45)}>
            +45min.
          </button>
          <button type="button" onClick={() => addRealizationMinutes(60)}>
            +1h
          </button>
        </div>

        <div className="maintenance-realization-tabs">
          <button
            type="button"
            className={realizationTab === "counter" ? "active" : ""}
            onClick={() => setRealizationTab("counter")}
          >
            <Gauge size={18} />
            Compteur
          </button>
          <button
            type="button"
            className={realizationTab === "sparePart" ? "active" : ""}
            onClick={() => setRealizationTab("sparePart")}
          >
            <Package size={18} />
            Pièce détachée
          </button>
          <button
            type="button"
            className={realizationTab === "additionalCost" ? "active" : ""}
            onClick={() => setRealizationTab("additionalCost")}
          >
            <Coins size={18} />
            Coût additionnel
          </button>
        </div>

        {realizationTab === "counter" && (
          <div className="maintenance-realization-grid three">
            <div className="measure-form-group">
              <label htmlFor="realization-measure">
                Mesure <span>*</span>
              </label>
              <select
                id="realization-measure"
                value={realizationMeasureId}
                onChange={(event) => setRealizationMeasureId(event.target.value)}
              >
                <option value="">Sélectionner une mesure</option>
                {measures.map((measure) => (
                  <option key={measure.id} value={measure.id}>
                    {measure.name} ({measure.unitSymbol})
                  </option>
                ))}
              </select>
            </div>

            <div className="measure-form-group">
              <label htmlFor="realization-measure-value">
                Valeur <span>*</span>
              </label>
              <input
                id="realization-measure-value"
                value={realizationMeasureValue}
                onChange={(event) => setRealizationMeasureValue(event.target.value)}
                placeholder="Ex : 12,50"
              />
            </div>

            <div className="measure-form-group">
              <label htmlFor="realization-measure-date">
                Date du relevé <span>*</span>
              </label>
              <input
                id="realization-measure-date"
                type="date"
                value={realizationMeasureDate}
                onChange={(event) => setRealizationMeasureDate(event.target.value)}
              />
            </div>

            <div className="measure-form-group">
              <label htmlFor="realization-measure-time">
                Heure <span>*</span>
              </label>
              <input
                id="realization-measure-time"
                type="time"
                value={realizationMeasureTime}
                onChange={(event) => setRealizationMeasureTime(event.target.value)}
              />
            </div>
          </div>
        )}

        {realizationTab === "sparePart" && (
          <div className="maintenance-realization-grid two">
            <div className="measure-form-group">
              <label htmlFor="realization-spare-part">
                Pièce détachée <span>*</span>
              </label>
              <select
                id="realization-spare-part"
                value={realizationSparePartId}
                onChange={(event) => setRealizationSparePartId(event.target.value)}
              >
                <option value="">Sélectionner une pièce détachée</option>
                {spareParts.map((sparePart) => (
                  <option key={sparePart.id} value={sparePart.id}>
                    {sparePart.name}
                  </option>
                ))}
              </select>
            </div>

            <div className="measure-form-group">
              <label htmlFor="realization-spare-quantity">Quantité</label>
              <input
                id="realization-spare-quantity"
                type="number"
                min={1}
                value={realizationSparePartQuantity}
                onChange={(event) =>
                  setRealizationSparePartQuantity(Math.max(1, Number(event.target.value)))
                }
              />
            </div>
          </div>
        )}

        {realizationTab === "additionalCost" && (
          <div className="maintenance-realization-grid two">
            <div className="measure-form-group">
              <label htmlFor="realization-additional-cost">
                Coût additionnel <span>*</span>
              </label>
              <div className="maintenance-currency-field">
                <input
                  id="realization-additional-cost"
                  value={realizationAdditionalCost}
                  onChange={(event) => setRealizationAdditionalCost(event.target.value)}
                  placeholder="Ex : 12,50"
                />
                <span>EUR</span>
              </div>
            </div>

            <div className="measure-form-group">
              <label htmlFor="realization-additional-cost-label">Libellé</label>
              <input
                id="realization-additional-cost-label"
                value={realizationAdditionalCostLabel}
                onChange={(event) => setRealizationAdditionalCostLabel(event.target.value)}
                maxLength={255}
                placeholder="Ex : Retrofit presse hydraulique"
              />
              <small>{realizationAdditionalCostLabel.length} / 255</small>
            </div>
          </div>
        )}

        <div className="maintenance-realization-separator" />

        <div className="maintenance-realization-section-title">
          <FileText size={20} />
          <h4>Documents</h4>
        </div>

        <label className="maintenance-realization-dropzone">
          <input
            type="file"
            multiple
            onChange={(event) => addRealizationDocuments(event.target.files)}
          />
          <UploadCloud size={24} />
          <span>
            Déposer un fichier ici ou <strong>parcourir</strong>
          </span>
        </label>

        <div className="maintenance-realization-document-actions">
          <button type="button" onClick={() => setShowCameraPreview(true)}>
            <Camera size={18} />
            Prendre une photo
          </button>
        </div>

        {realizationDocuments.length > 0 && (
          <div className="maintenance-realization-document-list">
            {realizationDocuments.map((document) => (
              <span key={document.id}>
                <button
                  type="button"
                  className="maintenance-realization-document-link"
                  onClick={() => openDocumentPreview(document.id)}
                >
                  <FileText size={15} />
                  {document.name}
                </button>
                <button
                  type="button"
                  onClick={() => removeRealizationDocument(document.id)}
                  aria-label={`Retirer ${document.name}`}
                >
                  <X size={13} />
                </button>
              </span>
            ))}
          </div>
        )}

        {successMessage && (
          <div className="maintenance-realization-success">{successMessage}</div>
        )}

        <div className="maintenance-realization-footer">
          <button type="button" className="measure-cancel-button" onClick={resetRealizationForm}>
            Annuler
          </button>
          <button type="button" className="measure-primary-button" onClick={validateRealization}>
            <CheckCircle2 size={18} />
            Valider cette réalisation
          </button>
        </div>
      </section>

      {showCameraPreview && (
        <div
          className="maintenance-photo-preview-backdrop"
          role="dialog"
          aria-modal="true"
          aria-label="Prendre une photo"
        >
          <div className="maintenance-photo-preview camera">
            <div className="maintenance-photo-preview-header">
              <div>
                <strong>Prendre une photo</strong>
                <span>Camera du PC ou de la tablette</span>
              </div>
              <button type="button" onClick={closeCameraPreview} aria-label="Fermer la camera">
                <X size={20} />
              </button>
            </div>

            <div className="maintenance-camera-body">
              {cameraError ? (
                <div className="maintenance-document-preview-empty">{cameraError}</div>
              ) : (
                <video ref={cameraVideoRef} playsInline muted />
              )}
              <canvas ref={cameraCanvasRef} />
            </div>

            <div className="maintenance-camera-footer">
              <button type="button" className="measure-cancel-button" onClick={closeCameraPreview}>
                Annuler
              </button>
              <button
                type="button"
                className="measure-primary-button"
                onClick={captureCameraPhoto}
                disabled={Boolean(cameraError)}
              >
                <Camera size={18} />
                Capturer
              </button>
            </div>
          </div>
        </div>
      )}

      {selectedDocument && (
        <div
          className="maintenance-photo-preview-backdrop"
          role="dialog"
          aria-modal="true"
          aria-label="Apercu des documents"
        >
          <div className="maintenance-photo-preview">
            <div className="maintenance-photo-preview-header">
              <div>
                <strong>{selectedDocument.name}</strong>
                <span>
                  {selectedDocumentIndex! + 1} / {realizationDocuments.length}
                </span>
              </div>
              <div className="maintenance-document-preview-actions">
                <a
                  href={selectedDocument.url}
                  download={selectedDocument.name}
                  className="maintenance-document-download"
                  aria-label={`Telecharger ${selectedDocument.name}`}
                >
                  <Download size={18} />
                  Télécharger
                </a>
                <button
                  type="button"
                  onClick={() => setSelectedDocumentIndex(null)}
                  aria-label="Fermer l'apercu"
                >
                  <X size={20} />
                </button>
              </div>
            </div>

            <div className="maintenance-photo-preview-body">
              {realizationDocuments.length > 1 && (
                <button
                  type="button"
                  className="maintenance-photo-preview-nav previous"
                  onClick={showPreviousDocument}
                  aria-label="Document precedent"
                >
                  <ChevronLeft size={28} />
                </button>
              )}

              {selectedDocument.type.startsWith("image/") ? (
                <img src={selectedDocument.url} alt={selectedDocument.name} />
              ) : selectedDocument.type === "application/pdf" ? (
                <iframe src={selectedDocument.url} title={selectedDocument.name} />
              ) : isWordDocument(selectedDocument) || isTextDocument(selectedDocument) ? (
                <div className="maintenance-document-text-preview">
                  {isDocumentPreviewLoading ? (
                    <span>Chargement du document...</span>
                  ) : documentPreviewError ? (
                    <span>{documentPreviewError}</span>
                  ) : (
                    <pre>{documentPreviewText}</pre>
                  )}
                </div>
              ) : (
                <div className="maintenance-document-preview-empty">
                  <FileText size={44} />
                  <strong>{selectedDocument.name}</strong>
                  <span>Ce format ne peut pas etre affiche directement par le navigateur.</span>
                </div>
              )}

              {realizationDocuments.length > 1 && (
                <button
                  type="button"
                  className="maintenance-photo-preview-nav next"
                  onClick={showNextDocument}
                  aria-label="Document suivant"
                >
                  <ChevronRight size={28} />
                </button>
              )}
            </div>
          </div>
        </div>
      )}
    </main>
  );
}
