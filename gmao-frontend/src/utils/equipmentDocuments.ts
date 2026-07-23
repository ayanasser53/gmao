export type StoredEquipmentDocument = {
  id: string;
  name: string;
  type: string;
  dataUrl: string;
  isPhoto: boolean;
  createdAt: string;
};

const STORAGE_KEY = "smartmaint-equipment-documents";

type StoredEquipmentDocumentMap = Record<
  string,
  StoredEquipmentDocument[]
>;

function readDocumentMap(): StoredEquipmentDocumentMap {
  try {
    const storedValue = localStorage.getItem(STORAGE_KEY);

    if (!storedValue) {
      return {};
    }

    const parsedValue = JSON.parse(storedValue);

    return parsedValue &&
      typeof parsedValue === "object" &&
      !Array.isArray(parsedValue)
      ? (parsedValue as StoredEquipmentDocumentMap)
      : {};
  } catch {
    return {};
  }
}

export function readEquipmentDocuments(
  equipmentId: number | string,
): StoredEquipmentDocument[] {
  const documents = readDocumentMap()[String(equipmentId)];

  return Array.isArray(documents) ? documents : [];
}

export function writeEquipmentDocuments(
  equipmentId: number | string,
  documents: StoredEquipmentDocument[],
): void {
  const documentMap = readDocumentMap();
  documentMap[String(equipmentId)] = documents;
  localStorage.setItem(STORAGE_KEY, JSON.stringify(documentMap));
}
