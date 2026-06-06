"use client";

import * as React from "react";
import Image from "next/image";
import { ImageUp, BadgeCheck, Download } from "lucide-react";

import { Button } from "@/components/ui/button";
import {
  Dialog,
  DialogClose,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";

const WELCOME_SEEN_KEY = "slabbedit:welcome-seen";

const STEPS = [
  {
    icon: ImageUp,
    title: "Bring your card",
    body: "Upload any card image, or search Pokémon cards by name.",
  },
  {
    icon: BadgeCheck,
    title: "Set the label",
    body: "Pick a grade and type the three label lines exactly as you want them printed.",
  },
  {
    icon: Download,
    title: "Admire and share",
    body: "Tilt the slab under the light, then download or copy the render.",
  },
] as const;

function subscribeToStorage(callback: () => void) {
  window.addEventListener("storage", callback);
  return () => window.removeEventListener("storage", callback);
}

function getWelcomeSeen() {
  try {
    return window.localStorage.getItem(WELCOME_SEEN_KEY) !== null;
  } catch {
    // Storage blocked (private mode, etc.): treat as seen rather than
    // re-showing the welcome every visit unpredictably.
    return true;
  }
}

export function WelcomeDialog() {
  // Hydration-safe first-visit check: the server snapshot reports "seen"
  // (closed), then the client snapshot reads localStorage after hydration.
  const seen = React.useSyncExternalStore(
    subscribeToStorage,
    getWelcomeSeen,
    () => true
  );
  const [dismissed, setDismissed] = React.useState(false);
  const open = !seen && !dismissed;

  const handleOpenChange = (next: boolean) => {
    if (!next) {
      setDismissed(true);
      try {
        window.localStorage.setItem(WELCOME_SEEN_KEY, "1");
      } catch {
        // Best effort; worst case the dialog shows again next visit.
      }
    }
  };

  return (
    <Dialog open={open} onOpenChange={handleOpenChange}>
      <DialogContent className="max-h-[calc(100dvh-2rem)] overflow-y-auto motion-reduce:animate-none sm:max-w-md">
        <DialogHeader>
          <DialogTitle className="flex items-center gap-2.5 text-xl tracking-tight">
            <Image
              src="/web-app-manifest-192x192.png"
              alt=""
              width={32}
              height={32}
              className="size-8 shrink-0 [image-rendering:pixelated]"
            />
            Welcome to SlabbedIt
          </DialogTitle>
          <DialogDescription>
            Preview your raw card sealed in a graded slab before you ever
            submit it. The slab renders live in your browser, and your card
            image never leaves it.
          </DialogDescription>
        </DialogHeader>

        <ul className="flex flex-col gap-4 py-1">
          {STEPS.map(({ icon: Icon, title, body }) => (
            <li key={title} className="flex items-start gap-3">
              <span className="mt-0.5 flex size-8 shrink-0 items-center justify-center rounded-md bg-primary/10 text-primary">
                <Icon className="size-4" aria-hidden />
              </span>
              <div className="flex flex-col gap-0.5">
                <span className="text-sm font-medium text-foreground">
                  {title}
                </span>
                <span className="text-sm text-muted-foreground">{body}</span>
              </div>
            </li>
          ))}
        </ul>

        <DialogFooter className="items-center sm:justify-between">
          <p className="text-xs text-muted-foreground">
            A preview tool. Not affiliated with PSA.
          </p>
          <DialogClose asChild>
            <Button>Slab your card</Button>
          </DialogClose>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
}
