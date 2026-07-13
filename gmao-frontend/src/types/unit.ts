export type UnitType = "NUMBER" | "TEXT";

export interface MeasurementUnit {
  id: number;
  name: string;
  symbol: string;
  code: string;
  unitType: UnitType;
  createdAt: string;
  updatedAt: string;
}

export interface CreateUnitRequest {
  name: string;
  symbol: string;
  code: string;
  unitType: UnitType;
}

export interface UpdateUnitRequest {
  name: string;
  symbol: string;
  code: string;
  unitType: UnitType;
}