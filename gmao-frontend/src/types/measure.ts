import type { UnitType } from "./unit";

export interface Measure {
  id: number;
  name: string;
  code: string;
  description: string | null;

  unitId: number;
  unitName: string;
  unitSymbol: string;
  unitType: UnitType;

  createdAt: string;
  updatedAt: string;
}

export interface CreateMeasureRequest {
  name: string;
  code: string;
  description: string;
  unitId: number;
}

export interface UpdateMeasureRequest {
  name: string;
  code: string;
  description: string;
  unitId: number;
}