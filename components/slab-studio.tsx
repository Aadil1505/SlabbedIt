"use client";

import { useId, useState } from "react";
import { PSASlab } from "@/components/psa-slab";
import {
  BUMPER_PRESETS,
  SlabBumper,
  type BumperColorName,
} from "@/components/slab-bumper";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Switch } from "@/components/ui/switch";
import { ToggleGroup, ToggleGroupItem } from "@/components/ui/toggle-group";
import { cn } from "@/lib/utils";

// Shining Fates Charizard VMAX (SV107) from TCGdex's high-res assets.
// If the URL ever 404s, PSASlab falls back to a holo placeholder.
const SAMPLE_CARD = "https://assets.tcgdex.net/en/swsh/swsh4.5/SV107/high.png";

type Thickness = "slim" | "standard" | "chunky";
type Finish = "matte" | "gloss";
type GraderId = "psa" | "bgs" | "cgc" | "sgc";

// Each grading company sets its house color (drives the label border) and its
// official mark on the label, shipped as a trimmed, equal-height transparent PNG
// in /public so the lockups read consistently across companies. `GraderLogo`
// stays as a text fallback if a `logoSrc` is ever missing.
const GRADERS: {
  id: GraderId;
  name: string;
  full: string;
  color: string;
  logoSrc?: string;
}[] = [
  {
    id: "psa",
    name: "PSA",
    full: "Professional Sports Authenticator",
    color: "#cf1f2e",
    logoSrc: "/psa.png",
  },
  {
    id: "bgs",
    name: "BGS",
    full: "Beckett Grading Services",
    color: "#9c7a1e",
    logoSrc: "/bgs.png",
  },
  {
    id: "cgc",
    name: "CGC",
    full: "Certified Guaranty Company",
    color: "#ce0e2d",
    logoSrc: "/cgc.png",
  },
  {
    id: "sgc",
    name: "SGC",
    full: "Sportscard Guaranty",
    color: "#1b1b1b",
    logoSrc: "/sgc.png",
  },
];

// Widen the `as const` preset map so optional `translucent` is visible.
const PRESETS: Record<BumperColorName, { color: string; translucent?: boolean }> =
  BUMPER_PRESETS;
const COLOR_NAMES = Object.keys(BUMPER_PRESETS) as BumperColorName[];

const THICKNESS_OPTS: { value: Thickness; label: string }[] = [
  { value: "slim", label: "Slim" },
  { value: "standard", label: "Standard" },
  { value: "chunky", label: "Chunky" },
];

const FINISH_OPTS: { value: Finish; label: string }[] = [
  { value: "matte", label: "Matte" },
  { value: "gloss", label: "Gloss" },
];

export function SlabStudio() {
  const ids = useId();
  const urlId = `${ids}-url`;

  const [cardSrc, setCardSrc] = useState(SAMPLE_CARD);
  const [grader, setGrader] = useState<GraderId>("psa");

  const [showBumper, setShowBumper] = useState(true);
  const [color, setColor] = useState<BumperColorName>("red");
  const [thickness, setThickness] = useState<Thickness>("standard");
  const [finish, setFinish] = useState<Finish>("matte");
  const [translucent, setTranslucent] = useState(false);
  const [screws, setScrews] = useState(false);
  const [interactive, setInteractive] = useState(true);

  // Selecting a preset adopts its native material, so the clear/smoke/glow
  // presets read see-through immediately. The toggle can still override after.
  function pickColor(name: BumperColorName) {
    setColor(name);
    setTranslucent(PRESETS[name].translucent ?? false);
  }

  const activeGrader = GRADERS.find((g) => g.id === grader) ?? GRADERS[0];
  const logo = activeGrader.logoSrc ? (
    // eslint-disable-next-line @next/next/no-img-element
    <img
      src={activeGrader.logoSrc}
      alt={activeGrader.name}
      draggable={false}
      className="h-[9cqw] w-auto select-none object-contain"
    />
  ) : (
    <GraderLogo grader={activeGrader} />
  );

  const slab = (
    <PSASlab
      src={cardSrc}
      logo={logo}
      labelColor={activeGrader.color}
      interactive={interactive}
    />
  );

  return (
    <div className="relative z-10 flex min-h-0 flex-1 flex-col lg:flex-row">
      {/* Stage — the gallery floor. Transparent so the page backdrop shows. */}
      <section className="flex min-h-[60vh] flex-1 items-center justify-center px-6 py-12 lg:min-h-0 lg:overflow-auto lg:py-16">
        <div className="w-full max-w-[min(82vw,340px)] lg:max-w-[360px]">
          {showBumper ? (
            <SlabBumper
              color={color}
              thickness={thickness}
              finish={finish}
              translucent={translucent}
              screws={screws}
              interactive={interactive}
            >
              {slab}
            </SlabBumper>
          ) : (
            slab
          )}
        </div>
      </section>

      {/* Control panel */}
      <aside className="w-full shrink-0 border-t border-border bg-sidebar/85 backdrop-blur-xl lg:w-[360px] lg:border-t-0 lg:border-l lg:overflow-y-auto">
        <div className="flex flex-col gap-8 p-6">
          <Section title="Card">
            <Row>
              <Label htmlFor={urlId}>Image URL</Label>
              <Input
                id={urlId}
                value={cardSrc}
                onChange={(e) => setCardSrc(e.target.value)}
                placeholder="https://…/card.png"
                spellCheck={false}
              />
              <button
                type="button"
                onClick={() => setCardSrc(SAMPLE_CARD)}
                className="self-start text-xs text-muted-foreground underline underline-offset-4 transition-colors hover:text-foreground"
              >
                Reset to sample card
              </button>
            </Row>
            <Row>
              <Label>Grading company</Label>
              <Segmented
                options={GRADERS.map((g) => ({ value: g.id, label: g.name }))}
                value={grader}
                onChange={setGrader}
              />
            </Row>
          </Section>

          <Section title="Bumper">
            <SwitchRow
              id={`${ids}-show`}
              label="Show bumper"
              checked={showBumper}
              onChange={setShowBumper}
            />

            <fieldset
              disabled={!showBumper}
              className="flex flex-col gap-6 transition-opacity disabled:opacity-40"
            >
              <Row>
                <Label>Color</Label>
                <div className="grid grid-cols-6 gap-2">
                  {COLOR_NAMES.map((name) => {
                    const preset = PRESETS[name];
                    const active = color === name;
                    return (
                      <button
                        key={name}
                        type="button"
                        onClick={() => pickColor(name)}
                        title={name}
                        aria-label={name}
                        aria-pressed={active}
                        className={cn(
                          "relative aspect-square rounded-full border border-border/70 transition-transform",
                          "focus-visible:ring-2 focus-visible:ring-ring focus-visible:ring-offset-2 focus-visible:ring-offset-sidebar focus-visible:outline-none",
                          active
                            ? "ring-2 ring-ring ring-offset-2 ring-offset-sidebar"
                            : "hover:scale-110",
                        )}
                        style={{
                          background: preset.translucent
                            ? `color-mix(in srgb, ${preset.color} 55%, transparent)`
                            : preset.color,
                        }}
                      />
                    );
                  })}
                </div>
                <span className="text-xs capitalize text-muted-foreground">
                  {color}
                </span>
              </Row>

              <Row>
                <Label>Thickness</Label>
                <Segmented
                  options={THICKNESS_OPTS}
                  value={thickness}
                  onChange={setThickness}
                  disabled={!showBumper}
                />
              </Row>

              <Row>
                <Label>Finish</Label>
                <Segmented
                  options={FINISH_OPTS}
                  value={finish}
                  onChange={setFinish}
                  disabled={!showBumper}
                />
              </Row>

              <SwitchRow
                id={`${ids}-translucent`}
                label="Translucent"
                checked={translucent}
                onChange={setTranslucent}
              />
              <SwitchRow
                id={`${ids}-screws`}
                label="Corner screws"
                checked={screws}
                onChange={setScrews}
              />
            </fieldset>
          </Section>

          <Section title="Stage">
            <SwitchRow
              id={`${ids}-tilt`}
              label="Cursor tilt"
              checked={interactive}
              onChange={setInteractive}
            />
          </Section>
        </div>
      </aside>
    </div>
  );
}

/* ------------------------------------------------------------------ logo */

// One consistent lockup for every company: a bold acronym over a tracked,
// uppercase full name, both in the house color, optically centered. Sized in
// `cqw` so it scales with the slab. Swap in an official mark via `logoSrc`.
function GraderLogo({
  grader,
}: {
  grader: { name: string; full: string; color: string };
}) {
  return (
    <span
      style={{ color: grader.color }}
      className="flex select-none flex-col items-center leading-none"
    >
      <span className="font-sans text-[7.5cqw] font-black tracking-[-0.02em]">
        {grader.name}
      </span>
      <span className="mt-[1.3cqw] font-sans text-[1.7cqw] font-semibold tracking-[0.2em] uppercase">
        {grader.full}
      </span>
    </span>
  );
}

/* ---------------------------------------------------------------- primitives */

function Section({
  title,
  children,
}: {
  title: string;
  children: React.ReactNode;
}) {
  return (
    <section className="flex flex-col gap-5">
      <div className="flex items-center gap-3">
        <h2 className="font-heading text-lg tracking-wide text-foreground">
          {title}
        </h2>
        <span className="h-px flex-1 bg-border" />
      </div>
      {children}
    </section>
  );
}

function Row({ children }: { children: React.ReactNode }) {
  return <div className="flex flex-col gap-2">{children}</div>;
}

function SwitchRow({
  id,
  label,
  checked,
  onChange,
}: {
  id: string;
  label: string;
  checked: boolean;
  onChange: (v: boolean) => void;
}) {
  return (
    <div className="flex items-center justify-between gap-3">
      <Label htmlFor={id}>{label}</Label>
      <Switch id={id} checked={checked} onCheckedChange={onChange} />
    </div>
  );
}

function Segmented<T extends string>({
  options,
  value,
  onChange,
  disabled,
}: {
  options: { value: T; label: string }[];
  value: T;
  onChange: (v: T) => void;
  disabled?: boolean;
}) {
  return (
    <ToggleGroup
      type="single"
      variant="outline"
      value={value}
      onValueChange={(v) => v && onChange(v as T)}
      disabled={disabled}
      className="w-full"
    >
      {options.map((opt) => (
        <ToggleGroupItem
          key={opt.value}
          value={opt.value}
          aria-label={opt.label}
          className="flex-1 data-[state=on]:border-primary data-[state=on]:bg-primary data-[state=on]:text-primary-foreground"
        >
          {opt.label}
        </ToggleGroupItem>
      ))}
    </ToggleGroup>
  );
}
