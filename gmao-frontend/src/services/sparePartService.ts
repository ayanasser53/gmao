import api from './api'

import type {
  SparePart,
  SparePartRequest,
} from '../types/sparePart'

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
): Promise<SparePart> {
  const response = await api.post<SparePart>('/spare-parts', request)
  return response.data
}

export async function updateSparePart(
  id: number,
  request: SparePartRequest,
): Promise<SparePart> {
  const response = await api.put<SparePart>(`/spare-parts/${id}`, request)
  return response.data
}

export async function deleteSparePart(id: number): Promise<void> {
  await api.delete(`/spare-parts/${id}`)
}