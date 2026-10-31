import Image from 'next/image';

/**
 * Branded loader for the portals (ERP, admin, curriculum, login hand-off).
 * Pure markup + CSS animation (see .portal-loader in app/styles/loader.css), so it
 * renders on the server and appears instantly.
 *
 * variant: "screen" fills the window, "overlay" covers the current page,
 * "inline" fills the content area inside an already-visible layout.
 */
export default function PortalLoader({
  label = 'Loading your workspace',
  variant = 'screen',
}: {
  label?: string;
  variant?: 'screen' | 'overlay' | 'inline';
}) {
  return (
    <div className={`portal-loader portal-loader--${variant}`} role="status" aria-live="polite">
      <div className="portal-loader__mark">
        <span className="portal-loader__ring" />
        <span className="portal-loader__ring portal-loader__ring--2" />
        <Image src="/imgw.PNG" alt="" width={64} height={30} className="portal-loader__logo" priority />
      </div>
      <p className="portal-loader__label">
        {label}
        <span className="portal-loader__dots" aria-hidden><i>.</i><i>.</i><i>.</i></span>
      </p>
      <div className="portal-loader__track" aria-hidden><span /></div>
    </div>
  );
}
