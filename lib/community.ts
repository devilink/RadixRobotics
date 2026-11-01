import { z } from "zod";

// Shared by the public join form (browser) and its server actions.

export const COMMUNITY_BUCKET = "community-applications";
export const MAX_FILE_BYTES = 10 * 1024 * 1024; // matches the bucket's file_size_limit
export const MAX_WORK_IMAGES = 8;

export const RESUME_TYPES: Record<string, string> = {
  "application/pdf": "pdf",
  "application/msword": "doc",
  "application/vnd.openxmlformats-officedocument.wordprocessingml.document": "docx",
};
export const IMAGE_TYPES: Record<string, string> = {
  "image/jpeg": "jpg",
  "image/png": "png",
  "image/webp": "webp",
  "image/gif": "gif",
};

/** Optional extra files: certificates, reports, slides, sheets, archives (and images). */
export const MAX_OTHER_FILES = 5;
export const OTHER_TYPES: Record<string, string> = {
  ...RESUME_TYPES,
  "application/vnd.ms-powerpoint": "ppt",
  "application/vnd.openxmlformats-officedocument.presentationml.presentation": "pptx",
  "application/vnd.ms-excel": "xls",
  "application/vnd.openxmlformats-officedocument.spreadsheetml.sheet": "xlsx",
  "text/plain": "txt",
  "text/csv": "csv",
  "application/zip": "zip",
  "application/x-zip-compressed": "zip",
  ...IMAGE_TYPES,
};
export const OTHER_ACCEPT = ".pdf,.doc,.docx,.ppt,.pptx,.xls,.xlsx,.txt,.csv,.zip,.jpg,.jpeg,.png,.webp,.gif";

export const COMMUNITY_STATUSES = ["new", "reviewing", "shortlisted", "accepted", "rejected"] as const;
export type CommunityStatus = (typeof COMMUNITY_STATUSES)[number];
export const COMMUNITY_STATUS_LABELS: Record<CommunityStatus, string> = {
  new: "New",
  reviewing: "Reviewing",
  shortlisted: "Shortlisted",
  accepted: "Accepted",
  rejected: "Rejected",
};

const fileMeta = (types: Record<string, string>, label: string) =>
  z.object({
    name: z.string().min(1).max(200),
    type: z.string().refine((t) => t in types, `${label} must be ${Object.values(types).join(", ").toUpperCase()}`),
    size: z.number().int().positive().max(MAX_FILE_BYTES, `${label} must be 10 MB or smaller`),
  });

export const applicationSchema = z.object({
  full_name: z.string().trim().min(2, "Please enter your full name").max(120),
  phone: z.string().trim().regex(/^\+?[0-9 ()-]{7,20}$/, "Please enter a valid phone number"),
  email: z.string().trim().toLowerCase().max(254).email("Please enter a valid email address"),
  resume: fileMeta(RESUME_TYPES, "Resume"),
  works: z
    .array(fileMeta(IMAGE_TYPES, "Each image"))
    .min(1, "Add at least one image of your work")
    .max(MAX_WORK_IMAGES, `You can add up to ${MAX_WORK_IMAGES} images`),
  others: z
    .array(fileMeta(OTHER_TYPES, "Each file"))
    .max(MAX_OTHER_FILES, `You can add up to ${MAX_OTHER_FILES} other files`)
    .default([]),
});
export type ApplicationInput = z.infer<typeof applicationSchema>;

export function formatBytes(n: number) {
  if (n < 1024 * 1024) return `${Math.max(1, Math.round(n / 1024))} KB`;
  return `${(n / (1024 * 1024)).toFixed(1)} MB`;
}
