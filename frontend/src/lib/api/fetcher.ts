import axios, { type AxiosRequestConfig } from "axios";

// All requests now go through Next.js proxy layer
export const AXIOS_INSTANCE = axios.create({
  baseURL: process.env.NEXT_PUBLIC_FETCHER_URL, // ✅ key change: Next.js handles /api routing
  withCredentials: true,
});

export const customFetcher = async <T>(
  config: AxiosRequestConfig,
): Promise<T> => {
  const response = await AXIOS_INSTANCE({
    ...config,
  });

  return response.data;
};