export interface EquipmentTag {
  id: number;
  name: string;
  code: string | null;
  color: string | null;
  groupId: number | null;
  groupName: string | null;
}

export interface LinkedEquipment {
  id: number;
  name: string;
  image: string | null;
  itemCode: string | null;
}

export interface LinkedSparePart {
  id: number;
  code: string | null;
  name: string;
  imageUrl: string | null;
  quantity: number | null;
}

export interface Equipment {
  id: number;
  image: string | null;
  name: string;
  description: string | null;

  costCenterId: number | null;
  costCenterName: string | null;

  gtinEanCode: string | null;
  itemCode: string | null;

  tags: EquipmentTag[];

  linkedEquipment: LinkedEquipment[];
  linkedSpareParts: LinkedSparePart[];

  createdAt: string;
  updatedAt: string;
}

export interface EquipmentPayload {
  name: string;
  description: string;
  costCenterId: number | null;
  gtinEanCode: string;
  itemCode: string;

  tagIds: number[];
  linkedEquipmentIds: number[];
  linkedSparePartIds: number[];

  removeImage: boolean;
}