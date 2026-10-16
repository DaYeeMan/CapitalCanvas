import { research } from "../research";
import { troyResearch } from "../troyResearch";
import { delphiResearch } from "../delphiResearch";

export const officeResearch = {
  ithaca: { groups: [
    { title: "Foundations & numerical methods", entries: research.slice(0, 4) },
    { title: "American & exotic options", entries: research.slice(4) },
  ], note: "asian", count: research.length + 1 },
  troy: { groups: [
    { title: "Pricing foundations", entries: troyResearch.slice(0, 3) },
    { title: "Dynamics & simulation", entries: troyResearch.slice(3) },
  ], note: "market-making", count: troyResearch.length + 1 },
  delphi: { groups: [{ title: "Pricing & surrogate models", entries: delphiResearch }], note: null, count: delphiResearch.length },
} as const;
