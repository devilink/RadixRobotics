"use client";

import { useEffect, useId, useMemo, useRef, useState } from "react";
import { ArrowRight, CheckCircle2, FilePlus2, FileText, ImagePlus, Loader2, Upload, X } from "lucide-react";
import { createClient } from "@/utils/supabase/client";
import {
  applicationSchema, COMMUNITY_BUCKET, formatBytes, IMAGE_TYPES, MAX_FILE_BYTES, MAX_OTHER_FILES, MAX_WORK_IMAGES,
  OTHER_ACCEPT, OTHER_TYPES, RESUME_TYPES,
} from "@/lib/community";

// Browsers (especially on Windows) often report ZIP/CSV files with an empty or odd type,
// so extra files are typed by their extension.
const EXT_TYPE: Record<string, string> = {
  pdf: "application/pdf", doc: "application/msword",
  docx: "application/vnd.openxmlformats-officedocument.wordprocessingml.document",
  ppt: "application/vnd.ms-powerpoint", pptx: "application/vnd.openxmlformats-officedocument.presentationml.presentation",
  xls: "application/vnd.ms-excel", xlsx: "application/vnd.openxmlformats-officedocument.spreadsheetml.sheet",
  txt: "text/plain", csv: "text/csv", zip: "application/zip",
  jpg: "image/jpeg", jpeg: "image/jpeg", png: "image/png", webp: "image/webp", gif: "image/gif",
};
const otherType = (f: File) => EXT_TYPE[f.name.split(".").pop()?.toLowerCase() ?? ""] ?? (f.type in OTHER_TYPES ? f.type : "");
import { finishApplication, startApplication } from "./actions";

type Phase = "form" | "sending" | "done";

const inputCls =
  "w-full border-2 border-[#111] bg-white px-4 py-3 text-base font-medium text-[#111] placeholder:text-[#9aa0a8] focus:outline-none focus:shadow-[4px_4px_0px_#ff5400] transition-shadow";
const labelCls = "block text-[11px] font-mono font-bold uppercase tracking-widest text-[#111] mb-2";

export default function JoinCommunity({ variant = "dark" }: { variant?: "dark" | "light" }) {
  const dialogRef = useRef<HTMLDialogElement>(null);
  const [open, setOpen] = useState(false);
  const uid = useId();

  const [fullName, setFullName] = useState("");
  const [phone, setPhone] = useState("");
  const [email, setEmail] = useState("");
  const [resume, setResume] = useState<File | null>(null);
  const [works, setWorks] = useState<File[]>([]);
  const [others, setOthers] = useState<File[]>([]);
  const [honeypot, setHoneypot] = useState("");

  const [phase, setPhase] = useState<Phase>("form");
  const [progress, setProgress] = useState("");
  const [error, setError] = useState<string | null>(null);
  const [fieldErrors, setFieldErrors] = useState<Record<string, string>>({});

  useEffect(() => {
    const d = dialogRef.current;
    if (!d) return;
    if (open && !d.open) d.showModal();
    if (!open && d.open) d.close();
  }, [open]);

  const previews = useMemo(() => works.map((f) => URL.createObjectURL(f)), [works]);
  useEffect(() => () => previews.forEach((u) => URL.revokeObjectURL(u)), [previews]);

  function reset() {
    setFullName(""); setPhone(""); setEmail(""); setResume(null); setWorks([]); setOthers([]); setHoneypot("");
    setPhase("form"); setProgress(""); setError(null); setFieldErrors({});
  }

  function close() {
    if (phase === "sending") return;
    setOpen(false);
    if (phase === "done") reset();
  }

  function pickResume(list: FileList | null) {
    const f = list?.[0];
    if (!f) return;
    if (!(f.type in RESUME_TYPES)) return setFieldErrors((e) => ({ ...e, resume: "Resume must be a PDF, DOC or DOCX file" }));
    if (f.size > MAX_FILE_BYTES) return setFieldErrors((e) => ({ ...e, resume: "Resume must be 10 MB or smaller" }));
    setFieldErrors((e) => without(e, "resume"));
    setResume(f);
  }

  function addWorks(list: FileList | null) {
    if (!list) return;
    const incoming = Array.from(list);
    const bad = incoming.find((f) => !(f.type in IMAGE_TYPES) || f.size > MAX_FILE_BYTES);
    const ok = incoming.filter((f) => f.type in IMAGE_TYPES && f.size <= MAX_FILE_BYTES);
    const next = [...works, ...ok].slice(0, MAX_WORK_IMAGES);
    setWorks(next);
    if (bad) setFieldErrors((e) => ({ ...e, works: "Images must be JPG, PNG, WEBP or GIF, up to 10 MB each" }));
    else if (works.length + ok.length > MAX_WORK_IMAGES) setFieldErrors((e) => ({ ...e, works: `Only the first ${MAX_WORK_IMAGES} images were kept` }));
    else setFieldErrors((e) => without(e, "works"));
  }

  function addOthers(list: FileList | null) {
    if (!list) return;
    const incoming = Array.from(list);
    const ok = incoming.filter((f) => otherType(f) && f.size <= MAX_FILE_BYTES);
    const bad = incoming.length !== ok.length;
    const next = [...others, ...ok].slice(0, MAX_OTHER_FILES);
    setOthers(next);
    if (bad) setFieldErrors((e) => ({ ...e, others: "Files must be PDF, Word, PowerPoint, Excel, TXT, CSV, ZIP or images, up to 10 MB each" }));
    else if (others.length + ok.length > MAX_OTHER_FILES) setFieldErrors((e) => ({ ...e, others: `Only the first ${MAX_OTHER_FILES} files were kept` }));
    else setFieldErrors((e) => without(e, "others"));
  }

  async function submit(e: React.FormEvent) {
    e.preventDefault();
    setError(null);

    const payload = {
      full_name: fullName,
      phone,
      email,
      resume: resume ? { name: resume.name, type: resume.type, size: resume.size } : undefined,
      works: works.map((f) => ({ name: f.name, type: f.type, size: f.size })),
      others: others.map((f) => ({ name: f.name, type: otherType(f), size: f.size })),
    };
    const local = applicationSchema.safeParse(payload);
    if (!local.success) {
      const errs: Record<string, string> = {};
      for (const issue of local.error.issues) errs[String(issue.path[0])] ??= issue.path[0] === "resume" && !resume ? "Please attach your resume or CV" : issue.message;
      setFieldErrors(errs);
      return;
    }
    setFieldErrors({});
    setPhase("sending");

    try {
      setProgress("Checking your details…");
      const start = await startApplication(payload, honeypot);
      if (!start.ok) {
        setFieldErrors(start.fieldErrors ?? {});
        setError(start.error);
        setPhase("form");
        return;
      }

      const supabase = createClient();
      // Same order as the server's upload list: resume, work images, other files.
      const files = [
        { file: resume!, type: resume!.type },
        ...works.map((f) => ({ file: f, type: f.type })),
        ...others.map((f) => ({ file: f, type: otherType(f) })),
      ];
      for (let i = 0; i < files.length; i++) {
        setProgress(`Uploading file ${i + 1} of ${files.length}…`);
        const { path, token } = start.uploads[i];
        const { error: upErr } = await supabase.storage
          .from(COMMUNITY_BUCKET)
          .uploadToSignedUrl(path, token, files[i].file, { contentType: files[i].type });
        if (upErr) throw upErr;
      }

      setProgress("Finishing up…");
      const done = await finishApplication(start.id);
      if (!done.ok) {
        setError(done.error);
        setPhase("form");
        return;
      }
      setPhase("done");
    } catch (err) {
      console.error(err);
      setError("An upload failed. Please check your connection and try again.");
      setPhase("form");
    }
  }

  const trigger =
    variant === "light"
      ? "bg-[#ff5400] text-white border-2 border-white shadow-[4px_4px_0px_#fff] hover:shadow-[6px_6px_0px_#fff]"
      : "bg-[#111] text-white border-2 border-[#111] shadow-[4px_4px_0px_#ff5400] hover:shadow-[6px_6px_0px_#ff5400]";

  return (
    <>
      <button
        type="button"
        onClick={() => setOpen(true)}
        className={`inline-flex items-center gap-3 px-8 py-4 text-sm font-black uppercase tracking-widest transition-all hover:-translate-y-0.5 ${trigger}`}
      >
        Join the Community <ArrowRight size={18} />
      </button>

      <dialog
        ref={dialogRef}
        onClose={() => { setOpen(false); if (phase === "done") reset(); }}
        onCancel={(e) => { if (phase === "sending") e.preventDefault(); }}
        aria-labelledby={`${uid}-title`}
        className="m-auto w-[min(40rem,calc(100vw-1.5rem))] max-h-[calc(100dvh-1.5rem)] overflow-y-auto overscroll-contain border-2 border-[#111] bg-[#faf8f5] p-0 text-[#111] shadow-[10px_10px_0px_#ff5400] backdrop:bg-black/70 backdrop:backdrop-blur-sm"
      >
        <div className="sticky top-0 z-10 flex items-center justify-between border-b-2 border-[#111] bg-white px-5 py-4 sm:px-8">
          <div>
            <p className="text-[10px] font-mono font-bold uppercase tracking-widest text-[#ff5400]">[ Radix Community ]</p>
            <h2 id={`${uid}-title`} className="text-xl sm:text-2xl font-black uppercase tracking-tighter">Join the Community</h2>
          </div>
          <button type="button" onClick={close} disabled={phase === "sending"} aria-label="Close" className="p-2 text-[#646a73] hover:text-[#111] disabled:opacity-40">
            <X size={22} />
          </button>
        </div>

        {phase === "done" ? (
          <div className="px-5 py-12 sm:px-8 text-center">
            <CheckCircle2 size={56} className="mx-auto text-[#ff5400]" />
            <h3 className="mt-6 text-2xl font-black uppercase tracking-tighter">Application received!</h3>
            <p className="mt-3 text-[#646a73] font-medium max-w-sm mx-auto">
              Thanks for applying, {fullName.split(" ")[0]}. Our team will review your work and reach out on {email}.
            </p>
            <button type="button" onClick={close} className="mt-8 px-6 py-3 bg-[#111] text-white text-xs font-black uppercase tracking-widest border-2 border-[#111] shadow-[4px_4px_0px_#ff5400]">
              Done
            </button>
          </div>
        ) : (
          <form onSubmit={submit} noValidate className="space-y-5 px-5 py-6 sm:px-8 sm:py-8">
            {error && (
              <div role="alert" className="border-2 border-[#d92d20] bg-[#fef3f2] px-4 py-3 text-sm font-bold text-[#b42318]">
                {error}
              </div>
            )}

            {/* Hidden from people; bots tend to fill it. */}
            <div aria-hidden className="absolute -left-[9999px] h-px w-px overflow-hidden">
              <label>Website<input tabIndex={-1} autoComplete="off" value={honeypot} onChange={(e) => setHoneypot(e.target.value)} /></label>
            </div>

            <div>
              <label htmlFor={`${uid}-name`} className={labelCls}>Full name *</label>
              <input id={`${uid}-name`} className={inputCls} value={fullName} onChange={(e) => setFullName(e.target.value)} autoComplete="name" placeholder="Your full name" maxLength={120} aria-invalid={!!fieldErrors.full_name} />
              <FieldError msg={fieldErrors.full_name} />
            </div>

            <div className="grid gap-5 sm:grid-cols-2">
              <div>
                <label htmlFor={`${uid}-phone`} className={labelCls}>Whatsapp number *</label>
                <input id={`${uid}-phone`} type="tel" className={inputCls} value={phone} onChange={(e) => setPhone(e.target.value)} autoComplete="tel" inputMode="tel" placeholder="+91 98765 43210" maxLength={20} aria-invalid={!!fieldErrors.phone} />
                <FieldError msg={fieldErrors.phone} />
              </div>
              <div>
                <label htmlFor={`${uid}-email`} className={labelCls}>Email *</label>
                <input id={`${uid}-email`} type="email" className={inputCls} value={email} onChange={(e) => setEmail(e.target.value)} autoComplete="email" placeholder="you@example.com" maxLength={254} aria-invalid={!!fieldErrors.email} />
                <FieldError msg={fieldErrors.email} />
              </div>
            </div>

            <div>
              <span className={labelCls}>Resume / CV *</span>
              <label className="flex cursor-pointer items-center gap-4 border-2 border-dashed border-[#111] bg-white px-4 py-4 hover:bg-[#fff7f2] focus-within:shadow-[4px_4px_0px_#ff5400]">
                <div className="flex h-11 w-11 shrink-0 items-center justify-center border-2 border-[#111] bg-[#ff5400] text-white">
                  {resume ? <FileText size={20} /> : <Upload size={20} />}
                </div>
                <div className="min-w-0 flex-1">
                  <p className="truncate font-bold">{resume ? resume.name : "Choose a file"}</p>
                  <p className="text-xs font-medium text-[#646a73]">{resume ? formatBytes(resume.size) : "PDF, DOC or DOCX · up to 10 MB"}</p>
                </div>
                <input type="file" className="sr-only" accept=".pdf,.doc,.docx,application/pdf,application/msword,application/vnd.openxmlformats-officedocument.wordprocessingml.document" onChange={(e) => { pickResume(e.target.files); e.target.value = ""; }} />
              </label>
              <FieldError msg={fieldErrors.resume} />
            </div>

            <div>
              <span className={labelCls}>Your work (images) *</span>
              <div className="grid grid-cols-3 gap-3 sm:grid-cols-4">
                {works.map((f, i) => (
                  <div key={`${f.name}-${i}`} className="group relative aspect-square border-2 border-[#111] bg-white">
                    {/* eslint-disable-next-line @next/next/no-img-element */}
                    <img src={previews[i]} alt={f.name} className="h-full w-full object-cover" />
                    <button
                      type="button"
                      onClick={() => setWorks((w) => w.filter((_, j) => j !== i))}
                      aria-label={`Remove ${f.name}`}
                      className="absolute right-1 top-1 flex h-7 w-7 items-center justify-center border-2 border-[#111] bg-white text-[#111] hover:bg-[#ff5400] hover:text-white"
                    >
                      <X size={14} />
                    </button>
                  </div>
                ))}
                {works.length < MAX_WORK_IMAGES && (
                  <label className="flex aspect-square cursor-pointer flex-col items-center justify-center gap-1 border-2 border-dashed border-[#111] bg-white text-center hover:bg-[#fff7f2] focus-within:shadow-[4px_4px_0px_#ff5400]">
                    <ImagePlus size={22} className="text-[#ff5400]" />
                    <span className="px-1 text-[10px] font-mono font-bold uppercase tracking-widest">Add images</span>
                    <input type="file" multiple className="sr-only" accept="image/jpeg,image/png,image/webp,image/gif" onChange={(e) => { addWorks(e.target.files); e.target.value = ""; }} />
                  </label>
                )}
              </div>
              <p className="mt-2 text-xs font-medium text-[#646a73]">Photos of projects, robots, circuits or designs you&apos;ve made. Up to {MAX_WORK_IMAGES} images, 10 MB each.</p>
              <FieldError msg={fieldErrors.works} />
            </div>

            <div>
              <span className={labelCls}>Other files (optional)</span>
              {others.length > 0 && (
                <ul className="mb-3 space-y-2">
                  {others.map((f, i) => (
                    <li key={`${f.name}-${i}`} className="flex items-center gap-3 border-2 border-[#111] bg-white px-3 py-2">
                      <FileText size={18} className="shrink-0 text-[#ff5400]" />
                      <span className="min-w-0 flex-1 truncate text-sm font-bold">{f.name}</span>
                      <span className="shrink-0 text-xs font-medium text-[#646a73]">{formatBytes(f.size)}</span>
                      <button
                        type="button"
                        onClick={() => setOthers((o) => o.filter((_, j) => j !== i))}
                        aria-label={`Remove ${f.name}`}
                        className="flex h-7 w-7 shrink-0 items-center justify-center border-2 border-[#111] bg-white hover:bg-[#ff5400] hover:text-white"
                      >
                        <X size={14} />
                      </button>
                    </li>
                  ))}
                </ul>
              )}
              {others.length < MAX_OTHER_FILES && (
                <label className="flex cursor-pointer items-center gap-4 border-2 border-dashed border-[#111] bg-white px-4 py-3 hover:bg-[#fff7f2] focus-within:shadow-[4px_4px_0px_#ff5400]">
                  <FilePlus2 size={20} className="shrink-0 text-[#ff5400]" />
                  <span className="text-sm font-bold">Add files</span>
                  <span className="text-xs font-medium text-[#646a73]">Certificates, reports, slides, sheets or ZIP</span>
                  <input type="file" multiple className="sr-only" accept={OTHER_ACCEPT} onChange={(e) => { addOthers(e.target.files); e.target.value = ""; }} />
                </label>
              )}
              <p className="mt-2 text-xs font-medium text-[#646a73]">Up to {MAX_OTHER_FILES} files, 10 MB each. PDF, Word, PowerPoint, Excel, TXT, CSV, ZIP or images.</p>
              <FieldError msg={fieldErrors.others} />
            </div>

            <button
              type="submit"
              disabled={phase === "sending"}
              className="flex w-full items-center justify-center gap-3 border-2 border-[#111] bg-[#111] px-6 py-4 text-sm font-black uppercase tracking-widest text-white shadow-[4px_4px_0px_#ff5400] transition-all hover:-translate-y-0.5 disabled:translate-y-0 disabled:opacity-70"
            >
              {phase === "sending" ? (<><Loader2 size={18} className="animate-spin" /> {progress}</>) : (<>Submit application <ArrowRight size={18} /></>)}
            </button>
            <p className="text-center text-[11px] font-medium text-[#7b828e]">
              Your details and files are only seen by the Radix team.
            </p>
          </form>
        )}
      </dialog>
    </>
  );
}

function without(errors: Record<string, string>, key: string) {
  const next = { ...errors };
  delete next[key];
  return next;
}

function FieldError({ msg }: { msg?: string }) {
  if (!msg) return null;
  return <p className="mt-1.5 text-xs font-bold text-[#b42318]">{msg}</p>;
}
