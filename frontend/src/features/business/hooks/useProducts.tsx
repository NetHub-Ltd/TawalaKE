"use client";

import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import axios from "axios";
import { toast } from "sonner";
import { ProductResponse, ProductCreate } from "@/lib/api/generated/models";

// Define the updated structured layout returned by our Next.js Route Handler proxy
interface PaginatedMetadata {
  total: number;
  page: number;
  size: number;
  pages: number;
}

interface PaginatedProxyResponse {
  data: ProductResponse[];
  pagination: PaginatedMetadata;
}

/**
 * Custom hook to handle multi-tenant product data fetching, pagination matrices, and mutations.
 * Supports page-indexed tracking alongside dynamic sort attributes.
 */
export function useProducts(
  businessId: string, 
  productId?: string,
  page: number = 1,
  limit: number = 50,
  sortBy?: string,
  sortOrder: "asc" | "desc" = "desc"
) {
  const queryClient = useQueryClient();

  const CACHE_CONFIG = {
    staleTime: 1000 * 60 * 5, // 5 minutes fresh cache visibility matrix
    gcTime: 1000 * 60 * 15,
  };

  // Build a highly deterministic cache key containing pagination and sorting state matrices
  const queryKey = productId 
    ? ["product", businessId, productId] 
    : ["products", businessId, { page, limit, sortBy, sortOrder }];

  const productsQuery = useQuery({
    queryKey,
    queryFn: async () => {
      if (productId) {
        const url = `/api/v1/products?business_id=${businessId}&product_id=${productId}`;
        const res = await axios.get<ProductResponse>(url);
        return res.data;
      }

      // Construct matching query parameters to feed our refined Next.js Route Handler
      const params = new URLSearchParams({
        business_id: businessId,
        page: page.toString(),
        limit: limit.toString(),
        sort_order: sortOrder,
      });

      if (sortBy) {
        params.append("sort_by", sortBy);
      }

      const url = `/api/v1/products?${params.toString()}`;
      const res = await axios.get<PaginatedProxyResponse>(url);
      return res.data;
    },
    enabled: !!businessId,
    ...CACHE_CONFIG,
  });

  /**
   * Manual refresh capability that targets both current exact listing pages 
   * and broad collection matrices cleanly without forcing global state resets.
   */
  const refresh = async () => {
    await queryClient.invalidateQueries({ queryKey: ["products", businessId] });
    if (productId) {
      await queryClient.invalidateQueries({ queryKey: ["product", businessId, productId] });
    }
  };

  // --- MUTATIONS ---
  const updateProduct = useMutation({
    mutationFn: async (update: Partial<ProductResponse>) => {
      const { data } = await axios.patch("/api/v1/products", update);
      return data;
    },
    onSuccess: async () => {
      await refresh();
      toast.success("Product updated");
    },
  });

  const createProduct = useMutation({
    mutationFn: async (newProduct: Partial<ProductCreate>) => {
      const { data } = await axios.post("/api/v1/products", newProduct);
      return data;
    },
    onSuccess: async () => {
      await refresh();
      toast.success("Product added successfully");
    },
  });

  const deleteProduct = useMutation({
    mutationFn: async (targetId: string) => {
      const { data } = await axios.delete(`/api/v1/products`, { data: { product_id: targetId } });
      return data;
    },
    onSuccess: async () => {
      await refresh();
      toast.success("Product removed successfully");
    },
  });

  const queryData = productsQuery.data;

  // Determine if response is single item or paginated dataset package
  const isPaginatedResponse = queryData && typeof queryData === "object" && "pagination" in queryData;

  return {
    products: isPaginatedResponse ? (queryData as PaginatedProxyResponse).data : [],
    pagination: isPaginatedResponse ? (queryData as PaginatedProxyResponse).pagination : undefined,
    product: !isPaginatedResponse && queryData ? (queryData as ProductResponse) : undefined,
    isLoading: productsQuery.isLoading,
    isError: productsQuery.isError,
    isFetching: productsQuery.isFetching,
    createProduct,
    updateProduct,
    deleteProduct,
    refresh,
    queryClient,
  };
}