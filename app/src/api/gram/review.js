import { api } from "./api";

const reviewApi = api.injectEndpoints({
  endpoints: (build) => ({
    getReview: build.query({
      query: ({ modelId }) => ({ url: `/reviews/${modelId}` }),
      transformResponse: (response, meta, arg) => response.review,
      providesTags: ["Review"],
    }),
    listReviews: build.query({
      query: ({ statuses, properties, page, order, reviewedBy }) => ({
        url: "/reviews/",
        params: {
          statuses,
          properties,
          page,
          "date-order": order,
          reviewedBy,
        },
      }),
      transformResponse: (response, meta, arg) => response,
      providesTags: (result, error, { statuses, page, order }) =>
        result
          ? [
              ...result.items.map(({ modelId }) => ({
                type: "Review",
                id: modelId,
              })),
              { type: "Review", id: "PARTIAL-LIST" },
            ]
          : [{ type: "Review", id: "PARTIAL-LIST" }],
    }),
    createReview: build.mutation({
      query: ({ modelId, reviewedBy }) => ({
        url: `/reviews/${modelId}`,
        method: "POST",
        body: {
          reviewedBy,
        },
      }),
      transformResponse: (response, meta, arg) => response.review,
      invalidatesTags: ["Review", "ModelPermissions", "Models", "System"],
    }),
    updateReview: build.mutation({
      query: ({ modelId, ...fields }) => ({
        url: `/reviews/${modelId}`,
        method: "PATCH",
        body: { ...fields },
      }),
      transformResponse: (response, meta, arg) => response.review,
      invalidatesTags: ["Review", "ModelPermissions"],
    }),
    approveReview: build.mutation({
      query: ({ modelId, ...fields }) => ({
        url: `/reviews/${modelId}/approve`,
        method: "POST",
        body: { ...fields },
      }),
      transformResponse: (response, meta, arg) => response.review,
      invalidatesTags: ["Review", "ModelPermissions", "Models", "System"],
    }),
    declineReview: build.mutation({
      query: ({ modelId, ...fields }) => ({
        url: `/reviews/${modelId}/decline`,
        method: "POST",
        body: { ...fields },
      }),
      transformResponse: (response, meta, arg) => response.review,
      invalidatesTags: ["Review", "ModelPermissions", "Models", "System"],
    }),
    cancelReview: build.mutation({
      query: ({ modelId, ...fields }) => ({
        url: `/reviews/${modelId}/cancel`,
        method: "POST",
        body: { ...fields },
      }),
      transformResponse: (response, meta, arg) => response.review,
      invalidatesTags: ["Review", "ModelPermissions", "Models", "System"],
    }),
    requestReviewMeeting: build.mutation({
      query: ({ modelId }) => ({
        url: `/reviews/${modelId}/request-meeting`,
        method: "POST",
      }),
      transformResponse: (response, meta, arg) => response.review,
      invalidatesTags: ["Review", "ModelPermissions", "Models", "System"],
    }),
    changeReviewer: build.mutation({
      query: ({ modelId, newReviewer }) => ({
        url: `/reviews/${modelId}/change-reviewer`,
        method: "POST",
        body: {
          newReviewer,
        },
      }),
      transformResponse: (response, meta, arg) => response.review,
      invalidatesTags: ["Review", "ModelPermissions", "Models", "System"],
    }),
    reviewers: build.query({
      query: ({ modelId }) => ({
        url: `/reviews/reviewers`,
        params: { modelId },
      }),
      providesTags: (result, error, { modelId }) => [
        { type: "Reviewers", id: modelId },
      ],
      transformResponse: (response, meta, arg) => response.reviewers,
    }),
  }),
});

export const {
  useGetReviewQuery,
  useListReviewsQuery,
  useCreateReviewMutation,
  useUpdateReviewMutation,
  useApproveReviewMutation,
  useDeclineReviewMutation,
  useCancelReviewMutation,
  useRequestReviewMeetingMutation,
  useReviewersQuery,
  useChangeReviewerMutation,
} = reviewApi;
