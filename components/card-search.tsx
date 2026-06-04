"use client";

import { useEffect, useId, useRef, useState } from "react";
import { Search } from "lucide-react";
// `CardResumeModel` is the result class that carries `getImageURL()`; the
// plain `CardResume` export is just the data interface without it.
import TCGdex, { Query, type CardResumeModel } from "@tcgdex/sdk";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { cn } from "@/lib/utils";

// One instance for the whole client. Its built-in cache (memory + web-storage)
// then persists across renders and remounts, so repeating a search is free.
const tcgdex = new TCGdex("en");

const DEBOUNCE_MS = 300;
const PAGE_SIZE = 24;

type Props = {
  // Called with a ready-to-use high-res image URL when a card is picked.
  onSelect: (imageURL: string) => void;
  // The currently shown card URL, so we can mark the active result.
  selectedURL?: string;
};

export function CardSearch({ onSelect, selectedURL }: Props) {
  const searchId = useId();
  const [query, setQuery] = useState("");
  const [results, setResults] = useState<CardResumeModel[]>([]);
  const [status, setStatus] = useState<"idle" | "loading" | "error">("idle");

  // The SDK's `list()` takes no AbortSignal, so we can't cancel in-flight
  // requests. Instead each search claims a sequence number and only the latest
  // one is allowed to write state — stale responses are dropped.
  const latest = useRef(0);

  function handleChange(value: string) {
    setQuery(value);
    // Flip to loading in the event handler (not the effect) so there's no
    // flash of "no results" during the debounce window.
    setStatus(value.trim().length < 2 ? "idle" : "loading");
  }

  useEffect(() => {
    const term = query.trim();
    if (term.length < 2) {
      latest.current++; // invalidate any request still in flight
      return;
    }

    const seq = ++latest.current;
    const timer = setTimeout(async () => {
      try {
        const cards = await tcgdex.card.list(
          new Query().contains("name", term).paginate(1, PAGE_SIZE),
        );
        if (seq !== latest.current) return; // a newer search superseded us
        setResults(cards.filter((c) => c.image)); // drop imageless cards
        setStatus("idle");
      } catch {
        if (seq !== latest.current) return;
        setStatus("error");
      }
    }, DEBOUNCE_MS);

    return () => clearTimeout(timer);
  }, [query]);

  return (
    <div className="flex flex-col gap-3">
      <div className="flex flex-col gap-2">
        <Label htmlFor={searchId}>Search cards</Label>
        <div className="relative">
          <Search
            aria-hidden
            className="pointer-events-none absolute top-1/2 left-3 size-4 -translate-y-1/2 text-muted-foreground"
          />
          <Input
            id={searchId}
            type="search"
            value={query}
            onChange={(e) => handleChange(e.target.value)}
            placeholder="e.g. Charizard"
            spellCheck={false}
            autoComplete="off"
            className="pl-9"
          />
        </div>
      </div>

      <SearchBody
        query={query.trim()}
        status={status}
        results={results}
        selectedURL={selectedURL}
        onSelect={onSelect}
      />
    </div>
  );
}

function SearchBody({
  query,
  status,
  results,
  selectedURL,
  onSelect,
}: {
  query: string;
  status: "idle" | "loading" | "error";
  results: CardResumeModel[];
  selectedURL?: string;
  onSelect: (url: string) => void;
}) {
  if (status === "error") {
    return <Hint>Couldn’t reach TCGdex. Check your connection and retry.</Hint>;
  }
  if (query.length < 2) {
    return <Hint>Type at least two letters to search.</Hint>;
  }
  if (status === "loading" && results.length === 0) {
    return <Hint>Searching…</Hint>;
  }
  if (results.length === 0) {
    return <Hint>No cards found for “{query}”.</Hint>;
  }

  return (
    <div
      className={cn(
        "grid max-h-72 grid-cols-3 gap-2 overflow-y-auto rounded-md border border-border bg-background/40 p-2",
        status === "loading" && "opacity-60",
      )}
    >
      {results.map((card) => {
        const thumb = card.getImageURL("low", "webp");
        const full = card.getImageURL("high", "png");
        const active = full === selectedURL;
        return (
          <button
            key={card.id}
            type="button"
            onClick={() => onSelect(full)}
            title={`${card.name} · ${card.id}`}
            aria-label={`${card.name} (${card.id})`}
            aria-pressed={active}
            className={cn(
              "group relative overflow-hidden rounded-sm border transition-transform",
              "focus-visible:ring-2 focus-visible:ring-ring focus-visible:ring-offset-2 focus-visible:ring-offset-sidebar focus-visible:outline-none",
              active
                ? "border-primary ring-2 ring-ring"
                : "border-border/60 hover:scale-[1.04] hover:border-border",
            )}
          >
            {/* Plain <img> on purpose: next/image would route these through
                Vercel's Image Optimization and meter against the plan. */}
            {/* eslint-disable-next-line @next/next/no-img-element */}
            <img
              src={thumb}
              alt={card.name}
              loading="lazy"
              draggable={false}
              className="aspect-[2.5/3.5] w-full select-none object-cover"
            />
          </button>
        );
      })}
    </div>
  );
}

function Hint({ children }: { children: React.ReactNode }) {
  return <p className="text-xs text-muted-foreground">{children}</p>;
}
