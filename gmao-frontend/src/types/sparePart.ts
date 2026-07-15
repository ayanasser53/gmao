export type SparePartVisibility = "PUBLIC" | "PRIVATE"

export type LinkedEquipment = {
  id: number
  name: string
  description: string | null
  image: string | null
}

export type LinkedSparePart = {
  id: number
  name: string
  code: string | null
  image: string | null
}

export type StockMovement = {
  id: number
  source: string
  reference: string | null
  movementType: string
  quantity: number
  unitCost: number | null
  userName: string | null
  movementDate: string
}

export type SparePart = {
  id: number
  name: string
  description: string | null
  code: string | null
  manufacturerReference: string | null
  brand: string | null
  image: string | null
  unitPrice: number
  currency: string | null
  quantity: number
  minimumStock: number
  maximumStock: number
  reorderQuantity: number
  location: string | null
  costCenterId: number | null
  gtin: string | null
  articleCode: string | null
  visibility: SparePartVisibility
  supplierId: number | null
  supplierName: string | null
  linkedEquipments: LinkedEquipment[]
  linkedSpareParts: LinkedSparePart[]
  stockMovements: StockMovement[]
  createdAt: string
  updatedAt: string
}

export type SparePartRequest = {
  name: string
  description: string
  code: string
  manufacturerReference: string
  brand: string
  image: string
  unitPrice: number
  currency: string
  quantity: number
  minimumStock: number
  maximumStock: number
  reorderQuantity: number
  location: string
  costCenterId: number | null
  gtin: string
  articleCode: string
  visibility: SparePartVisibility
  supplierId: number | null
  linkedEquipmentIds: number[]
  linkedSparePartIds: number[]
}
