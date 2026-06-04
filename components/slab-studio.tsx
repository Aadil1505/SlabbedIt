"use client";

import { useCallback, useId, useRef, useState } from "react";
import Color from "color";
import { Check, Copy, Download, Pencil, Upload } from "lucide-react";
import { domToBlob, domToPng } from "modern-screenshot";
import { type CardResumeModel } from "@tcgdex/sdk";
import { tcgdex } from "@/lib/tcgdex";
import { CardSearch } from "@/components/card-search";
import {
  EXPORT_SLAB_BG,
  PSASlab,
  SAMPLE_CARD_SRC,
  SLAB_BODY_ATTR,
  type LabelData,
} from "@/components/psa-slab";
import { Button } from "@/components/ui/button";
import {
  ColorPicker,
  ColorPickerEyeDropper,
  ColorPickerFormat,
  ColorPickerHue,
  ColorPickerSelection,
} from "@/components/ui/color-picker";
import {
  BUMPER_FACE_ATTR,
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
import { Slider } from "@/components/ui/slider";
import { ToggleGroup, ToggleGroupItem } from "@/components/ui/toggle-group";
import { cn } from "@/lib/utils";

type Thickness = "slim" | "standard" | "chunky";
type Finish = "matte" | "gloss";

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

  const [cardSrc, setCardSrc] = useState(SAMPLE_CARD_SRC);

  // Local upload: read the file straight to a data URL so the user's own card
  // image never leaves the browser and always exports cleanly (no CORS taint,
  // unlike an arbitrary remote URL). Non-images are ignored.
  const fileInputRef = useRef<HTMLInputElement>(null);
  const [dragOver, setDragOver] = useState(false);
  const [uploadError, setUploadError] = useState(false);

  function handleFile(file: File | null | undefined) {
    if (!file) return;
    if (!file.type.startsWith("image/")) {
      setUploadError(true);
      return;
    }
    setUploadError(false);
    const reader = new FileReader();
    reader.onload = () => {
      if (typeof reader.result === "string") setCardSrc(reader.result);
    };
    reader.onerror = () => setUploadError(true);
    reader.readAsDataURL(file);
  }

  // The printed grade label. Defaults describe the sample card so it reads
  // right immediately. Grade is always user-set (the catalog has none) —
  // default 10.
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
  const [customColor, setCustomColor] = useState("#06b6d4");
  const [thickness, setThickness] = useState<Thickness>("standard");
  const [bumperRadius, setBumperRadius] = useState(7.2);
  const [finish, setFinish] = useState<Finish>("matte");
  const [translucent, setTranslucent] = useState(false);
  const [interactive, setInteractive] = useState(true);

  // The element captured on export. It wraps the slab assembly and, crucially,
  // sits *above* the `@container` on the slab/bumper — so every `cqw` still
  // resolves when modern-screenshot clones the node into an SVG foreignObject.
  const stageRef = useRef<HTMLDivElement>(null);
  const [busy, setBusy] = useState<null | "download" | "copy">(null);
  const [copied, setCopied] = useState(false);
  const [exportError, setExportError] = useState(false);

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

  // Export just the subject on a transparent canvas — no painted background, so
  // the slab (and bumper, when shown) drops cleanly onto anything. 3× scale
  // keeps it crisp.
  //
  // The fixes below run on the *clone only* (onCloneNode, after computed styles
  // are inlined, so the inline override wins) — the live DOM is never touched,
  // no flicker. Both exist because modern-screenshot rasterizes via an SVG
  // foreignObject, where the browser ignores `backdrop-filter`:
  //   · slab body: leans on backdrop-filter to read as near-white acrylic, so
  //     we lay an opaque base under the same gradients (else the bumper bleeds
  //     through the translucent fill).
  //   · translucent bumper face: leans on backdrop-blur over the page; with no
  //     backdrop to blur it would export as a faint wash, so we swap in an
  //     opaque frosted fill of the bumper color.
  function captureOptions() {
    const resolvedBumper = isCustomActive
      ? color
      : PRESETS[color as BumperColorName].color;
    return {
      backgroundColor: null,
      scale: 3,
      onCloneNode(cloned: Node) {
        if (!(cloned instanceof Element)) return;
        const body = cloned.querySelector<HTMLElement>(`[${SLAB_BODY_ATTR}]`);
        body?.style.setProperty("background", EXPORT_SLAB_BG, "important");

        if (showBumper && translucent) {
          const frosted = Color(resolvedBumper).mix(Color("white"), 0.28).hex();
          cloned
            .querySelectorAll<HTMLElement>(`[${BUMPER_FACE_ATTR}="translucent"]`)
            .forEach((face) =>
              face.style.setProperty("background", frosted, "important"),
            );
        }
      },
    };
  }

  async function handleDownload() {
    const node = stageRef.current;
    if (!node || busy) return;
    setExportError(false);
    setBusy("download");
    try {
      const dataUrl = await domToPng(node, captureOptions());
      const a = document.createElement("a");
      a.href = dataUrl;
      a.download = "slabbedit-psa-slab.png";
      a.click();
    } catch {
      setExportError(true);
    } finally {
      setBusy(null);
    }
  }

  async function handleCopy() {
    const node = stageRef.current;
    if (!node || busy) return;
    setExportError(false);
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
      setExportError(true);
    } finally {
      setBusy(null);
    }
  }
  const slab = (
    <PSASlab src={cardSrc} label={label} interactive={interactive} />
  );

  return (
    <div className="relative z-10 flex min-h-0 flex-1 flex-col lg:flex-row">
      {/* Stage — the gallery floor. Transparent so the page backdrop shows. */}
      <section className="flex min-h-[60vh] flex-1 items-center justify-center px-6 py-12 lg:min-h-0 lg:overflow-auto lg:py-16">
        {/* Capture target. Padding gives the negative-offset floor shadow room
            so it isn't clipped out of the export. */}
        <div
          ref={stageRef}
          className="w-full max-w-[min(calc(82vw+64px),424px)] px-12 pt-12 pb-16 lg:max-w-[452px]"
        >
          {showBumper ? (
            <SlabBumper
              color={color}
              thickness={thickness}
              radius={bumperRadius}
              finish={finish}
              translucent={translucent}
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
              <Label htmlFor={`${ids}-upload`}>Or upload your own card</Label>
              <button
                type="button"
                onClick={() => fileInputRef.current?.click()}
                onDragOver={(e) => {
                  e.preventDefault();
                  setDragOver(true);
                }}
                onDragLeave={() => setDragOver(false)}
                onDrop={(e) => {
                  e.preventDefault();
                  setDragOver(false);
                  handleFile(e.dataTransfer.files?.[0]);
                }}
                className={cn(
                  "flex flex-col items-center justify-center gap-1.5 rounded-md border border-dashed px-4 py-6 text-center transition-colors",
                  "focus-visible:ring-2 focus-visible:ring-ring focus-visible:outline-none",
                  dragOver
                    ? "border-primary bg-primary/10"
                    : "border-border bg-background/40 hover:border-foreground/40 hover:bg-background/60",
                )}
              >
                <Upload className="size-5 text-muted-foreground" />
                <span className="text-sm text-foreground">
                  Drop a photo or click to upload
                </span>
                <span className="text-xs text-muted-foreground">
                  PNG or JPG of your card
                </span>
              </button>
              <input
                ref={fileInputRef}
                id={`${ids}-upload`}
                type="file"
                accept="image/*"
                className="sr-only"
                onChange={(e) => {
                  handleFile(e.target.files?.[0]);
                  // Reset so re-picking the same file fires onChange again.
                  e.target.value = "";
                }}
              />
              {uploadError && (
                <span className="text-xs text-destructive">
                  That file isn’t a supported image. Try a PNG or JPG.
                </span>
              )}
              <button
                type="button"
                onClick={() => {
                  setUploadError(false);
                  setCardSrc(SAMPLE_CARD_SRC);
                }}
                className="self-start text-xs text-muted-foreground underline underline-offset-4 transition-colors hover:text-foreground"
              >
                Reset to sample card
              </button>
            </Row>
          </Section>

          <Section title="Label">
            <div className="flex flex-col gap-6">
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
            </div>
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
                <div className="flex items-center justify-between gap-3">
                  <Label id={`${ids}-radius-label`}>Corner radius</Label>
                  <span className="font-mono text-xs tabular-nums text-muted-foreground">
                    {bumperRadius.toFixed(1)}
                  </span>
                </div>
                <Slider
                  min={3}
                  max={12}
                  step={0.1}
                  value={[bumperRadius]}
                  onValueChange={([value]) => setBumperRadius(value)}
                  disabled={!showBumper}
                  aria-labelledby={`${ids}-radius-label`}
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
            {exportError && (
              <span className="text-xs text-destructive">
                Couldn’t capture the slab. Try uploading the card image and
                exporting again.
              </span>
            )}
          </Section>
        </div>
      </aside>
    </div>
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
