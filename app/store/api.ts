import { createApi, fetchBaseQuery } from "@reduxjs/toolkit/query/react";
import { Document } from "~/types/documents";

export const api = createApi({
  reducerPath: "minervaApi",
  baseQuery: fetchBaseQuery({
    baseUrl: "https://minerva.alexlazar.dev/api/v1",
    prepareHeaders: (headers, { getState }) => {
      // Add any required headers here
      return headers;
    },
  }),
  tagTypes: ["Document"],
  endpoints: (builder) => ({
    processDocument: builder.mutation<
      Document,
      { bucket: string; key: string; force_reload: boolean }
    >({
      query: (body) => ({
        url: "/documents/process",
        method: "POST",
        body,
      }),
    }),

    getDocumentJob: builder.query<Document, string>({
      query: (jobId) => `/documents/jobs/${jobId}`,
      providesTags: (result, error, jobId) => [{ type: "Document", id: jobId }],
    }),

    search: builder.mutation<any, { query: string; limit: number }>({
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
} = api;
