import type { FloorId, ToolId } from "./layouts";

export const OFFICE_TOOLS = {
  ithaca: { name: "Ithaca", description: "Explore option pricing.", research: "/#black-scholes" },
  troy: { name: "Troy", description: "Explore market making and model risk.", research: "/#troy-market-making" },
  delphi: { name: "Delphi", description: "Compare models and price surfaces.", research: "/#delphi-methods" },
} as const;

export function officeToolDestination(tool: ToolId, floor: FloorId) {
  return floor === "resources" ? OFFICE_TOOLS[tool].research : "/tools/" + tool;
}
