export type SparePartVisibility = 'PRIVATE' | 'PUBLIC'

export type SparePart = {
  id: number
  name: string
  description: string | null
  code: string | null
  manufacturerReference: string | null
  brand: string | null
  image: string | null
  unitPrice: number
  currency: string
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
}