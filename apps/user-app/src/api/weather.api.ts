import { apiClient } from './client';

export const weatherApi = {
  getCurrent: (lat: number, lon: number) =>
    apiClient.get<{ data: any }>('/weather/current', { params: { lat, lon } }),

  getHourly: (lat: number, lon: number) =>
    apiClient.get<{ data: Array<{ time: string; temp: number; description: string; icon: string }> }>(
      '/weather/hourly', { params: { lat, lon } },
    ),
};
