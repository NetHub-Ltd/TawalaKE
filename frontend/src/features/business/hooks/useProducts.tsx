// "use client";

// import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
// import axios from "axios";
// import { toast } from "sonner";
// import { ProductResponse, ProductCreate } from "@/lib/api/generated/models";

// export function useProducts(businessId: string, productId?: string) {
//   const queryClient = useQueryClient();

//   const CACHE_CONFIG = {
//     staleTime: 1000 * 60 * 5, // 5 minutes fresh cache
//     gcTime: 1000 * 60 * 15,
//   };

//   const productsQuery = useQuery({
//     queryKey: productId 
//       ? ["product", businessId, productId] 
//       : ["products", businessId],
//     queryFn: async () => {
//       const url = productId
//         ? `/api/v1/products?business_id=${businessId}&product_id=${productId}`
//         : `/api/v1/products?business_id=${businessId}`;

//       const res = await axios.get<ProductResponse[] | ProductResponse>(url);
//       return res.data; // This is the array or object returned by your Next.js route handler
//     },
//     enabled: !!businessId,
//     ...CACHE_CONFIG,
//   });

//   // --- MUTATIONS (createProduct, updateProduct, deleteProduct stay exactly the same) ---
//   const updateProduct = useMutation({
//     mutationFn: async (update: Partial<ProductResponse>) => {
//       const { data } = await axios.patch("/api/v1/products", update);
//       return data;
//     },
//     onSuccess: () => {
//       queryClient.invalidateQueries({ queryKey: ["products", businessId] });
//       if (productId) {
//         queryClient.invalidateQueries({ queryKey: ["product", businessId, productId] });
//       }
//       toast.success("Product updated");
//     },
//   });

//   const createProduct = useMutation({
//     mutationFn: async (newProduct: Partial<ProductCreate>) => {
//       const { data } = await axios.post("/api/v1/products", newProduct);
//       return data;
//     },
//     onSuccess: () => {
//       queryClient.invalidateQueries({ queryKey: ["products", businessId] });
//       toast.success("Product added successfully");
//     },
//   });

//   const deleteProduct = useMutation({
//     mutationFn: async (targetId: string) => {
//       const { data } = await axios.delete(`/api/v1/products`, { data: { product_id: targetId } });
//       return data;
//     },
//     onSuccess: () => {
//       queryClient.invalidateQueries({ queryKey: ["products", businessId] });
//     },
//   });

//   const queryData = productsQuery.data;
//   console.log("this is running inside useProducts", queryData)
//   const isArray = Array.isArray(queryData);
//   console.log("isArray", queryData)

//   return {
//     // Standardize mapping extraction layer cleanly
//     products: isArray ? (queryData as ProductResponse[]) : [],
//     product: !isArray && queryData ? (queryData as ProductResponse) : undefined,
//     isLoading: productsQuery.isLoading,
//     isError: productsQuery.isError,
//     createProduct,
//     updateProduct,
//     deleteProduct,
//     queryClient, // <-- Return this to allow ad-hoc invalidation controls downstream
//   };
// }

"use client";

import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import axios from "axios";
import { toast } from "sonner";
import { ProductResponse, ProductCreate } from "@/lib/api/generated/models";

/**
 * Custom hook to handle multi-tenant product data fetching, pagination matrices, and mutations.
 * Appends pagination parameters as optional trailing inputs to prevent any breaking changes 
 * across existing layout implementations.
 */
export function useProducts(
  businessId: string, 
  productId?: string,
  skip: number = 0,
  limit: number = 50
) {
  const queryClient = useQueryClient();

  const CACHE_CONFIG = {
    staleTime: 1000 * 60 * 5, // 5 minutes fresh cache visibility matrix
    gcTime: 1000 * 60 * 15,
  };

  // Build the deterministic cache key including pagination parameters for lists
  const queryKey = productId 
    ? ["product", businessId, productId] 
    : ["products", businessId, { skip, limit }];

  const productsQuery = useQuery({
    queryKey,
    queryFn: async () => {
      // Forward skip and limit down to the proxy handler when pulling listings
      const url = productId
        ? `/api/v1/products?business_id=${businessId}&product_id=${productId}`
        : `/api/v1/products?business_id=${businessId}&skip=${skip}&limit=${limit}`;

      const res = await axios.get<ProductResponse[] | ProductResponse>(url);
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
    // Invalidates specific pagination entries matching this query key structure
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
  const isArray = Array.isArray(queryData);

  return {
    products: isArray ? (queryData as ProductResponse[]) : [],
    product: !isArray && queryData ? (queryData as ProductResponse) : undefined,
    isLoading: productsQuery.isLoading,
    isError: productsQuery.isError,
    isFetching: productsQuery.isFetching, // Exposed to provide low-level sync state cues
    createProduct,
    updateProduct,
    deleteProduct,
    refresh, // Safe manual invalidation pass-through
    queryClient,
  };
}