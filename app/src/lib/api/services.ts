import { apiClient } from './client';

export const post = async <T, V>(url: string, data: V): Promise<T> => {
  try {
    const response = await apiClient.post<T>(url, data);
    return response.data;
  } catch (error) {
    console.error(`Error posting to ${url}:`, error);
    throw error;
  }
};
