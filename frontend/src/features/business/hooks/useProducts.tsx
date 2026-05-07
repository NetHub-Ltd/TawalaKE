"use client";

import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import axios from "axios";
import { toast } from "sonner"; // Optional: for feedback

// 1. Define Types based on your Schema
export interface BaseAttributes {
  unit_of_measure: string;
  category: string;
  unit_price: number;
}

export interface Product {
  id: string;
  business_id: string;
  name: string;
  price: number;
  stock: number;
  active: boolean;
  attributes: BaseAttributes;
}

export function useProducts(businessId: string) {
  const queryClient = useQueryClient();

  // --- GET ALL PRODUCTS ---
  const productsQuery = useQuery({
    queryKey: ["products", businessId],
    queryFn: async () => {
      const { data } = await axios.get<Product[]>(
        `/api/v1/products?business_id=${businessId}`,
      );
      return data;
    },
    enabled: !!businessId, // Only fetch if we have an ID
  });

  // --- CREATE PRODUCT ---
  const createProduct = useMutation({
    mutationFn: async (newProduct: Partial<Product>) => {
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
    mutationFn: async (update: Partial<Product> & { product_id: string }) => {
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
