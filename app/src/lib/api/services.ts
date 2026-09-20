import { apiClient } from './client';

export const post = async <T, V>(url: string, data: V): Promise<T> => {
  const response = await apiClient.post<T>(url, data);
  return response.data;
};
