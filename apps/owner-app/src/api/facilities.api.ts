import { Platform } from 'react-native';
import { apiClient } from './client';

export const facilitiesApi = {
  getMyFacilities: () =>
    apiClient.get<{ data: any[] }>('/facilities/owner/my-facilities'),

  getById: (id: string) =>
    apiClient.get<{ data: any }>(`/facilities/${id}`),

  create: (dto: any) =>
    apiClient.post<{ data: any }>('/facilities', dto),

  update: (id: string, dto: any) =>
    apiClient.patch<{ data: any }>(`/facilities/${id}`, dto),

  softDelete: (id: string) =>
    apiClient.delete(`/facilities/${id}`),

  getSlots: (id: string, date: string) =>
    apiClient.get<{ data: any[] }>(`/facilities/${id}/slots`, { params: { date } }),

  uploadQr: async (uri: string) => {
    const filename = uri.split('/').pop() ?? 'qr.jpg';
    const ext      = filename.split('.').pop()?.toLowerCase() ?? 'jpg';
    const mime     = ext === 'png' ? 'image/png' : 'image/jpeg';
    const formData = new FormData();

    if (Platform.OS === 'web') {
      // On web, fetch the blob from the object URL and append as a File
      const response = await fetch(uri);
      const blob     = await response.blob();
      formData.append('file', new File([blob], filename, { type: mime }));
    } else {
      // React Native native: append as { uri, name, type }
      formData.append('file', { uri, name: filename, type: mime } as any);
    }

    // Do NOT set Content-Type manually — the browser/RN will include the multipart boundary
    return apiClient.post<{ data: { url: string } }>('/facilities/upload/qr', formData);
  },
};
