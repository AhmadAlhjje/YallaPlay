import { apiClient } from './client';

export const weatherApi = {
  getCurrent: (lat: number, lon: number) =>
    apiClient.get<{ data: any }>('/weather/current', { params: { lat, lon } }),
};
