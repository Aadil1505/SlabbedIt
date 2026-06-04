import TCGdex from "@tcgdex/sdk";

// One shared client for the whole app so the SDK's built-in cache (memory +
// web-storage) is reused across the search box and the label auto-fill.
export const tcgdex = new TCGdex("en");
