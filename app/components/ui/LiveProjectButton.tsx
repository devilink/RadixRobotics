"use client";

interface LiveProjectButtonProps {
  label?: string;
  onClick?: () => void;
  className?: string;
  href?: string;
}

export default function LiveProjectButton({
  label = "Live Project",
  onClick,
  className = "",
  href,
}: LiveProjectButtonProps) {
  const baseClasses = `rounded-full border-2 border-[#D7E2EA] text-[#D7E2EA] font-medium uppercase tracking-widest px-8 py-3 sm:px-10 sm:py-3.5 text-sm sm:text-base hover:bg-[#D7E2EA]/10 transition-colors ${className}`;
  
  if (href) {
    return (
      <a href={href} target="_blank" rel="noopener noreferrer" className={baseClasses}>
        {label}
      </a>
    );
  }

  return (
    <button onClick={onClick} className={baseClasses}>
      {label}
    </button>
  );
}
