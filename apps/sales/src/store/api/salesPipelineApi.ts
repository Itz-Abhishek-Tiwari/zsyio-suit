import { baseApi } from "./baseApi";
import type { SalesPipeline } from "@zsyio/types";

export const salesPipelineApi = baseApi.injectEndpoints({
  endpoints: (build) => ({
    getDefaultPipeline: build.query<SalesPipeline, void>({
      query: () => "/sales/pipeline",
      providesTags: [{ type: "SalesPipeline", id: "DEFAULT" }],
    }),
    createPipelineStage: build.mutation<SalesPipeline, Record<string, unknown>>({
      query: (body) => ({ url: "/sales/pipeline/stages", method: "POST", body }),
      invalidatesTags: [{ type: "SalesPipeline", id: "DEFAULT" }],
    }),
  }),
});

export const {
  useGetDefaultPipelineQuery,
  useCreatePipelineStageMutation,
} = salesPipelineApi;
