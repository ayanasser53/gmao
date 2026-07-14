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