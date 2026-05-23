// "use client";

// import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
// import axios from "axios";
// import { toast } from "sonner";
// import { ProductResponse, ProductCreate } from "@/lib/api/generated/models";

// // =========================================================================
// // UNIFIED PRODUCTS HOOK (WITH OPTIONAL SINGLE-PRODUCT ROUTING & SMART CACHING)
// // =========================================================================
// export function useProducts(businessId: string, productId?: string) {
//   const queryClient = useQueryClient();

//   // --- ADJUSTABLE CACHE LIFECYCLE PARAMETERS ---
//   const CACHE_CONFIG = {
//     staleTime: 1000 * 60 * 5, // 5 minutes: Data stays "fresh". No background refetches on remounting.
//     gcTime: 1000 * 60 * 15,    // 15 minutes: Keeps data in dead-cache memory before garbage collection.
//   };

//   // --- UNIFIED GET QUERY ---
//   const productsQuery = useQuery({
//     // Cache keys are segregated automatically based on whether a productId parameter exists
//     queryKey: productId 
//       ? ["product", businessId, productId] 
//       : ["products", businessId],
    
//     queryFn: async () => {
//       // Build request query line based on specified targets
//       const url = productId
//         ? `/api/v1/products?business_id=${businessId}&product_id=${productId}`
//         : `/api/v1/products?business_id=${businessId}`;

//       const res = await axios.get<ProductResponse[] | ProductResponse>(url);
//       console.debug("fetched data at useproduct:", res.data);
//       return res.data;
//     },
//     enabled: !!businessId,
//     ...CACHE_CONFIG,
//   });

//   // --- CREATE PRODUCT ---
//   const createProduct = useMutation({
//     mutationFn: async (newProduct: Partial<ProductCreate>) => {
//       const { data } = await axios.post("/api/v1/products", newProduct);
//       return data;
//     },
//     onSuccess: () => {
//       // Invalidate everything product-related to flush stale records completely
//       queryClient.invalidateQueries({ queryKey: ["products", businessId] });
//       toast.success("Product added successfully");
//     },
//     onError: (error: any) => {
//       toast.error(error.response?.data?.error || "Failed to add product");
//     },
//   });

//   // --- UPDATE PRODUCT ---
//   const updateProduct = useMutation({
//     mutationFn: async (update: Partial<ProductResponse>) => {
//       const { data } = await axios.patch("/api/v1/products", update);
//       return data;
//     },
//     onSuccess: () => {
//       // 1. Immediately refresh the general summary list query cache
//       queryClient.invalidateQueries({ queryKey: ["products", businessId] });
      
//       // 2. Proactively refresh the precise individual single item cache node
//       if (productId) {
//         queryClient.invalidateQueries({ queryKey: ["product", businessId, productId] });
//       }
      
//       toast.success("Product updated");
//     },
//   });

//   // --- DELETE PRODUCT ---
//   const deleteProduct = useMutation({
//     mutationFn: async (targetId: string) => {
//       const { data } = await axios.delete(`/api/v1/products`, {
//         data: { product_id: targetId },
//       });
//       return data;
//     },
//     onSuccess: (data, targetId) => {
//       queryClient.invalidateQueries({ queryKey: ["products", businessId] });
//       queryClient.removeQueries({ queryKey: ["product", businessId, targetId] });
//       toast.success("Product removed");
//     },
//   });

//   // Safely evaluate data layout context shapes returning exact models
//   const data = productsQuery.data;
//   const isArray = Array.isArray(data);

//   return {
//     products: isArray ? (data as ProductResponse[]) : [],
//     product: !isArray && data ? (data as ProductResponse) : undefined,
//     isLoading: productsQuery.isLoading,
//     isError: productsQuery.isError,
//     createProduct,
//     updateProduct,
//     deleteProduct,
//   };
// }


"use client";

import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import axios from "axios";
import { toast } from "sonner";
import { ProductResponse, ProductCreate } from "@/lib/api/generated/models";

export function useProducts(businessId: string, productId?: string) {
  const queryClient = useQueryClient();

  const CACHE_CONFIG = {
    staleTime: 1000 * 60 * 5, // 5 minutes fresh cache
    gcTime: 1000 * 60 * 15,
  };

  const productsQuery = useQuery({
    queryKey: productId 
      ? ["product", businessId, productId] 
      : ["products", businessId],
    queryFn: async () => {
      const url = productId
        ? `/api/v1/products?business_id=${businessId}&product_id=${productId}`
        : `/api/v1/products?business_id=${businessId}`;

      const res = await axios.get<ProductResponse[] | ProductResponse>(url);
      return res.data; // This is the array or object returned by your Next.js route handler
    },
    enabled: !!businessId,
    ...CACHE_CONFIG,
  });

  // --- MUTATIONS (createProduct, updateProduct, deleteProduct stay exactly the same) ---
  const updateProduct = useMutation({
    mutationFn: async (update: Partial<ProductResponse>) => {
      const { data } = await axios.patch("/api/v1/products", update);
      return data;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["products", businessId] });
      if (productId) {
        queryClient.invalidateQueries({ queryKey: ["product", businessId, productId] });
      }
      toast.success("Product updated");
    },
  });

  const createProduct = useMutation({
    mutationFn: async (newProduct: Partial<ProductCreate>) => {
      const { data } = await axios.post("/api/v1/products", newProduct);
      return data;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["products", businessId] });
      toast.success("Product added successfully");
    },
  });

  const deleteProduct = useMutation({
    mutationFn: async (targetId: string) => {
      const { data } = await axios.delete(`/api/v1/products`, { data: { product_id: targetId } });
      return data;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["products", businessId] });
    },
  });

  const queryData = productsQuery.data;
  const isArray = Array.isArray(queryData);

  return {
    // Standardize mapping extraction layer cleanly
    products: isArray ? (queryData as ProductResponse[]) : [],
    product: !isArray && queryData ? (queryData as ProductResponse) : undefined,
    isLoading: productsQuery.isLoading,
    isError: productsQuery.isError,
    createProduct,
    updateProduct,
    deleteProduct,
  };
}