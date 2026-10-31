import PortalLoader from "@/app/components/PortalLoader";

// Shown inside the ERP shell (sidebar stays visible) while a page loads.
export default function Loading() {
  return <PortalLoader variant="inline" label="Loading" />;
}
