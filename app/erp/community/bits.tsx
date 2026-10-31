import { COMMUNITY_STATUS_LABELS, type CommunityStatus } from "@/lib/community";
import { Badge, type BadgeTone } from "../_components/ui";

const TONES: Record<CommunityStatus, BadgeTone> = {
  new: "sky",
  reviewing: "amber",
  shortlisted: "violet",
  accepted: "green",
  rejected: "red",
};

export function CommunityStatusBadge({ status }: { status: CommunityStatus }) {
  return <Badge tone={TONES[status] ?? "neutral"}>{COMMUNITY_STATUS_LABELS[status] ?? status}</Badge>;
}
