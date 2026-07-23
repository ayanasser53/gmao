import api from './api'

import type {
  SparePart,
  SparePartRequest,
} from '../types/sparePart'

function createFormData(
  request: SparePartRequest,
  image: File | null,
): FormData {
  const formData = new FormData()
  const sparePartBlob = new Blob([JSON.stringify(request)], {
    type: 'application/json',
  })

  formData.append('sparePart', sparePartBlob)

  if (image) {
    formData.append('image', image)
  }

  return formData
}

export async function getSpareParts(): Promise<SparePart[]> {
  const response = await api.get<SparePart[]>('/spare-parts')
  return response.data
}

export async function getSparePartById(id: number): Promise<SparePart> {
  const response = await api.get<SparePart>(`/spare-parts/${id}`)
  return response.data
}

export async function createSparePart(
  request: SparePartRequest,
  image: File | null = null,
): Promise<SparePart> {
  const response = await api.post<SparePart>(
    '/spare-parts',
    createFormData(request, image),
    {
      headers: {
        'Content-Type': 'multipart/form-data',
      },
    },
  )
  return response.data
}

export async function updateSparePart(
  id: number,
  request: SparePartRequest,
  image: File | null = null,
): Promise<SparePart> {
  const response = await api.put<SparePart>(
    `/spare-parts/${id}`,
    createFormData(request, image),
    {
      headers: {
        'Content-Type': 'multipart/form-data',
      },
    },
  )
  return response.data
}

export async function deleteSparePart(id: number): Promise<void> {
  await api.delete(`/spare-parts/${id}`)
}
export type ExternalStockCheck = {
  sparePartId: number
  sparePartName: string
  appQuantity: number
  externalQuantity: number
  inSync: boolean
  checkedAt: string
}

export async function checkExternalStock(
  id: number,
): Promise<ExternalStockCheck> {
  const response = await api.get<ExternalStockCheck>(
    `/spare-parts/${id}/external-stock-check`,
  )
  return response.data
}

export async function checkExternalStockForAll(): Promise<
  ExternalStockCheck[]
> {
  const response = await api.get<ExternalStockCheck[]>(
    '/spare-parts/external-stock-check-all',
  )
  return response.data
}

export async function reconcileStock(
  id: number,
  externalQuantity: number,
): Promise<SparePart> {
  const response = await api.post<SparePart>(
    `/spare-parts/${id}/reconcile-stock`,
    null,
    { params: { externalQuantity } },
  )
  return response.data
}

export type StockMovementHistory = {
  id: number
  sparePartId: number
  sparePartName: string
  sparePartImage: string | null
  taskId: number | null
  taskDescription: string | null
  activityId: number | null
  activityDescription: string | null
  maintenancePlanId: number | null
  maintenancePlanDescription: string | null
  source: string
  movementType: string
  quantity: number
  unitCost: number | null
  userName: string | null
  movementDate: string
}

export async function getStockMovementHistory(params: {
  sparePartId?: number
  startDate?: string
  endDate?: string
  taskId?: number
  activityId?: number
  maintenancePlanId?: number
  userName?: string
}): Promise<StockMovementHistory[]> {
  const response = await api.get<StockMovementHistory[]>(
    '/spare-parts/stock-movements',
    { params },
  )
  return response.data
}