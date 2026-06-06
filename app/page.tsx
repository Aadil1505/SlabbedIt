import { SlabStudio } from "@/components/slab-studio";
import { WelcomeDialog } from "@/components/welcome-dialog";

export default function Home() {
  return (
    <main className="relative flex min-h-0 flex-1 flex-col overflow-hidden bg-background">
      {/* Backdrop — layered so the acrylic has rich, branded light to refract.
          Every tint is mixed from a theme token, so it tracks globals.css. */}

      {/* Two brand glows: a stronger green at top-left, a softer green at
          bottom-right — a cohesive green-lit stage for the acrylic to refract. */}
      <div
        aria-hidden
        className="pointer-events-none absolute inset-0 bg-[radial-gradient(38%_42%_at_16%_24%,color-mix(in_oklch,var(--primary)_28%,transparent),transparent_70%),radial-gradient(40%_44%_at_72%_84%,color-mix(in_oklch,var(--primary)_14%,transparent),transparent_72%)]"
      />

      {/* Soft spotlight sitting behind the stage */}
      <div
        aria-hidden
        className="pointer-events-none absolute top-[44%] left-[38%] h-[72vh] w-[72vh] -translate-x-1/2 -translate-y-1/2 rounded-full bg-[radial-gradient(circle,color-mix(in_oklch,var(--primary)_20%,transparent),transparent_62%)] blur-2xl"
      />

      {/* Fine grid, faded to the center */}
      <div
        aria-hidden
        className="pointer-events-none absolute inset-0 opacity-[0.1] bg-[linear-gradient(color-mix(in_oklch,var(--foreground)_50%,transparent)_1px,transparent_1px),linear-gradient(90deg,color-mix(in_oklch,var(--foreground)_50%,transparent)_1px,transparent_1px)] bg-size-[44px_44px] mask-[radial-gradient(70%_60%_at_40%_45%,black,transparent_78%)]"
      />

      {/* Edge vignette to focus the eye on the slab */}
      <div
        aria-hidden
        className="pointer-events-none absolute inset-0 bg-[radial-gradient(125%_125%_at_40%_45%,transparent_55%,color-mix(in_oklch,var(--background)_85%,transparent)_100%)]"
      />

      <SlabStudio />
      <WelcomeDialog />
    </main>
  );
}
