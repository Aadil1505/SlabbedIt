"use client";

import { createContext, useContext } from "react";

/**
 * True when a component is rendered inside a <SlabBumper />. A wrapped slab
 * uses this to disable its own tilt so the bumper can drive the whole
 * assembly's motion instead (the slab's gloss still tracks via inherited
 * --mx/--my custom properties).
 */
export const BumperContext = createContext(false);

export const useInsideBumper = () => useContext(BumperContext);
