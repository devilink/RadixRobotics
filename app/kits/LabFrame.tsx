import Link from "next/link";
import { ArrowLeft } from "lucide-react";
import { getPortalPath } from "@/app/actions/portalActions";
import styles from "./LabFrame.module.css";

const LABS = [
  { key: "kit", href: "/kits", label: "Starter Kit" },
  { key: "arduino", href: "/kits/arduino", label: "Arduino" },
  { key: "esp", href: "/kits/esp", label: "ESP" },
  { key: "pi", href: "/kits/pi", label: "Raspberry Pi" },
] as const;

/** The cream top bar (Back + lab tabs) and the full-height iframe holding a lab page from docs/. */
export async function LabFrame({ active, src, title }: { active: (typeof LABS)[number]["key"]; src: string; title: string }) {
  const backHref = await getPortalPath();
  return (
    <div className="flex h-[100dvh] flex-col bg-[#F6EDDD]">
      <nav className={`${styles.nav} flex items-center justify-between gap-4 border-b border-[#CFC0A2] bg-[#EFE3CC] px-4 py-2`}>
        <Link
          href={backHref}
          className="flex items-center gap-2 text-xs font-bold uppercase tracking-widest text-[#1E2B45]/70 transition-colors hover:text-[#1E2B45]"
        >
          <ArrowLeft className="h-4 w-4" />
          Back
        </Link>
        <div className="flex gap-1 rounded-lg border border-[#CFC0A2] bg-[#FBF6EC] p-0.5" aria-label="Labs">
          {LABS.map((lab) => (
            <Link
              key={lab.key}
              href={lab.href}
              aria-current={lab.key === active ? "page" : undefined}
              className={
                lab.key === active
                  ? "rounded-md bg-[#1E2B45] px-3 py-1 text-xs font-bold uppercase tracking-widest text-[#F6EDDD]"
                  : "rounded-md px-3 py-1 text-xs font-bold uppercase tracking-widest text-[#1E2B45]/60 transition-colors hover:text-[#1E2B45]"
              }
            >
              {lab.label}
            </Link>
          ))}
        </div>
      </nav>
      <iframe src={src} title={title} className="w-full flex-1 border-0" />
    </div>
  );
}
