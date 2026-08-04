// Parent File Import: features/products/components/ProductCatalogView.tsx (or any feature component importing useProducts)
"use client";

import { useQuery, useMutation, useQueryClient, keepPreviousData } from "@tanstack/react-query";
import axios from "axios";
import { toast } from "sonner";
import { ProductResponse, ProductCreate } from "@/lib/api/generated/models";

export interface PaginatedMetadata {
  total: number;
  page: number;
  size: number;
  pages: number;
}

export interface PaginatedProxyResponse {
  data: ProductResponse[];
  pagination: PaginatedMetadata;
}

export function useProducts(
  businessId: string,
  productId?: string,
  page: number = 1,
  limit: number = 50,
  sortBy?: string,
  sortOrder: "asc" | "desc" = "desc",
  search?: string
) {
  const queryClient = useQueryClient();
  const trimmedSearch = search?.trim() ?? "";
  const isSearchMode = !productId && trimmedSearch.length > 0;

  const CACHE_CONFIG = {
    staleTime: 1000 * 60 * 5,
    gcTime: 1000 * 60 * 15,
  };

  const queryKey = productId
    ? ["products", businessId, "detail", productId]
    : [
        "products",
        businessId,
        isSearchMode ? "search" : "list",
        { page, limit, sortBy, sortOrder, search: trimmedSearch },
      ];

  const productsQuery = useQuery({
    queryKey,
    queryFn: async () => {
      if (productId) {
        const params = new URLSearchParams({
          business_id: businessId,
          product_id: productId,
        });
        const res = await axios.get<ProductResponse>(`/api/v1/products?${params.toString()}`);
        return res.data;
      }

      const params = new URLSearchParams({
        business_id: businessId,
        page: page.toString(),
        limit: limit.toString(),
        sort_order: sortOrder,
      });

      if (sortBy) {
        params.append("sort_by", sortBy);
      }

      let endpoint = "/api/v1/products";

      if (isSearchMode) {
        endpoint = "/api/v1/products/search";
        params.append("search_query", trimmedSearch);
      }

      const res = await axios.get<PaginatedProxyResponse>(`${endpoint}?${params.toString()}`);
      return res.data;
    },
    enabled: Boolean(businessId),
    placeholderData: productId ? undefined : keepPreviousData,
    ...CACHE_CONFIG,
  });

  const refresh = async () => {
    await queryClient.invalidateQueries({ queryKey: ["products", businessId] });
  };

  const updateProduct = useMutation({
    mutationFn: async (update: Partial<ProductResponse>) => {
      const { data } = await axios.patch<ProductResponse>("/api/v1/products", update);
      return data;
    },
    onSuccess: async () => {
      await refresh();
      toast.success("Product updated successfully");
    },
    onError: (error) => {
      const message = axios.isAxiosError(error)
        ? error.response?.data?.message || "Failed to update product"
        : "An unexpected error occurred";
      toast.error(message);
    },
  });

  const createProduct = useMutation({
    mutationFn: async (newProduct: Partial<ProductCreate>) => {
      const { data } = await axios.post<ProductResponse>("/api/v1/products", newProduct);
      return data;
    },
    onSuccess: async () => {
      await refresh();
      toast.success("Product created successfully");
    },
    onError: (error) => {
      const message = axios.isAxiosError(error)
        ? error.response?.data?.message || "Failed to create product"
        : "An unexpected error occurred";
      toast.error(message);
    },
  });

  const deleteProduct = useMutation({
    mutationFn: async (targetId: string) => {
      const { data } = await axios.delete<{ success: boolean }>("/api/v1/products", {
        data: { product_id: targetId },
      });
      return data;
    },
    onSuccess: async () => {
      await refresh();
      toast.success("Product removed successfully");
    },
    onError: (error) => {
      const message = axios.isAxiosError(error)
        ? error.response?.data?.message || "Failed to delete product"
        : "An unexpected error occurred";
      toast.error(message);
    },
  });

  const rawData = productsQuery.data as unknown as Record<string, unknown> | undefined;

  // Defensive array extraction: maintains compatibility regardless of client expectation
  const resolvedProducts: ProductResponse[] = (() => {
    if (!rawData) return [];
    if (Array.isArray(rawData)) return rawData as ProductResponse[];
    if (Array.isArray(rawData.data)) return rawData.data as ProductResponse[];
    if (Array.isArray(rawData.records)) return rawData.records as ProductResponse[];
    return [];
  })();

  // Defensive pagination extraction: supports both nested object & top-level total callers
  const resolvedPagination: PaginatedMetadata | undefined = (() => {
    if (rawData && typeof rawData === "object" && "pagination" in rawData && rawData.pagination) {
      return rawData.pagination as PaginatedMetadata;
    }
    if (rawData && typeof rawData.total === "number") {
      return {
        total: rawData.total as number,
        page,
        size: limit,
        pages: Math.ceil((rawData.total as number) / limit) || 1,
      };
    }
    return undefined;
  })();

  return {
    // Primary datasets
    products: resolvedProducts,
    data: resolvedProducts, // Backwards-compatible alias for callers destructuring 'data'
    pagination: resolvedPagination,
    total: resolvedPagination?.total ?? 0, // Backwards-compatible direct scalar access

    // Detail mode product
    product: !Array.isArray(rawData) && rawData && !("data" in rawData) && !("records" in rawData)
      ? (rawData as unknown as ProductResponse)
      : undefined,

    // Query state indicators
    isLoading: productsQuery.isLoading,
    isError: productsQuery.isError,
    isFetching: productsQuery.isFetching,
    error: productsQuery.error,

    // Operational methods
    refresh,
    refetch: productsQuery.refetch, // Backwards-compatible alias for callers using TanStack 'refetch'
    createProduct,
    updateProduct,
    deleteProduct,
    queryClient,
  };
}