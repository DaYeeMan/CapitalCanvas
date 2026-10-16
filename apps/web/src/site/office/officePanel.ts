// Screen-space disclosure placement. Keep the panel toward the nearest outer
// edge, away from the central aisle, while respecting header/footer safe areas.
export function officePanelPlacement(x: number, y: number, width: number, height: number, panelHeight: number, panelWidth = 224) {
  const margin = Math.max(24, width * 0.043), gap = 48, anchorHalf = 22;
  const roomLeft = x - anchorHalf - margin, roomRight = width - margin - x - anchorHalf;
  const side = roomLeft >= panelWidth + gap && (x < width / 2 || roomRight < panelWidth + gap) ? "left" : "right";
  const desired = side === "left" ? x - anchorHalf - gap - panelWidth : x + anchorHalf + gap;
  const left = Math.max(margin, Math.min(width - margin - panelWidth, desired));
  const top = Math.max(108, Math.min(height - 88 - panelHeight, y - 50));
  return { side, left: left - (x - anchorHalf), top: top - (y - anchorHalf),
    gap: Math.max(0, side === "left" ? x - anchorHalf - left - panelWidth : left - x - anchorHalf) };
}
