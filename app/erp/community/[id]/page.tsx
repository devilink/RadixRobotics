import { notFound } from "next/navigation";
import { Download, ExternalLink, FileText, Mail, MessageCircle, Phone } from "lucide-react";
import { db } from "@/lib/erp/context";
import { requireCommunityPage } from "@/lib/erp/community";
import { formatDateTime } from "@/lib/erp/format";
import { COMMUNITY_BUCKET, type CommunityStatus } from "@/lib/community";
import { Card, DescriptionList, Notice, PageHeader, buttonClass, cx, focusRing } from "../../_components/ui";
import { CommunityStatusBadge } from "../bits";
import { DeleteApplication, ReviewForm } from "../Forms";

export const metadata = { title: "Community application" };

type Application = {
  id: string; full_name: string; phone: string; email: string; resume_path: string; resume_name: string;
  work_paths: string[]; status: CommunityStatus; admin_notes: string | null; submitted_at: string | null;
  reviewed_at: string | null; reviewed_by: string | null;
};

const LINK_TTL = 60 * 60; // signed file links last one hour

export default async function ApplicationPage({ params }: { params: Promise<{ id: string }> }) {
  const { id } = await params;
  if (!/^[0-9a-f-]{36}$/i.test(id)) notFound();
  await requireCommunityPage();
  const supabase = await db();

  const { data } = await supabase.from("community_applications").select("*").eq("id", id).maybeSingle();
  if (!data) notFound();
  const app = data as Application;

  const bucket = supabase.storage.from(COMMUNITY_BUCKET);
  const [resumeView, resumeDownload, images, reviewer] = await Promise.all([
    bucket.createSignedUrl(app.resume_path, LINK_TTL),
    bucket.createSignedUrl(app.resume_path, LINK_TTL, { download: app.resume_name }),
    bucket.createSignedUrls(app.work_paths, LINK_TTL),
    app.reviewed_by
      ? supabase.from("profiles").select("full_name").eq("id", app.reviewed_by).maybeSingle()
      : Promise.resolve({ data: null }),
  ]);
  const imageUrls = (images.data ?? []).map((i) => i.signedUrl).filter(Boolean) as string[];
  const filesMissing = !!resumeView.error || !!images.error;
  const waNumber = app.phone.replace(/[^0-9]/g, "");
  const waLink = `https://wa.me/${waNumber.length === 10 ? `91${waNumber}` : waNumber}`;

  return (
    <>
      <PageHeader
        title={app.full_name}
        description={<>Applied {formatDateTime(app.submitted_at)} · <CommunityStatusBadge status={app.status} /></>}
        crumbs={[{ href: "/erp", label: "Dashboard" }, { href: "/erp/community", label: "Community" }, { label: app.full_name }]}
        actions={<DeleteApplication id={app.id} name={app.full_name} />}
      />

      {filesMissing && <div className="mb-6"><Notice tone="warn">Some files could not be loaded. Refresh the page; if it keeps happening, check the Storage bucket.</Notice></div>}

      <div className="grid gap-6 lg:grid-cols-3">
        <div className="space-y-6 lg:col-span-2">
          <Card title="Contact details">
            <DescriptionList items={[
              { label: "Name", value: app.full_name },
              { label: "Email", value: <a className={cx("text-brand-400 hover:underline", focusRing)} href={`mailto:${app.email}`}>{app.email}</a> },
              { label: "Phone", value: <a className={cx("text-brand-400 hover:underline", focusRing)} href={`tel:${app.phone.replace(/\s/g, "")}`}>{app.phone}</a> },
              { label: "Received", value: formatDateTime(app.submitted_at) },
            ]} />
            <div className="mt-5 flex flex-wrap gap-2">
              <a href={`mailto:${app.email}`} className={buttonClass("secondary", "sm")}><Mail className="h-3.5 w-3.5" aria-hidden /> Email</a>
              <a href={`tel:${app.phone.replace(/\s/g, "")}`} className={buttonClass("secondary", "sm")}><Phone className="h-3.5 w-3.5" aria-hidden /> Call</a>
              <a href={waLink} target="_blank" rel="noopener noreferrer" className={buttonClass("secondary", "sm")}><MessageCircle className="h-3.5 w-3.5" aria-hidden /> WhatsApp</a>
            </div>
          </Card>

          <Card title="Resume / CV">
            <div className="flex flex-col gap-3 sm:flex-row sm:items-center sm:justify-between">
              <div className="flex min-w-0 items-center gap-3">
                <div className="flex h-10 w-10 shrink-0 items-center justify-center rounded-xl bg-brand-500/15 text-brand-400">
                  <FileText className="h-5 w-5" aria-hidden />
                </div>
                <p className="truncate text-sm font-medium text-zinc-100">{app.resume_name}</p>
              </div>
              <div className="flex gap-2">
                {resumeView.data?.signedUrl && (
                  <a href={resumeView.data.signedUrl} target="_blank" rel="noopener noreferrer" className={buttonClass("secondary", "sm")}>
                    <ExternalLink className="h-3.5 w-3.5" aria-hidden /> Open
                  </a>
                )}
                {resumeDownload.data?.signedUrl && (
                  <a href={resumeDownload.data.signedUrl} className={buttonClass("primary", "sm")}>
                    <Download className="h-3.5 w-3.5" aria-hidden /> Download
                  </a>
                )}
              </div>
            </div>
          </Card>

          <Card title={`Work (${app.work_paths.length} image${app.work_paths.length === 1 ? "" : "s"})`}>
            <div className="grid grid-cols-2 gap-3 sm:grid-cols-3">
              {imageUrls.map((url, i) => (
                <a
                  key={url}
                  href={url}
                  target="_blank"
                  rel="noopener noreferrer"
                  className={cx("group block aspect-square overflow-hidden rounded-xl border border-zinc-800 bg-zinc-950", focusRing)}
                >
                  {/* Short-lived signed URLs, so plain <img> rather than next/image optimisation. */}
                  {/* eslint-disable-next-line @next/next/no-img-element */}
                  <img src={url} alt={`${app.full_name}'s work, image ${i + 1}`} loading="lazy" className="h-full w-full object-cover transition-transform group-hover:scale-105" />
                </a>
              ))}
            </div>
            <p className="mt-3 text-xs text-zinc-500">Click an image to open it full size. Links expire after an hour; refresh to renew.</p>
          </Card>
        </div>

        <div className="space-y-6">
          <Card title="Review">
            <ReviewForm id={app.id} status={app.status} notes={app.admin_notes} />
            {app.reviewed_at && (
              <p className="mt-4 text-xs text-zinc-500">
                Status last changed {formatDateTime(app.reviewed_at)}
                {reviewer.data?.full_name ? ` by ${reviewer.data.full_name}` : ""}.
              </p>
            )}
          </Card>
        </div>
      </div>
    </>
  );
}
