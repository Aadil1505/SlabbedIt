"use client";

import { useCallback, useId, useRef, useState } from "react";
import Color from "color";
import { Check, Copy, Download, Pencil } from "lucide-react";
import { domToBlob, domToPng } from "modern-screenshot";
import { type CardResumeModel } from "@tcgdex/sdk";
import { tcgdex } from "@/lib/tcgdex";
import { CardSearch } from "@/components/card-search";
import { PSASlab, type LabelData } from "@/components/psa-slab";
import { Button } from "@/components/ui/button";
import {
  ColorPicker,
  ColorPickerEyeDropper,
  ColorPickerFormat,
  ColorPickerHue,
  ColorPickerSelection,
} from "@/components/ui/color-picker";
import {
  BUMPER_PRESETS,
  SlabBumper,
  type BumperColorName,
} from "@/components/slab-bumper";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import {
  Popover,
  PopoverContent,
  PopoverTrigger,
} from "@/components/ui/popover";
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

const LABEL_MODE_OPTS: { value: "logo" | "accurate"; label: string }[] = [
  { value: "logo", label: "Logo" },
  { value: "accurate", label: "Accurate" },
];

// PSA's grade scale and the abbreviated qualifier printed beside each number.
const PSA_GRADES: { grade: string; gradeLabel: string }[] = [
  { grade: "10", gradeLabel: "GEM MT" },
  { grade: "9", gradeLabel: "MINT" },
  { grade: "8", gradeLabel: "NM-MT" },
  { grade: "7", gradeLabel: "NM" },
  { grade: "6", gradeLabel: "EX-MT" },
  { grade: "5", gradeLabel: "EX" },
  { grade: "4", gradeLabel: "VG-EX" },
  { grade: "3", gradeLabel: "VG" },
  { grade: "2", gradeLabel: "GOOD" },
  { grade: "1", gradeLabel: "PR" },
];

// A believable 8-digit PSA-style cert number.
function makeCert() {
  return String(Math.floor(10000000 + Math.random() * 90000000));
}

export function SlabStudio() {
  const ids = useId();
  const urlId = `${ids}-url`;

  const [cardSrc, setCardSrc] = useState(SAMPLE_CARD);
  const [grader, setGrader] = useState<GraderId>("psa");

  // Label: "logo" keeps the original mark; "accurate" prints a real grade
  // lockup. Defaults describe the sample card so accurate mode reads right
  // immediately. Grade is always user-set (the catalog has none) — default 10.
  const [labelMode, setLabelMode] = useState<"logo" | "accurate">("logo");
  const [label, setLabel] = useState<LabelData>({
    name: "Charizard VMAX",
    set: "Shining Fates",
    year: "2021",
    number: "SV107",
    grade: "10",
    gradeLabel: "GEM MT",
    cert: "53917042",
  });
  // A new card pick is the only thing that overwrites the identity fields.
  const pickSeq = useRef(0);

  function setLabelField(key: keyof LabelData, value: string) {
    setLabel((prev) => ({ ...prev, [key]: value }));
  }

  // Event-driven auto-fill (not an effect, so manual edits aren't clobbered).
  // Identity comes from getCard() right away; year needs a 2nd cached fetch and
  // fills in when it resolves, degrading to an editable blank if it fails.
  async function handleSelectCard(card: CardResumeModel) {
    setCardSrc(card.getImageURL("high", "png"));
    const seq = ++pickSeq.current;
    setLabel((prev) => ({
      ...prev,
      name: card.name,
      number: card.localId,
      set: "",
      year: "",
      cert: makeCert(),
    }));
    try {
      const full = await card.getCard();
      if (seq !== pickSeq.current) return;
      setLabel((prev) => ({
        ...prev,
        name: full.name,
        number: full.localId,
        set: full.set?.name ?? "",
      }));
      // The card's nested `set` is plain data (no `getSet`), so fetch the full
      // set by id to get its release year. Cached by the SDK.
      const setId = full.set?.id;
      if (setId) {
        const set = await tcgdex.set.get(setId);
        if (seq !== pickSeq.current) return;
        setLabel((prev) => ({
          ...prev,
          year: (set?.releaseDate ?? "").slice(0, 4),
        }));
      }
    } catch {
      // Leave set/year blank and editable.
    }
  }

  const [showBumper, setShowBumper] = useState(true);
  // `color` is either a preset name or a literal hex (custom). The bumper's
  // `color` prop already accepts any CSS color, so both flow straight through.
  const [color, setColor] = useState<string>("red");
  // The last custom color, kept even while a preset is active so the gear
  // swatch keeps previewing it and reopening the picker resumes from it.
  const [customColor, setCustomColor] = useState("#7c4dff");
  const [thickness, setThickness] = useState<Thickness>("standard");
  const [finish, setFinish] = useState<Finish>("matte");
  const [translucent, setTranslucent] = useState(false);
  const [screws, setScrews] = useState(false);
  const [interactive, setInteractive] = useState(true);

  // The element captured on export. It wraps the slab assembly and, crucially,
  // sits *above* the `@container` on the slab/bumper — so every `cqw` still
  // resolves when modern-screenshot clones the node into an SVG foreignObject.
  const stageRef = useRef<HTMLDivElement>(null);
  const [busy, setBusy] = useState<null | "download" | "copy">(null);
  const [copied, setCopied] = useState(false);

  // Selecting a preset adopts its native material, so the clear/smoke/glow
  // presets read see-through immediately. The toggle can still override after.
  function pickColor(name: BumperColorName) {
    setColor(name);
    setTranslucent(PRESETS[name].translucent ?? false);
  }

  // Custom is active whenever `color` isn't one of the named presets.
  const isCustomActive = !(COLOR_NAMES as string[]).includes(color);

  // The picker reports rgba; the bumper shading is opaque (translucency is the
  // separate toggle), so we keep just the hex and apply it as the active color.
  const handlePickCustom = useCallback(
    (rgba: Parameters<typeof Color.rgb>[0]) => {
      const hex = Color.rgb(rgba).hex();
      setCustomColor(hex);
      setColor(hex);
    },
    [],
  );

  const activeGrader = GRADERS.find((g) => g.id === grader) ?? GRADERS[0];

  // Capture on a solid theme background (not the page's glows) so the light
  // acrylic pops and the dropped backdrop-filter blur is invisible — blurring a
  // flat color yields the same flat color. 3× scale keeps it crisp.
  function captureOptions() {
    return {
      backgroundColor: getComputedStyle(document.body).backgroundColor,
      scale: 3,
    };
  }

  async function handleDownload() {
    const node = stageRef.current;
    if (!node || busy) return;
    setBusy("download");
    try {
      const dataUrl = await domToPng(node, captureOptions());
      const a = document.createElement("a");
      a.href = dataUrl;
      a.download = `guardedview-${activeGrader.id}-slab.png`;
      a.click();
    } finally {
      setBusy(null);
    }
  }

  async function handleCopy() {
    const node = stageRef.current;
    if (!node || busy) return;
    setBusy("copy");
    try {
      // Hand the blob *Promise* to ClipboardItem so the write stays inside the
      // user gesture — Safari rejects a clipboard write done after an await.
      await navigator.clipboard.write([
        new ClipboardItem({ "image/png": domToBlob(node, captureOptions()) }),
      ]);
      setCopied(true);
      setTimeout(() => setCopied(false), 2000);
    } catch {
      // Clipboard image write unsupported (older browser) — Download still works.
    } finally {
      setBusy(null);
    }
  }
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
      labelMode={labelMode}
      label={label}
      interactive={interactive}
    />
  );

  return (
    <div className="relative z-10 flex min-h-0 flex-1 flex-col lg:flex-row">
      {/* Stage — the gallery floor. Transparent so the page backdrop shows. */}
      <section className="flex min-h-[60vh] flex-1 items-center justify-center px-6 py-12 lg:min-h-0 lg:overflow-auto lg:py-16">
        {/* Capture target. Padding gives the negative-offset floor shadow room
            so it isn't clipped out of the export. */}
        <div
          ref={stageRef}
          className="w-full max-w-[min(82vw,360px)] px-4 pt-3 pb-9 lg:max-w-[388px]"
        >
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
            <CardSearch onSelect={handleSelectCard} selectedURL={cardSrc} />
            <Row>
              <Label htmlFor={urlId}>Or paste an image URL</Label>
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

          <Section title="Label">
            <Row>
              <Label>Mode</Label>
              <Segmented
                options={LABEL_MODE_OPTS}
                value={labelMode}
                onChange={setLabelMode}
              />
            </Row>

            <fieldset
              disabled={labelMode !== "accurate"}
              className="flex flex-col gap-6 transition-opacity disabled:opacity-40"
            >
              <Row>
                <Label>Grade</Label>
                <div className="grid grid-cols-5 gap-2">
                  {PSA_GRADES.map(({ grade, gradeLabel }) => {
                    const active = label.grade === grade;
                    return (
                      <button
                        key={grade}
                        type="button"
                        onClick={() =>
                          setLabel((prev) => ({ ...prev, grade, gradeLabel }))
                        }
                        aria-pressed={active}
                        className={cn(
                          "rounded-md border py-1.5 font-heading text-sm transition-colors",
                          "focus-visible:ring-2 focus-visible:ring-ring focus-visible:outline-none",
                          active
                            ? "border-primary bg-primary text-primary-foreground"
                            : "border-border text-foreground hover:bg-accent/40",
                        )}
                      >
                        {grade}
                      </button>
                    );
                  })}
                </div>
                <span className="text-xs text-muted-foreground">
                  {label.gradeLabel}
                </span>
              </Row>

              <Row>
                <Label htmlFor={`${ids}-lname`}>Card name</Label>
                <Input
                  id={`${ids}-lname`}
                  value={label.name}
                  onChange={(e) => setLabelField("name", e.target.value)}
                />
              </Row>
              <Row>
                <Label htmlFor={`${ids}-lset`}>Set</Label>
                <Input
                  id={`${ids}-lset`}
                  value={label.set}
                  onChange={(e) => setLabelField("set", e.target.value)}
                  placeholder="—"
                />
              </Row>
              <div className="grid grid-cols-2 gap-3">
                <Row>
                  <Label htmlFor={`${ids}-lyear`}>Year</Label>
                  <Input
                    id={`${ids}-lyear`}
                    value={label.year}
                    onChange={(e) => setLabelField("year", e.target.value)}
                    placeholder="—"
                  />
                </Row>
                <Row>
                  <Label htmlFor={`${ids}-lnum`}>Number</Label>
                  <Input
                    id={`${ids}-lnum`}
                    value={label.number}
                    onChange={(e) => setLabelField("number", e.target.value)}
                  />
                </Row>
              </div>
              <Row>
                <Label htmlFor={`${ids}-lcert`}>Cert</Label>
                <Input
                  id={`${ids}-lcert`}
                  value={label.cert}
                  onChange={(e) => setLabelField("cert", e.target.value)}
                />
              </Row>
            </fieldset>
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

                  {/* Custom color — the last swatch. Previews the chosen hex
                      and opens a picker to set any bumper color. */}
                  <Popover>
                    <PopoverTrigger asChild>
                      <button
                        type="button"
                        title="Custom color"
                        aria-label="Custom color"
                        aria-pressed={isCustomActive}
                        className={cn(
                          "relative grid aspect-square place-items-center rounded-full border border-border/70 transition-transform",
                          "focus-visible:ring-2 focus-visible:ring-ring focus-visible:ring-offset-2 focus-visible:ring-offset-sidebar focus-visible:outline-none",
                          isCustomActive
                            ? "ring-2 ring-ring ring-offset-2 ring-offset-sidebar"
                            : "hover:scale-110",
                        )}
                        style={{ background: customColor }}
                      >
                        <Pencil className="size-3 text-white drop-shadow-[0_1px_1.5px_rgba(0,0,0,0.7)]" />
                      </button>
                    </PopoverTrigger>
                    <PopoverContent
                      align="end"
                      className="w-56"
                      // Don't steal focus back to the trigger while dragging.
                      onOpenAutoFocus={(e) => e.preventDefault()}
                    >
                      <ColorPicker
                        defaultValue={customColor}
                        onChange={handlePickCustom}
                      >
                        <ColorPickerSelection className="h-32 rounded-md" />
                        <ColorPickerHue />
                        <div className="flex items-center gap-2">
                          <ColorPickerEyeDropper />
                          <ColorPickerFormat />
                        </div>
                      </ColorPicker>
                    </PopoverContent>
                  </Popover>
                </div>
                <span className="text-xs capitalize text-muted-foreground">
                  {isCustomActive ? `Custom · ${color}` : color}
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

          <Section title="Export">
            <p className="text-xs text-muted-foreground">
              Save a clean image of your slab to share.
            </p>
            <div className="flex gap-2">
              <Button
                type="button"
                onClick={handleDownload}
                disabled={busy !== null}
                className="flex-1"
              >
                <Download />
                {busy === "download" ? "Saving…" : "Download"}
              </Button>
              <Button
                type="button"
                variant="outline"
                onClick={handleCopy}
                disabled={busy !== null}
                className="flex-1"
              >
                {copied ? <Check /> : <Copy />}
                {copied ? "Copied" : busy === "copy" ? "Copying…" : "Copy"}
              </Button>
            </div>
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
