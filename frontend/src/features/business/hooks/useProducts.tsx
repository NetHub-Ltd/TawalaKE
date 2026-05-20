"use client";

import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import axios from "axios";
import { toast } from "sonner"; // Optional: for feedback
import { ProductResponse } from "@/lib/api/generated/models";
import {ProductCreate} from "@/lib/api/generated/models"

export function useProducts(businessId: string) {
  const queryClient = useQueryClient();

  // --- GET ALL PRODUCTS ---
  const productsQuery = useQuery({
    queryKey: ["products", businessId],
    queryFn: async () => {
      const { data } = await axios.get<ProductResponse[]>(
        `/api/v1/products?business_id=${businessId}`,
      );
      return data;
    },
    enabled: !!businessId, // Only fetch if we have an ID
  });

  // --- CREATE PRODUCT ---
  const createProduct = useMutation({
    mutationFn: async (newProduct: Partial<ProductCreate>) => {
      const { data } = await axios.post("/api/v1/products", newProduct);
      return data;
    },
    onSuccess: () => {
      // Refresh the list immediately
      queryClient.invalidateQueries({ queryKey: ["products", businessId] });
      toast.success("Product added successfully");
    },
    onError: (error: any) => {
      toast.error(error.response?.data?.error || "Failed to add product");
    },
  });

  // --- UPDATE PRODUCT ---
  const updateProduct = useMutation({
    mutationFn: async (update: Partial<ProductResponse>) => {
      console.log("Updating product with data:", update);
      const { data } = await axios.patch("/api/v1/products", update);
      return data;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["products", businessId] });
      toast.success("Product updated");
    },
  });

  // --- DELETE PRODUCT ---
  const deleteProduct = useMutation({
    mutationFn: async (productId: string) => {
      const { data } = await axios.delete(`/api/v1/products`, {
        data: { product_id: productId },
      });
      console.log("data", data)
      return data;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["products", businessId] });
      toast.success("Product removed");
    },
  });

  return {
    products: productsQuery.data || [],
    isLoading: productsQuery.isLoading,
    isError: productsQuery.isError,
    createProduct,
    updateProduct,
    deleteProduct,
  };
}
