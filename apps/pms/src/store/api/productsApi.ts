import { baseApi } from "./baseApi";
import type { Product } from "@zsyio/types";

export const productsApi = baseApi.injectEndpoints({
  endpoints: (build) => ({
    getProducts: build.query<Product[], string | { clientId?: string } | void>({
      query: (arg) => {
        const clientId = typeof arg === "string" ? arg : arg?.clientId;
        return {
          url: "/products",
          params: clientId ? { clientId } : undefined,
        };
      },
      providesTags: (result) =>
        result
          ? [...result.map((p) => ({ type: "Product" as const, id: p.id })), { type: "Product", id: "LIST" }]
          : [{ type: "Product", id: "LIST" }],
    }),
    getProduct: build.query<Product, string>({
      query: (id) => `/products/${id}`,
      providesTags: (_r, _e, id) => [{ type: "Product", id }],
    }),
    createProduct: build.mutation<Product, Partial<Product>>({
      query: (body) => ({ url: "/products", method: "POST", body }),
      invalidatesTags: [{ type: "Product", id: "LIST" }, { type: "Report" }],
    }),
    updateProduct: build.mutation<Product, { id: string; body: Partial<Product> }>({
      query: ({ id, body }) => ({ url: `/products/${id}`, method: "PATCH", body }),
      invalidatesTags: (_r, _e, { id }) => [
        { type: "Product", id },
        { type: "Product", id: "LIST" },
        { type: "Report" },
      ],
    }),
    deleteProduct: build.mutation<{ success: boolean }, string>({
      query: (id) => ({ url: `/products/${id}`, method: "DELETE" }),
      invalidatesTags: (_r, _e, id) => [
        { type: "Product", id },
        { type: "Product", id: "LIST" },
        { type: "Report" },
      ],
    }),
  }),
});

export const {
  useGetProductsQuery,
  useGetProductQuery,
  useCreateProductMutation,
  useUpdateProductMutation,
  useDeleteProductMutation,
} = productsApi;
