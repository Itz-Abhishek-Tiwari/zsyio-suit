import { baseApi } from "./baseApi";
import type { NoteTemplate } from "@zsyio/editor";

import type {
  NoteItem,
  FolderItem,
  NoteShareItem,
  FolderShareItem,
  NotesTreeResponse,
} from "@zsyio/types";

export type {
  NoteItem,
  FolderItem,
  NoteShareItem,
  FolderShareItem,
  NotesTreeResponse,
};

export const notesApi = baseApi.injectEndpoints({
  endpoints: (builder) => ({
    getNotesTree: builder.query<NotesTreeResponse, { q?: string } | void>({
      query: (params) => ({
        url: "/notes",
        params: params ? { q: params.q } : undefined,
      }),
      providesTags: (result) =>
        result
          ? [
              { type: "Note", id: "TREE" },
              { type: "NoteFolder", id: "TREE" },
              ...result.notes.map((n) => ({ type: "Note" as const, id: n.id })),
              ...result.folders.map((f) => ({ type: "NoteFolder" as const, id: f.id })),
            ]
          : [{ type: "Note", id: "TREE" }],
    }),

    getNote: builder.query<NoteItem, string>({
      query: (id) => `/notes/${id}`,
      providesTags: (_res, _err, id) => [{ type: "Note", id }],
    }),

    createNote: builder.mutation<NoteItem, {
      title?: string;
      content?: string;
      icon?: string;
      coverImage?: string;
      folderId?: string | null;
      generalAccess?: "INHERIT" | "PRIVATE" | "WORKSPACE_VIEW" | "WORKSPACE_EDIT";
      templateId?: string;
    }>({
      query: (body) => ({
        url: "/notes",
        method: "POST",
        body,
      }),
      invalidatesTags: [
        { type: "Note", id: "TREE" },
        { type: "NoteFolder", id: "TREE" },
      ],
    }),

    updateNote: builder.mutation<NoteItem, {
      id: string;
      title?: string;
      content?: string;
      icon?: string | null;
      coverImage?: string | null;
      folderId?: string | null;
      isPinned?: boolean;
      isArchived?: boolean;
      generalAccess?: "INHERIT" | "PRIVATE" | "WORKSPACE_VIEW" | "WORKSPACE_EDIT";
    }>({
      query: ({ id, ...body }) => ({
        url: `/notes/${id}`,
        method: "PATCH",
        body,
      }),
      invalidatesTags: (_res, _err, { id }) => [
        { type: "Note", id },
        { type: "Note", id: "TREE" },
        { type: "NoteFolder", id: "TREE" },
      ],
    }),

    deleteNote: builder.mutation<{ success: boolean; deleted?: boolean; archived?: boolean }, { id: string; permanent?: boolean }>({
      query: ({ id, permanent }) => ({
        url: `/notes/${id}${permanent ? "?permanent=true" : ""}`,
        method: "DELETE",
      }),
      invalidatesTags: (_res, _err, { id }) => [
        { type: "Note", id },
        { type: "Note", id: "TREE" },
        { type: "NoteFolder", id: "TREE" },
      ],
    }),

    toggleStarNote: builder.mutation<{ isStarred: boolean }, string>({
      query: (id) => ({
        url: `/notes/${id}/star`,
        method: "POST",
      }),
      invalidatesTags: (_res, _err, id) => [
        { type: "Note", id },
        { type: "Note", id: "TREE" },
      ],
    }),

    getNoteShares: builder.query<{
      generalAccess: string;
      directShares: NoteShareItem[];
      inheritedShares: FolderShareItem[];
      folderName: string | null;
      canManage: boolean;
    }, string>({
      query: (id) => `/notes/${id}/shares`,
      providesTags: (_res, _err, id) => [{ type: "NoteShare", id }],
    }),

    addNoteShare: builder.mutation<NoteShareItem | { shares: NoteShareItem[]; count: number }, {
      noteId: string;
      userId?: string;
      userIds?: string[];
      role?: string;
      teamId?: string;
      customRoleId?: string;
      accessLevel: "VIEW" | "EDIT" | "FULL";
    }>({
      query: ({ noteId, ...body }) => ({
        url: `/notes/${noteId}/shares`,
        method: "POST",
        body,
      }),
      invalidatesTags: (_res, _err, { noteId }) => [
        { type: "NoteShare", id: noteId },
        { type: "Note", id: noteId },
        { type: "Note", id: "TREE" },
      ],
    }),

    deleteNoteShare: builder.mutation<{ success: boolean }, { noteId: string; shareId: string }>({
      query: ({ noteId, shareId }) => ({
        url: `/notes/${noteId}/shares?shareId=${shareId}`,
        method: "DELETE",
      }),
      invalidatesTags: (_res, _err, { noteId }) => [
        { type: "NoteShare", id: noteId },
        { type: "Note", id: noteId },
      ],
    }),

    getFolders: builder.query<{ folders: FolderItem[] }, void>({
      query: () => "/notes/folders",
      providesTags: [{ type: "NoteFolder", id: "LIST" }],
    }),

    getFolder: builder.query<FolderItem, string>({
      query: (id) => `/notes/folders/${id}`,
      providesTags: (_res, _err, id) => [{ type: "NoteFolder", id }],
    }),

    createFolder: builder.mutation<FolderItem, {
      name: string;
      icon?: string;
      color?: string;
      description?: string;
      parentId?: string | null;
      isWorkspaceRoot?: boolean;
      generalAccess?: "PRIVATE" | "WORKSPACE_VIEW" | "WORKSPACE_EDIT";
    }>({
      query: (body) => ({
        url: "/notes/folders",
        method: "POST",
        body,
      }),
      invalidatesTags: [
        { type: "NoteFolder", id: "LIST" },
        { type: "NoteFolder", id: "TREE" },
        { type: "Note", id: "TREE" },
      ],
    }),

    updateFolder: builder.mutation<FolderItem, {
      id: string;
      name?: string;
      icon?: string;
      color?: string;
      description?: string;
      parentId?: string | null;
      isArchived?: boolean;
      generalAccess?: "PRIVATE" | "WORKSPACE_VIEW" | "WORKSPACE_EDIT";
    }>({
      query: ({ id, ...body }) => ({
        url: `/notes/folders/${id}`,
        method: "PATCH",
        body,
      }),
      invalidatesTags: (_res, _err, { id }) => [
        { type: "NoteFolder", id },
        { type: "NoteFolder", id: "LIST" },
        { type: "NoteFolder", id: "TREE" },
        { type: "Note", id: "TREE" },
      ],
    }),

    deleteFolder: builder.mutation<{ success: boolean; deleted?: boolean; archived?: boolean }, { id: string; permanent?: boolean }>({
      query: ({ id, permanent }) => ({
        url: `/notes/folders/${id}${permanent ? "?permanent=true" : ""}`,
        method: "DELETE",
      }),
      invalidatesTags: (_res, _err, { id }) => [
        { type: "NoteFolder", id },
        { type: "NoteFolder", id: "LIST" },
        { type: "NoteFolder", id: "TREE" },
        { type: "Note", id: "TREE" },
      ],
    }),

    getFolderShares: builder.query<{
      generalAccess: string;
      shares: FolderShareItem[];
      canManage: boolean;
    }, string>({
      query: (id) => `/notes/folders/${id}/shares`,
      providesTags: (_res, _err, id) => [{ type: "NoteShare", id: `folder-${id}` }],
    }),

    addFolderShare: builder.mutation<FolderShareItem | { shares: FolderShareItem[]; count: number }, {
      folderId: string;
      userId?: string;
      userIds?: string[];
      role?: string;
      teamId?: string;
      customRoleId?: string;
      accessLevel: "VIEW" | "EDIT" | "FULL";
    }>({
      query: ({ folderId, ...body }) => ({
        url: `/notes/folders/${folderId}/shares`,
        method: "POST",
        body,
      }),
      invalidatesTags: (_res, _err, { folderId }) => [
        { type: "NoteShare", id: `folder-${folderId}` },
        { type: "NoteFolder", id: folderId },
        { type: "NoteFolder", id: "TREE" },
        { type: "Note", id: "TREE" },
      ],
    }),

    deleteFolderShare: builder.mutation<{ success: boolean }, { folderId: string; shareId: string }>({
      query: ({ folderId, shareId }) => ({
        url: `/notes/folders/${folderId}/shares?shareId=${shareId}`,
        method: "DELETE",
      }),
      invalidatesTags: (_res, _err, { folderId }) => [
        { type: "NoteShare", id: `folder-${folderId}` },
        { type: "NoteFolder", id: folderId },
      ],
    }),

    getNoteTemplates: builder.query<{ templates: NoteTemplate[] }, void>({
      query: () => "/notes/templates",
    }),
  }),
});

export const {
  useGetNotesTreeQuery,
  useGetNoteQuery,
  useCreateNoteMutation,
  useUpdateNoteMutation,
  useDeleteNoteMutation,
  useToggleStarNoteMutation,
  useGetNoteSharesQuery,
  useAddNoteShareMutation,
  useDeleteNoteShareMutation,
  useGetFoldersQuery,
  useGetFolderQuery,
  useCreateFolderMutation,
  useUpdateFolderMutation,
  useDeleteFolderMutation,
  useGetFolderSharesQuery,
  useAddFolderShareMutation,
  useDeleteFolderShareMutation,
  useGetNoteTemplatesQuery,
} = notesApi;
