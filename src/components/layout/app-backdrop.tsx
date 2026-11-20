export function AppBackdrop({
  intensity = "default",
}: {
  intensity?: "default" | "soft";
}) {
  const motifOpacity = intensity === "soft" ? "opacity-70" : "opacity-85";
  const vineOpacity = intensity === "soft" ? "opacity-55" : "opacity-75";

  return (
    <div aria-hidden className="pointer-events-none fixed inset-0 -z-10 overflow-hidden">
      <div className="absolute -top-24 -left-16 h-72 w-72 rounded-full bg-[#9fd0b2]/40 blur-3xl" />
      <div className="absolute top-28 -right-20 h-80 w-80 rounded-full bg-[#8ec5cc]/35 blur-3xl" />
      <div className="absolute bottom-[-12%] left-[20%] h-72 w-72 rounded-full bg-[#d5ecc0]/40 blur-3xl" />

      <div className={`app-motif-lattice absolute inset-0 ${motifOpacity}`} />
      <div className={`app-motif-leaves absolute inset-0 ${vineOpacity}`} />
      <div className="app-motif-dots absolute inset-0 opacity-50" />

      <svg
        className="absolute -left-8 top-[18%] h-44 w-44 text-primary/22"
        viewBox="0 0 120 120"
        fill="none"
      >
        <path
          d="M58 108C58 108 18 78 22 42C26 12 58 8 58 8C58 8 90 12 94 42C98 78 58 108 58 108Z"
          fill="currentColor"
        />
        <path
          d="M58 108V28"
          stroke="currentColor"
          strokeWidth="2.2"
          strokeLinecap="round"
          className="opacity-50"
        />
        <path
          d="M58 48C46 44 36 36 30 26M58 68C70 62 82 52 88 40"
          stroke="currentColor"
          strokeWidth="1.6"
          strokeLinecap="round"
          className="opacity-40"
        />
      </svg>

      <svg
        className="absolute -right-10 top-[42%] h-52 w-52 rotate-[18deg] text-accent/20"
        viewBox="0 0 120 120"
        fill="none"
      >
        <path
          d="M60 112C60 112 14 86 20 46C25 14 60 6 60 6C60 6 95 14 100 46C106 86 60 112 60 112Z"
          fill="currentColor"
        />
        <path
          d="M60 112V24"
          stroke="currentColor"
          strokeWidth="2"
          strokeLinecap="round"
          className="opacity-45"
        />
      </svg>

      <svg
        className="absolute bottom-[-4%] left-[8%] h-40 w-40 -rotate-[22deg] text-primary/18"
        viewBox="0 0 100 100"
        fill="none"
      >
        <path
          d="M18 78C18 78 8 42 28 22C48 2 78 18 78 18C78 18 88 52 68 72C48 92 18 78 18 78Z"
          fill="currentColor"
        />
        <path
          d="M28 72C40 58 52 42 72 28"
          stroke="currentColor"
          strokeWidth="1.8"
          strokeLinecap="round"
          className="opacity-50"
        />
      </svg>

      <svg
        className="absolute right-[12%] bottom-[12%] h-28 w-28 text-accent/18"
        viewBox="0 0 80 80"
        fill="currentColor"
      >
        <circle cx="16" cy="18" r="5" />
        <circle cx="40" cy="12" r="3.5" />
        <circle cx="62" cy="24" r="4.5" />
        <circle cx="22" cy="44" r="3" />
        <circle cx="48" cy="40" r="5.5" />
        <circle cx="66" cy="54" r="3.2" />
        <circle cx="34" cy="62" r="4" />
      </svg>
    </div>
  );
}
