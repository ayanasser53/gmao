export type SparePartVisibility = 'PRIVATE' | 'PUBLIC'

export type SparePart = {
  id: number
  name: string
  description: string | null
  code: string | null
  manufacturerReference: string | null
  brand: string | null
  imageUrl: string | null
  unitPrice: number
  currency: string
  quantity: number
  minimumStock: number
  maximumStock: number
  reorderQuantity: number
  location: string | null
  costCenter: string | null
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
  imageUrl: string
  unitPrice: number
  currency: string
  quantity: number
  minimumStock: number
  maximumStock: number
  reorderQuantity: number
  location: string
  costCenter: string
  gtin: string
  articleCode: string
  visibility: SparePartVisibility
  supplierId: number | null
}