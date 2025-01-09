import { createApi, fetchBaseQuery } from "@reduxjs/toolkit/query/react";
import { Document } from "~/types/documents";
import { SearchResult } from "~/types/search";
import { DocumentStats } from "~/types/documents";

function getRagApiEndpoint() {
  return typeof window !== "undefined" ? window?.ENV?.RAG_API_ENDPOINT : "";
}

export const api = createApi({
  reducerPath: "ragApi",
  baseQuery: fetchBaseQuery({
    baseUrl: getRagApiEndpoint(),
    prepareHeaders: (headers, { getState }) => {
      // Add any required headers here
      return headers;
    },
  }),
  tagTypes: ["Document", "DocumentStats"],
  endpoints: (builder) => ({
    processDocument: builder.mutation<
      Document,
      { bucket: string; key: string; force_reload?: boolean }
    >({
      query: (body) => ({
        url: "/documents/process",
        method: "POST",
        body,
      }),
    }),

    getDocumentStats: builder.query<DocumentStats[], void>({
      query: () => `/documents/stats`,
      providesTags: (result) =>
        result
          ? result.map(({ document_id }) => ({
              type: "DocumentStats" as const,
              id: document_id,
            }))
          : [{ type: "DocumentStats" as const, id: "LIST" }],
    }),

    getDocumentJob: builder.query<Document, string>({
      query: (jobId) => `/documents/jobs/${jobId}`,
      providesTags: (result, error, jobId) => [{ type: "Document", id: jobId }],
    }),

    search: builder.mutation<
      { results: SearchResult[] },
      { query: string; limit: number }
    >({
      query: (body) => ({
        url: `/search`,
        method: "POST",
        body,
      }),
    }),
  }),
});

export const {
  useProcessDocumentMutation,
  useGetDocumentJobQuery,
  useSearchMutation,
  useGetDocumentStatsQuery,
} = api;
