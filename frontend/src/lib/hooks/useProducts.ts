import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { toast } from "sonner";

const API_BASE = "http://localhost:8000/api/v1/products";

export function useProducts(businessId: string) {
  const queryClient = useQueryClient();

  // Fetch products for this specific business
  const query = useQuery({
    queryKey: ["products", businessId],
    queryFn: async () => {
      const res = await fetch(`${API_BASE}/multi/${businessId}`);
      const json = await res.json();
      if (!json.status) throw new Error(json.message);
      return json.data;
    },
    enabled: !!businessId,
  });

  // Create Product
  const createMutation = useMutation({
    mutationFn: async (newProduct: unknown) => {
      const res = await fetch(`${API_BASE}/create`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ ...newProduct, business_id: businessId }),
      });
      return res.json();
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["products", businessId] });
      toast.success("Product created");
    },
  });

  // Delete Product
  const deleteMutation = useMutation({
    mutationFn: async (productId: string) => {
      const res = await fetch(`${API_BASE}/delete/${productId}`, {
        method: "DELETE",
      });
      return res.json();
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["products", businessId] });
      toast.error("Product deleted");
    },
  });

  return {
    ...query,
    createProduct: createMutation,
    deleteProduct: deleteMutation,
  };
}
