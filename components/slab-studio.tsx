"use client";

import { useCallback, useEffect, useId, useRef, useState } from "react";
import Color from "color";
import { ArrowUp, Check, Copy, Download, Pencil, Upload } from "lucide-react";
import { domToBlob } from "modern-screenshot";
import { type CardResumeModel } from "@tcgdex/sdk";
import { tcgdex } from "@/lib/tcgdex";
import { CardSearch } from "@/components/card-search";
import { PSASlab, SAMPLE_CARD_SRC, type LabelData } from "@/components/psa-slab";
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
import { InteractiveGridPattern } from "@/components/ui/interactive-grid-pattern";
import { Label } from "@/components/ui/label";
import {
  Popover,
  PopoverContent,
  PopoverTrigger,
} from "@/components/ui/popover";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { Switch } from "@/components/ui/switch";
import { Slider } from "@/components/ui/slider";
import { ToggleGroup, ToggleGroupItem } from "@/components/ui/toggle-group";
import { cn } from "@/lib/utils";

type Thickness = "slim" | "standard" | "chunky";
type Finish = "matte" | "gloss";
type CardFit = "contain" | "cover";
type CopyFeedback = null | "Copied" | "Shared" | "Saved";
type ExportNotice = null | {
  tone: "error" | "info";
  message: string;
};

const EXPORT_FILENAME = "slabbedit-psa-slab.png";
const EXPORT_SCALE = 4;

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

const CARD_FIT_OPTS: { value: CardFit; label: string }[] = [
  { value: "contain", label: "Fit full card" },
  { value: "cover", label: "Fill tray" },
];

// PSA's printed grade scale. Whole grades 1–10 plus half points; PSA issues
// halves 1.5–8.5 only (there is no 9.5; 9 jumps straight to 10). The half
// label is the lower whole grade's abbreviation + "+", except 1.5 = FR (Fair).
const PSA_GRADES: { grade: string; gradeLabel: string }[] = [
  { grade: "10", gradeLabel: "GEM MT" },
  { grade: "9", gradeLabel: "MINT" },
  { grade: "8.5", gradeLabel: "NM - MT+" },
  { grade: "8", gradeLabel: "NM - MT" },
  { grade: "7.5", gradeLabel: "NM+" },
  { grade: "7", gradeLabel: "NM" },
  { grade: "6.5", gradeLabel: "EX - MT+" },
  { grade: "6", gradeLabel: "EX - MT" },
  { grade: "5.5", gradeLabel: "EX+" },
  { grade: "5", gradeLabel: "EX" },
  { grade: "4.5", gradeLabel: "VG - EX+" },
  { grade: "4", gradeLabel: "VG - EX" },
  { grade: "3.5", gradeLabel: "VG+" },
  { grade: "3", gradeLabel: "VG" },
  { grade: "2.5", gradeLabel: "GOOD+" },
  { grade: "2", gradeLabel: "GOOD" },
  { grade: "1.5", gradeLabel: "FR" },
  { grade: "1", gradeLabel: "PR" },
];

const isHalfGrade = (grade: string) => grade.includes(".");

// PSA grade qualifiers (whole grades only; a half grade already means the card
// is high-end for its grade). Printed beside the number, e.g. "8 OC".
const PSA_QUALIFIERS = ["OC", "ST", "PD", "OF", "MK", "MC"] as const;

// A believable 9-digit PSA-style cert number (illustrative only).
function makeCert() {
  return String(Math.floor(100000000 + Math.random() * 900000000));
}

type LabelLines = Pick<LabelData, "line1" | "line2" | "line3">;

const SAMPLE_LABEL_LINES: LabelLines = {
  line1: "2021 POKEMON",
  line2: "Charizard VMAX",
  line3: "Shining Fates",
};

function pokemonLabelLines({
  year,
  name,
  set,
}: {
  year: string;
  name: string;
  set: string;
}): LabelLines {
  return {
    line1: [year, "POKEMON"].filter(Boolean).join(" "),
    line2: name,
    line3: set,
  };
}

const SAMPLE_LABEL: LabelData = {
  ...SAMPLE_LABEL_LINES,
  number: "SV107",
  grade: "10",
  gradeLabel: "GEM MT",
  qualifier: "",
  cert: "539170428",
  authentic: false,
};

export function SlabStudio() {
  const ids = useId();

  const [cardSrc, setCardSrc] = useState(SAMPLE_CARD_SRC);
  const [cardFit, setCardFit] = useState<CardFit>("contain");
  const [holoFoil, setHoloFoil] = useState(true);

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
    pickSeq.current += 1;
    setUploadError(false);
    const reader = new FileReader();
    reader.onload = () => {
      if (typeof reader.result === "string") {
        setCardSrc(reader.result);
        setCardFit("contain");
        setHoloFoil(false);
      }
    };
    reader.onerror = () => setUploadError(true);
    reader.readAsDataURL(file);
  }

  // Defaults describe the sample card so it reads right immediately. Grade is
  // always user-set because the catalog does not provide a grade.
  const [label, setLabel] = useState<LabelData>(SAMPLE_LABEL);
  // A new card pick is the only thing that overwrites the identity fields.
  const pickSeq = useRef(0);
  const manualLineEditSeq = useRef(0);

  function setLabelField(key: keyof LabelData, value: string) {
    if (key === "line1" || key === "line2" || key === "line3") {
      manualLineEditSeq.current += 1;
    }
    setLabel((prev) => ({ ...prev, [key]: value }));
  }

  function setGrade(grade: string) {
    const option = PSA_GRADES.find((g) => g.grade === grade);
    if (!option) return;
    setLabel((prev) => ({
      ...prev,
      grade,
      gradeLabel: option.gradeLabel,
      authentic: false,
      qualifier: isHalfGrade(grade) ? "" : prev.qualifier,
    }));
  }

  function resetToSampleCard() {
    pickSeq.current += 1;
    setUploadError(false);
    setCardSrc(SAMPLE_CARD_SRC);
    setCardFit("contain");
    setHoloFoil(true);
    setLabel(SAMPLE_LABEL);
  }

  // Event-driven auto-fill (not an effect, so manual edits aren't clobbered).
  // Identity comes from getCard() right away; year needs a 2nd cached fetch and
  // fills in when it resolves, degrading to an editable blank if it fails.
  async function handleSelectCard(card: CardResumeModel) {
    setCardSrc(card.getImageURL("high", "png"));
    setCardFit("contain");
    setHoloFoil(true);
    const seq = ++pickSeq.current;
    const lineEditSeqAtPick = manualLineEditSeq.current;
    const lines0 = pokemonLabelLines({ year: "", name: card.name, set: "" });
    setLabel((prev) => ({
      ...prev,
      ...lines0,
      number: card.localId,
      cert: makeCert(),
    }));
    try {
      const full = await card.getCard();
      if (seq !== pickSeq.current) return;
      const lines1 = pokemonLabelLines({
        year: "",
        name: full.name,
        set: full.set?.name ?? "",
      });
      setLabel((prev) => ({
        ...prev,
        ...(manualLineEditSeq.current === lineEditSeqAtPick ? lines1 : {}),
        number: full.localId,
      }));
      // The card's nested `set` is plain data (no `getSet`), so fetch the full
      // set by id to get its release year. Cached by the SDK.
      const setId = full.set?.id;
      if (setId) {
        const set = await tcgdex.set.get(setId);
        if (seq !== pickSeq.current) return;
        const lines2 = pokemonLabelLines({
          year: (set?.releaseDate ?? "").slice(0, 4),
          name: full.name,
          set: full.set?.name ?? "",
        });
        setLabel((prev) => ({
          ...prev,
          ...(manualLineEditSeq.current === lineEditSeqAtPick ? lines2 : {}),
        }));
      }
    } catch {
      // Leave lines as composed; year stays blank and editable.
    }
  }

  // A bumper is an accessory, not part of a PSA slab, so the bare slab is the
  // default — it keeps the PSA silhouette as the hero and the primary flow short.
  const [showBumper, setShowBumper] = useState(false);
  // `color` is either a preset name or a literal hex (custom). The bumper's
  // `color` prop already accepts any CSS color, so both flow straight through.
  // Black is a neutral first suggestion (red used to dominate the preview).
  const [color, setColor] = useState<string>("black");
  // The last custom color, kept even while a preset is active so the gear
  // swatch keeps previewing it and reopening the picker resumes from it.
  const [customColor, setCustomColor] = useState("#06b6d4");
  const [thickness, setThickness] = useState<Thickness>("standard");
  const [bumperRadius, setBumperRadius] = useState(7.2);
  const [finish, setFinish] = useState<Finish>("matte");
  const [translucent, setTranslucent] = useState(false);
  const [interactive, setInteractive] = useState(true);

  // Stage background: "none" (a neutral spotlight behind the slab) or an
  // uploaded image data URL that fills the whole stage area — left edge to the
  // control panel, navbar to footer — so the slab sits in a scene. Uploads stay
  // local (no CORS taint). The full-stage image is a viewing backdrop only; the
  // export captures just the slab box, so it isn't baked into the PNG.
  const [stageBg, setStageBg] = useState<string>("none");
  const bgFileInputRef = useRef<HTMLInputElement>(null);
  const bgIsImage = stageBg.startsWith("data:");

  // Optional opaque fill behind the slab box. Off by default so the ambient
  // stage grid shows through the clear polymer; on, it restores the solid
  // panel that isolates the slab from whatever is behind it.
  const [solidBackdrop, setSolidBackdrop] = useState(false);

  function handleBgFile(file: File | null | undefined) {
    if (!file || !file.type.startsWith("image/")) return;
    const reader = new FileReader();
    reader.onload = () => {
      if (typeof reader.result === "string") setStageBg(reader.result);
    };
    reader.readAsDataURL(file);
  }

  // On mobile the controls stack below the slab, so once someone scrolls down
  // to configure, a floating button offers a quick jump back up to the preview.
  // (On desktop the panel is always in view, and the button is hidden anyway.)
  const [showScrollTop, setShowScrollTop] = useState(false);
  useEffect(() => {
    const onScroll = () => setShowScrollTop(window.scrollY > 280);
    onScroll();
    window.addEventListener("scroll", onScroll, { passive: true });
    return () => window.removeEventListener("scroll", onScroll);
  }, []);

  // The element captured on export. It wraps the slab assembly and, crucially,
  // sits *above* the `@container` on the slab/bumper — so every `cqw` still
  // resolves when modern-screenshot clones the node into an SVG foreignObject.
  const stageRef = useRef<HTMLDivElement>(null);
  const [busy, setBusy] = useState<null | "download" | "copy">(null);
  const [copyFeedback, setCopyFeedback] = useState<CopyFeedback>(null);
  const [exportNotice, setExportNotice] = useState<ExportNotice>(null);

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

  // The capture target paints the same local stage shown behind the live slab,
  // so the PNG keeps the exact material contrast instead of flattening a
  // translucent slab onto a transparent canvas. 4× gives mobile exports enough
  // resolution for the label, rails, and shadows to stay crisp.
  function captureOptions() {
    return {
      backgroundColor: getComputedStyle(document.body).backgroundColor,
      scale: EXPORT_SCALE,
    };
  }

  async function createExportBlob(node: HTMLElement) {
    await Promise.all([
      document.fonts.ready,
      ...Array.from(node.querySelectorAll("img"), (img) =>
        img.decode().catch(() => undefined),
      ),
    ]);
    return domToBlob(node, captureOptions());
  }

  function downloadBlob(blob: Blob) {
    const url = URL.createObjectURL(blob);
    const a = document.createElement("a");
    a.href = url;
    a.download = EXPORT_FILENAME;
    a.click();
    setTimeout(() => URL.revokeObjectURL(url), 1000);
  }

  function showCopyFeedback(feedback: Exclude<CopyFeedback, null>) {
    setCopyFeedback(feedback);
    setTimeout(() => setCopyFeedback(null), 2000);
  }

  function canCopyPng() {
    if (
      !isSecureContext ||
      typeof ClipboardItem === "undefined" ||
      typeof navigator.clipboard?.write !== "function"
    ) {
      return false;
    }
    return (
      typeof ClipboardItem.supports !== "function" ||
      ClipboardItem.supports("image/png")
    );
  }

  async function shareOrDownload(blob: Blob) {
    const file = new File([blob], EXPORT_FILENAME, { type: "image/png" });
    const canShareFile =
      typeof navigator.share === "function" &&
      (typeof navigator.canShare !== "function" ||
        navigator.canShare({ files: [file] }));

    if (canShareFile) {
      try {
        await navigator.share({
          files: [file],
          title: "SlabbedIt slab",
        });
        showCopyFeedback("Shared");
        setExportNotice(null);
        return;
      } catch (error) {
        if (error instanceof DOMException && error.name === "AbortError") return;
      }
    }

    downloadBlob(blob);
    showCopyFeedback("Saved");
    setExportNotice({
      tone: "info",
      message: isSecureContext
        ? "Image copy isn’t supported by this browser, so the PNG was downloaded instead."
        : "Image copy requires HTTPS. The same PNG was downloaded instead.",
    });
  }

  async function handleDownload() {
    const node = stageRef.current;
    if (!node || busy) return;
    setExportNotice(null);
    setBusy("download");
    try {
      downloadBlob(await createExportBlob(node));
    } catch {
      setExportNotice({
        tone: "error",
        message: "Couldn’t create the PNG. Wait for the card image to load and retry.",
      });
    } finally {
      setBusy(null);
    }
  }

  async function handleCopy() {
    const node = stageRef.current;
    if (!node || busy) return;
    setExportNotice(null);
    setBusy("copy");
    const blobPromise = createExportBlob(node);
    try {
      if (canCopyPng()) {
        try {
          // Safari requires write() during the user gesture, so pass the
          // still-running capture Promise directly to ClipboardItem.
          await navigator.clipboard.write([
            new ClipboardItem({ "image/png": blobPromise }),
          ]);
          showCopyFeedback("Copied");
          return;
        } catch {
          // Some mobile browsers expose the API but reject image writes. Fall
          // through to the native share sheet or a download.
        }
      }

      await shareOrDownload(await blobPromise);
    } catch {
      setExportNotice({
        tone: "error",
        message: "Couldn’t create the PNG. Wait for the card image to load and retry.",
      });
    } finally {
      setBusy(null);
    }
  }
  const slab = (
    <PSASlab
      src={cardSrc}
      label={label}
      interactive={interactive}
      cardFit={cardFit}
      holoFoil={holoFoil}
    />
  );

  return (
    <div className="relative z-10 flex min-h-0 flex-1 flex-col lg:flex-row">
      {/* Stage — the gallery floor. An uploaded image fills the whole stage as
          a scene backdrop (the slab box stays transparent so it shows through);
          "none" falls back to the neutral spotlight behind the slab only. */}
      <section
        className={cn(
          "relative flex min-h-[60vh] flex-1 items-center justify-center overflow-hidden bg-background px-6 py-12 lg:min-h-0 lg:py-16",
          bgIsImage && "bg-cover bg-center bg-no-repeat",
        )}
        style={bgIsImage ? { backgroundImage: `url("${stageBg}")` } : undefined}
      >
        {/* Ambient grid across the whole stage floor. Viewing backdrop only —
            it sits outside the capture target so exports stay clean. Hidden
            when an uploaded image fills the stage. */}
        {!bgIsImage && (
          <div
            aria-hidden
            className="absolute inset-0 [mask-image:radial-gradient(52%_50%_at_50%_50%,white_28%,transparent_100%)]"
          >
            {/* The SVG renders at its natural size (squares × cell) and is
                centered; the mask lives on this section-sized wrapper so the
                fade tracks the visible stage, not the oversized SVG box. */}
            <InteractiveGridPattern
              width={40}
              height={40}
              squares={[60, 36]}
              className="inset-auto top-1/2 left-1/2 h-auto w-auto -translate-x-1/2 -translate-y-1/2"
              squaresClassName="stroke-foreground/[0.07]"
            />
          </div>
        )}
        {/* Capture target. Padding gives the negative-offset floor shadow room
            so it isn't clipped out of the export. */}
        <div
          ref={stageRef}
          data-export-stage
          className="relative isolate w-full max-w-[min(calc(82vw+64px),424px)] px-12 pt-12 pb-16 lg:max-w-[452px]"
        >
          {/* Stage backdrop behind the slab — a neutral spotlight so no brand
              light tints the clear polymer. When an image is uploaded it fills
              the whole stage instead (see the section above) and this is null. */}
          <StageBackdrop bg={stageBg} solid={solidBackdrop} />
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

          {/* Persistent provenance mark — lives INSIDE the capture target so
              every exported PNG carries it (the footer disclaimer sits outside
              the export). Subtle, but deliberately not removable from the view. */}
          <span
            aria-hidden
            className="pointer-events-none absolute inset-x-0 bottom-4 z-20 text-center font-heading text-[11px] uppercase tracking-[0.18em] text-muted-foreground/55"
          >
            SlabbedIt Preview · Illustrative only
          </span>
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
                onClick={resetToSampleCard}
                className="self-start text-xs text-muted-foreground underline underline-offset-4 transition-colors hover:text-foreground"
              >
                Reset to sample card
              </button>
            </Row>
            <Row>
              <Label>Card fit</Label>
              <Segmented
                options={CARD_FIT_OPTS}
                value={cardFit}
                onChange={setCardFit}
              />
              <span className="text-xs text-muted-foreground">
                Use Fit for scans. Fill tray crops edge background from phone
                photos.
              </span>
            </Row>
          </Section>

          <Section title="Label">
            <div className="flex flex-col gap-6">
              <Row>
                <Label htmlFor={`${ids}-grade`}>Grade</Label>
                <Select
                  value={label.grade}
                  disabled={label.authentic}
                  onValueChange={setGrade}
                >
                  <SelectTrigger id={`${ids}-grade`} className="w-full">
                    <SelectValue placeholder="Select a grade" />
                  </SelectTrigger>
                  <SelectContent>
                    {PSA_GRADES.map(({ grade, gradeLabel }) => (
                      <SelectItem key={grade} value={grade}>
                        {grade} · {gradeLabel}
                      </SelectItem>
                    ))}
                  </SelectContent>
                </Select>
                <span className="text-xs text-muted-foreground">
                  {label.authentic
                    ? "Authentic, no numeric grade"
                    : label.gradeLabel}
                </span>
              </Row>

              <SwitchRow
                id={`${ids}-auth`}
                label="Authentic (no grade)"
                checked={label.authentic}
                onChange={(v) =>
                  setLabel((prev) => ({
                    ...prev,
                    authentic: v,
                    gradeLabel: v
                      ? "AUTHENTIC"
                      : (PSA_GRADES.find((g) => g.grade === prev.grade)
                          ?.gradeLabel ?? prev.gradeLabel),
                    qualifier: v ? "" : prev.qualifier,
                  }))
                }
              />

              <Row>
                <Label>Qualifier</Label>
                <fieldset
                  disabled={label.authentic || isHalfGrade(label.grade)}
                  className="grid grid-cols-4 gap-2 transition-opacity disabled:opacity-40"
                >
                  {["", ...PSA_QUALIFIERS].map((q) => {
                    const active = label.qualifier === q;
                    return (
                      <button
                        key={q || "none"}
                        type="button"
                        onClick={() => setLabelField("qualifier", q)}
                        aria-pressed={active}
                        className={cn(
                          "rounded-md border py-1.5 font-heading text-xs transition-colors",
                          "focus-visible:ring-2 focus-visible:ring-ring focus-visible:outline-none",
                          active
                            ? "border-primary bg-primary text-primary-foreground"
                            : "border-border text-foreground hover:bg-accent/40",
                        )}
                      >
                        {q || "None"}
                      </button>
                    );
                  })}
                </fieldset>
                <span className="text-xs text-muted-foreground">
                  Whole grades only; printed beside the number.
                </span>
              </Row>

              <SwitchRow
                id={`${ids}-foil`}
                label="Holo or foil surface"
                checked={holoFoil}
                onChange={setHoloFoil}
              />

              <Row>
                <Label htmlFor={`${ids}-l1`}>Line 1</Label>
                <Input
                  id={`${ids}-l1`}
                  value={label.line1}
                  onChange={(e) => setLabelField("line1", e.target.value)}
                  placeholder="2026 POKEMON ASC EN"
                />
              </Row>
              <Row>
                <Label htmlFor={`${ids}-l2`}>Line 2</Label>
                <Input
                  id={`${ids}-l2`}
                  value={label.line2}
                  onChange={(e) => setLabelField("line2", e.target.value)}
                  placeholder="Pikachu ex"
                />
              </Row>
              <Row>
                <Label htmlFor={`${ids}-l3`}>Line 3</Label>
                <Input
                  id={`${ids}-l3`}
                  value={label.line3}
                  onChange={(e) => setLabelField("line3", e.target.value)}
                  placeholder="Special Illustration Rare"
                />
              </Row>

              <div className="grid grid-cols-2 gap-3">
                <Row>
                  <Label htmlFor={`${ids}-lnum`}>Number</Label>
                  <Input
                    id={`${ids}-lnum`}
                    value={label.number}
                    onChange={(e) => setLabelField("number", e.target.value)}
                  />
                </Row>
                <Row>
                  <Label htmlFor={`${ids}-lcert`}>Cert</Label>
                  <Input
                    id={`${ids}-lcert`}
                    value={label.cert}
                    onChange={(e) => setLabelField("cert", e.target.value)}
                  />
                </Row>
              </div>
            </div>
          </Section>

          <Section title="Accessories">
            <SwitchRow
              id={`${ids}-show`}
              label="Protective bumper"
              checked={showBumper}
              onChange={setShowBumper}
            />

            {/* Controls only appear when the bumper is enabled, so the section
                stays collapsed by default and the primary flow is short. */}
            {showBumper && (
              <fieldset className="flex flex-col gap-6">
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
            )}
          </Section>

          <Section title="Stage">
            <SwitchRow
              id={`${ids}-tilt`}
              label="Cursor tilt"
              checked={interactive}
              onChange={setInteractive}
            />

            <SwitchRow
              id={`${ids}-solid-backdrop`}
              label="Solid backdrop"
              checked={solidBackdrop}
              onChange={setSolidBackdrop}
            />

            <Row>
              <Label>Background</Label>
              <div className="grid grid-cols-2 gap-2">
                <button
                  type="button"
                  onClick={() => setStageBg("none")}
                  aria-pressed={!bgIsImage}
                  className={cn(
                    "rounded-md border py-1.5 font-heading text-xs transition-colors",
                    "focus-visible:ring-2 focus-visible:ring-ring focus-visible:outline-none",
                    !bgIsImage
                      ? "border-primary bg-primary text-primary-foreground"
                      : "border-border text-foreground hover:bg-accent/40",
                  )}
                >
                  None
                </button>
                <button
                  type="button"
                  onClick={() => bgFileInputRef.current?.click()}
                  aria-pressed={bgIsImage}
                  className={cn(
                    "rounded-md border py-1.5 font-heading text-xs transition-colors",
                    "focus-visible:ring-2 focus-visible:ring-ring focus-visible:outline-none",
                    bgIsImage
                      ? "border-primary bg-primary text-primary-foreground"
                      : "border-border text-foreground hover:bg-accent/40",
                  )}
                >
                  Image…
                </button>
              </div>
              <input
                ref={bgFileInputRef}
                type="file"
                accept="image/*"
                className="sr-only"
                onChange={(e) => {
                  handleBgFile(e.target.files?.[0]);
                  // Reset so re-picking the same file fires onChange again.
                  e.target.value = "";
                }}
              />
              <span className="text-xs text-muted-foreground">
                Fills the whole stage with your image as a scene behind the
                slab. Preview only — not included in the export.
              </span>
            </Row>
          </Section>

          <Section title="Export">
            <p className="text-xs text-muted-foreground">
              Save the studio view as a high-resolution PNG.
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
                {copyFeedback ? <Check /> : <Copy />}
                {copyFeedback ?? (busy === "copy" ? "Copying…" : "Copy")}
              </Button>
            </div>
            {exportNotice && (
              <span
                role={exportNotice.tone === "error" ? "alert" : "status"}
                className={cn(
                  "text-xs",
                  exportNotice.tone === "error"
                    ? "text-destructive"
                    : "text-muted-foreground",
                )}
              >
                {exportNotice.message}
              </span>
            )}
          </Section>
        </div>
      </aside>

      {/* Mobile-only jump-to-preview button. Fades in once scrolled past the
          slab so the card is one tap away from anywhere in the controls. */}
      <button
        type="button"
        onClick={() => window.scrollTo({ top: 0, behavior: "smooth" })}
        aria-label="Scroll up to your slab"
        className={cn(
          "fixed right-5 bottom-6 z-40 grid size-12 place-items-center rounded-full",
          "border border-border bg-primary text-primary-foreground shadow-lg shadow-black/25",
          "transition-all duration-200 lg:hidden",
          "focus-visible:ring-2 focus-visible:ring-ring focus-visible:ring-offset-2 focus-visible:ring-offset-background focus-visible:outline-none",
          showScrollTop
            ? "scale-100 opacity-100"
            : "pointer-events-none translate-y-2 scale-90 opacity-0",
        )}
      >
        <ArrowUp className="size-5" />
      </button>
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

// The stage backdrop behind the slab, inside the capture target. An uploaded
// image fills the whole stage at the section level instead, so the box stays
// transparent and the scene shows through the clear slab — only "none" paints
// here, as a neutral spotlight that travels into the export.
function StageBackdrop({ bg, solid }: { bg: string; solid: boolean }) {
  if (bg.startsWith("data:")) return null;

  return (
    <div
      aria-hidden
      className={cn(
        "pointer-events-none absolute inset-0 -z-10 bg-[radial-gradient(62%_60%_at_50%_46%,color-mix(in_oklch,var(--foreground)_7%,transparent),transparent_72%)]",
        solid && "bg-background",
      )}
    />
  );
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
