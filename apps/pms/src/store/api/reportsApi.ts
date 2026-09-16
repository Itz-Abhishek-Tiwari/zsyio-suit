import { baseApi } from "./baseApi";

export interface WorkloadUserEntry {
  user: { id: string; name: string; role: string; email: string };
  totalTasks: number;
  doneTasks: number;
  activeTasks: number;
  overdueTasks: number;
  completionRate: number;
  byStatus: { status: string; count: number }[];
}

export interface ClientSummaryItem {
  id: string;
  name: string;
  logoUrl?: string | null;
  status: string;
  domain: string | null;
  contactName: string | null;
  contactEmail: string | null;
  productsCount: number;
  totalTasks: number;
  doneTasks: number;
  blockedTasks: number;
  overdueTasks: number;
  completionRate: number;
}

export interface ProductBreakdownItem {
  id: string;
  name: string;
  imageUrl?: string | null;
  version: string | null;
  environment: string;
  deployedUrl: string | null;
  totalTasks: number;
  doneTasks: number;
  blockedTasks: number;
  completionRate: number;
}

export interface ClientWithProducts {
  id: string;
  name: string;
  logoUrl?: string | null;
  status: string;
  domain: string | null;
  contactName: string | null;
  contactEmail: string | null;
  products: {
    id: string;
    name: string;
    imageUrl?: string | null;
    version: string | null;
    environment: string;
    deployedUrl: string | null;
  }[];
}

export interface AnalyticsReportResponse {
  clientsList: ClientWithProducts[];
  clientSummaries: ClientSummaryItem[];
  productsBreakdown: ProductBreakdownItem[];
  stats: {
    totalTasks: number;
    doneTasks: number;
    blockedTasks: number;
    overdueTasks: number;
    activeTasks: number;
    completionRate: number;
  };
  byStatus: { status: string; count: number }[];
  byPriority: { priority: string; count: number }[];
  byType: { type: string; count: number }[];
  workload: WorkloadUserEntry[];
}

export interface ReportsSummaryResponse {
  workload: WorkloadUserEntry[];
  byPriority: { priority: string; count: number }[];
  byType: { type: string; count: number }[];
  clients: {
    id: string;
    name: string;
    status: string;
    products: { id: string; name: string }[];
  }[];
  stats: {
    totalTasks: number;
    doneTasks: number;
    blockedTasks: number;
    overdueTasks: number;
    activeTasks: number;
    completionRate: number;
  };
}

export interface ClientReportResponse {
  client: ClientWithProducts;
  stats: {
    totalTasks: number;
    doneTasks: number;
    blockedTasks: number;
    overdueTasks: number;
    activeTasks: number;
    completionRate: number;
  };
  byStatus: { status: string; count: number }[];
  byPriority: { priority: string; count: number }[];
  byType: { type: string; count: number }[];
  products: ProductBreakdownItem[];
}

export const reportsApi = baseApi.injectEndpoints({
  endpoints: (build) => ({
    getAnalyticsReport: build.query<
      AnalyticsReportResponse,
      { clientId?: string; productId?: string } | void
    >({
      query: (params) => {
        const query = new URLSearchParams();
        if (params?.clientId) query.set("clientId", params.clientId);
        if (params?.productId) query.set("productId", params.productId);
        const queryString = query.toString();
        return `/reports/analytics${queryString ? `?${queryString}` : ""}`;
      },
      providesTags: (_r, _e, params) => [
        {
          type: "Report",
          id: `ANALYTICS-${params?.clientId || "ALL"}-${params?.productId || "ALL"}`,
        },
      ],
    }),
    getClientReport: build.query<ClientReportResponse, string>({
      query: (clientId) => `/reports/client/${clientId}`,
      providesTags: (_r, _e, clientId) => [{ type: "Report", id: clientId }],
    }),
    getWorkloadReport: build.query<ReportsSummaryResponse, void>({
      query: () => "/reports/workload",
      providesTags: [{ type: "Report", id: "WORKLOAD" }],
    }),
  }),
});

export const {
  useGetAnalyticsReportQuery,
  useGetClientReportQuery,
  useGetWorkloadReportQuery,
} = reportsApi;
