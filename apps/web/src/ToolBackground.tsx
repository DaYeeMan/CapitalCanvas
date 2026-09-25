import { FieldBackground } from "./site/FieldBackground";
import { useFieldMotionRestricted } from "./site/useFieldMotionRestricted";
import "./tool-background.css";

export function ToolBackground({ tool }: { tool: "ithaca" | "troy" | "delphi" }) {
  const motionRestricted = useFieldMotionRestricted();
  return <div className="tool-background" aria-hidden="true">
    <FieldBackground key={tool} variant={tool} enabled={!motionRestricted} />
  </div>;
}
