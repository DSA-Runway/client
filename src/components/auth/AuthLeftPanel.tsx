import Image from "next/image";

interface AuthLeftPanelProps {
  label: string;
  heading: React.ReactNode;
  quote: string;
}

export function AuthLeftPanel({ label, heading, quote }: AuthLeftPanelProps) {
  return (
    <div className="relative hidden lg:flex lg:w-[52%] flex-col justify-between">
      {/* Background image */}
      <Image
        src="/login.png"
        alt="Auth background"
        fill
        className="object-cover object-center"
        priority
      />

      {/* Gradient overlay — subtle at top, dense at bottom for text */}
      <div
        className="absolute inset-0"
        style={{
          background:
            "linear-gradient(to bottom, rgba(0,0,0,0.12) 0%, rgba(0,0,0,0.22) 35%, rgba(0,0,0,0.68) 70%, rgba(0,0,0,0.87) 100%)",
        }}
      />

      {/* Top label */}
      <div className="relative z-10 flex items-center gap-3 p-9">
        <span
          className="text-white/70 text-[10px] font-semibold tracking-[0.32em] uppercase"
        >
          {label}
        </span>
        <div className="flex-1 h-px bg-white/30" />
      </div>

      {/* Bottom copy — moved right via pl-14, floated up via mb-10 */}
      <div className="relative z-10 pl-14 pr-10 pb-5 mb-10">
        <h2
          className="text-white font-light leading-[1.08] mb-4"
          style={{ fontFamily: "'Playfair Display', Georgia, serif", fontSize: "clamp(2.4rem, 3.8vw, 3.2rem)" }}
        >
          {heading}
        </h2>
        <p className="text-white/60 text-sm leading-relaxed">
          {quote}
        </p>
      </div>
    </div>
  );
}
