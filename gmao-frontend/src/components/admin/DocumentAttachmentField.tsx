import { useEffect, useRef, useState } from "react";
import type { Dispatch, SetStateAction } from "react";
import {
  Camera,
  ChevronLeft,
  ChevronRight,
  Download,
  FileText,
  UploadCloud,
  X,
} from "lucide-react";

export interface PreviewDocument {
  id: string;
  name: string;
  type: string;
  url: string;
}

interface DocumentAttachmentFieldProps {
  files: File[];
  setFiles: Dispatch<SetStateAction<File[]>>;
  title?: string;
  multiple?: boolean;
}

interface DocumentPreviewProps {
  documents: PreviewDocument[];
  selectedIndex: number | null;
  onSelectIndex: (index: number | null) => void;
}

function isWordDocument(document: PreviewDocument) {
  return (
    document.type === "application/vnd.openxmlformats-officedocument.wordprocessingml.document" ||
    document.name.toLowerCase().endsWith(".docx")
  );
}

function isTextDocument(document: PreviewDocument) {
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
  if (compressionMethod === 0) return data;

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

  if (eocdOffset < 0) throw new Error("Document Word invalide.");

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

async function readDocumentPreview(document: PreviewDocument) {
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

export function DocumentPreviewModal({
  documents,
  selectedIndex,
  onSelectIndex,
}: DocumentPreviewProps) {
  const selectedDocument =
    selectedIndex !== null ? documents[selectedIndex] || null : null;
  const [documentPreviewText, setDocumentPreviewText] = useState("");
  const [documentPreviewError, setDocumentPreviewError] = useState("");
  const [isDocumentPreviewLoading, setIsDocumentPreviewLoading] = useState(false);

  useEffect(() => {
    if (selectedIndex === null) return;

    const currentIndex = selectedIndex;

    function handleDocumentNavigation(event: KeyboardEvent) {
      if (event.key === "Escape") onSelectIndex(null);
      if (event.key === "ArrowLeft") {
        onSelectIndex(currentIndex === 0 ? documents.length - 1 : currentIndex - 1);
      }
      if (event.key === "ArrowRight") {
        onSelectIndex(currentIndex === documents.length - 1 ? 0 : currentIndex + 1);
      }
    }

    window.addEventListener("keydown", handleDocumentNavigation);
    return () => window.removeEventListener("keydown", handleDocumentNavigation);
  }, [documents.length, onSelectIndex, selectedIndex]);

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
        if (!canceled) setDocumentPreviewText(content);
      })
      .catch(() => {
        if (!canceled) setDocumentPreviewError("Impossible d'afficher le contenu de ce document.");
      })
      .finally(() => {
        if (!canceled) setIsDocumentPreviewLoading(false);
      });

    return () => {
      canceled = true;
    };
  }, [selectedDocument]);

  if (!selectedDocument || selectedIndex === null) return null;

  const showPrevious = () =>
    onSelectIndex(selectedIndex === 0 ? documents.length - 1 : selectedIndex - 1);
  const showNext = () =>
    onSelectIndex(selectedIndex === documents.length - 1 ? 0 : selectedIndex + 1);

  return (
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
              {selectedIndex + 1} / {documents.length}
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
              Telecharger
            </a>
            <button type="button" onClick={() => onSelectIndex(null)} aria-label="Fermer l'apercu">
              <X size={20} />
            </button>
          </div>
        </div>

        <div className="maintenance-photo-preview-body">
          {documents.length > 1 && (
            <button
              type="button"
              className="maintenance-photo-preview-nav previous"
              onClick={showPrevious}
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

          {documents.length > 1 && (
            <button
              type="button"
              className="maintenance-photo-preview-nav next"
              onClick={showNext}
              aria-label="Document suivant"
            >
              <ChevronRight size={28} />
            </button>
          )}
        </div>
      </div>
    </div>
  );
}

export default function DocumentAttachmentField({
  files,
  setFiles,
  title = "Documents",
  multiple = true,
}: DocumentAttachmentFieldProps) {
  const [documents, setDocuments] = useState<PreviewDocument[]>([]);
  const [selectedDocumentIndex, setSelectedDocumentIndex] = useState<number | null>(null);
  const [showCameraPreview, setShowCameraPreview] = useState(false);
  const [cameraError, setCameraError] = useState("");
  const cameraVideoRef = useRef<HTMLVideoElement | null>(null);
  const cameraCanvasRef = useRef<HTMLCanvasElement | null>(null);
  const cameraStreamRef = useRef<MediaStream | null>(null);

  useEffect(() => {
    const nextDocuments = files.map((file, index) => ({
      id: `${file.name}-${file.lastModified}-${index}`,
      name: file.name,
      type: file.type,
      url: URL.createObjectURL(file),
    }));

    setDocuments(nextDocuments);

    return () => {
      nextDocuments.forEach((document) => URL.revokeObjectURL(document.url));
    };
  }, [files]);

  useEffect(() => {
    if (!showCameraPreview) return;

    startCamera();
    return () => stopCamera();
  }, [showCameraPreview]);

  function addFiles(fileList: FileList | null) {
    if (!fileList?.length) return;
    const nextFiles = Array.from(fileList);
    setFiles((current) => (multiple ? [...current, ...nextFiles] : nextFiles.slice(0, 1)));
  }

  function removeFile(index: number) {
    setFiles((current) => current.filter((_, fileIndex) => fileIndex !== index));
    setSelectedDocumentIndex((current) => {
      if (current === null) return current;
      if (files.length <= 1) return null;
      if (current === index) return null;
      return current > index ? current - 1 : current;
    });
  }

  async function startCamera() {
    try {
      setCameraError("");

      if (!navigator.mediaDevices?.getUserMedia) {
        setCameraError("La camera n'est pas disponible sur ce navigateur.");
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
      setCameraError("Impossible d'ouvrir la camera. Verifiez l'autorisation du navigateur.");
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
      const file = new File([blob], `photo-${timestamp}.jpg`, {
        type: "image/jpeg",
        lastModified: Date.now(),
      });

      setFiles((current) => (multiple ? [...current, file] : [file]));
      closeCameraPreview();
    }, "image/jpeg", 0.92);
  }

  return (
    <>
      <div className="equipment-documents-title">
        <FileText size={22} />
        <span>{title}</span>
      </div>

      <label className="equipment-documents-dropzone">
        <input type="file" multiple={multiple} onChange={(event) => addFiles(event.target.files)} />
        <UploadCloud size={30} />
        <span>
          Deposer un fichier ici ou <strong>parcourir</strong>
        </span>
      </label>

      <button
        type="button"
        className="equipment-photo-button"
        onClick={() => setShowCameraPreview(true)}
      >
        <Camera size={20} />
        Prendre une photo
      </button>

      {documents.length > 0 && (
        <div className="equipment-documents-list">
          {documents.map((document, index) => (
            <span className="equipment-document-chip" key={document.id}>
              <button
                type="button"
                className="equipment-document-open"
                onClick={() => setSelectedDocumentIndex(index)}
              >
                <FileText size={16} />
                <span>{document.name}</span>
              </button>
              <button
                type="button"
                onClick={() => removeFile(index)}
                aria-label={`Retirer ${document.name}`}
              >
                <X size={14} />
              </button>
            </span>
          ))}
        </div>
      )}

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
                <span>Camera du PC, telephone ou tablette</span>
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

      <DocumentPreviewModal
        documents={documents}
        selectedIndex={selectedDocumentIndex}
        onSelectIndex={setSelectedDocumentIndex}
      />
    </>
  );
}
