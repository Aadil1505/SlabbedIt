import { PSASlab } from "@/components/psa-slab";
import { SlabBumper } from "@/components/slab-bumper";

// Shining Fates Charizard VMAX (SV107) from TCGdex's high-res assets.
// If the URL ever 404s, PSASlab falls back to a holo placeholder.
const SAMPLE_CARD =
  "https://assets.tcgdex.net/en/swsh/swsh4.5/SV107/high.png";

export default function Home() {
  return (
    <main className="relative flex min-h-screen flex-1 flex-col items-center justify-center gap-10 overflow-hidden px-6 py-16 bg-black">
      {/* Backdrop — layered so the acrylic has rich, colored light to refract. */}

      {/* Ambient color glows in the corners */}
      <div
        aria-hidden
        className="pointer-events-none absolute inset-0 bg-[radial-gradient(38%_42%_at_16%_20%,rgba(167,139,250,0.22),transparent_70%),radial-gradient(48%_50%_at_84%_80%,rgba(245,158,11,0.20),transparent_72%),radial-gradient(40%_42%_at_82%_16%,rgba(56,189,248,0.16),transparent_70%)]"
      />

      {/* Soft spotlight sitting directly behind the slab */}
      <div
        aria-hidden
        className="pointer-events-none absolute left-1/2 top-[46%] h-[78vh] w-[78vh] -translate-x-1/2 -translate-y-1/2 rounded-full bg-[radial-gradient(circle,rgba(150,180,235,0.20),transparent_62%)] blur-2xl"
      />

      {/* Fine grid, faded to the center */}
      <div
        aria-hidden
        className="pointer-events-none absolute inset-0 opacity-[0.12] bg-[linear-gradient(rgba(255,255,255,0.5)_1px,transparent_1px),linear-gradient(90deg,rgba(255,255,255,0.5)_1px,transparent_1px)] bg-size-[44px_44px] mask-[radial-gradient(75%_65%_at_50%_42%,black,transparent_78%)]"
      />

      {/* Edge vignette to focus the eye on the slab */}
      <div
        aria-hidden
        className="pointer-events-none absolute inset-0 bg-[radial-gradient(125%_125%_at_50%_45%,transparent_55%,rgba(0,0,0,0.55)_100%)]"
      />
      <header className="relative text-center">
        <p className="text-xs font-semibold uppercase tracking-[0.3em] text-amber-400">
          Slab Previewer
        </p>
        <h1 className="mt-2 text-4xl font-bold tracking-tight text-white">
          GuardedView
        </h1>
        <p className="mt-3 max-w-md text-sm text-neutral-400">
          Proof of concept — a CSS graded slab around a live card image. Hover it.
        </p>
      </header>

      {/* The slab scales to whatever this box is — try changing max-w. */}
      <div className="relative w-full max-w-90">
        <SlabBumper color="red">
          <PSASlab src={SAMPLE_CARD} />
        </SlabBumper>
      </div>
    </main>
  );
}
