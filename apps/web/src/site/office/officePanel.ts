// Screen-space disclosure placement. Keep the panel toward the nearest outer
// edge, away from the central aisle, while respecting header/footer safe areas.
export function officePanelPlacement(x: number, y: number, width: number, height: number, panelHeight: number, panelWidth = 224) {
  const margin = Math.max(24, width * 0.043), gap = 48, anchorHalf = 22;
  // On phones a side panel would cover the neighboring tool markers. Dock
  // below the floor instead, keeping the action and the other desks reachable.
  if (width <= 700 && height > width) return { side: "right", left: (width - panelWidth) / 2 - (x - anchorHalf),
    top: Math.max(124, height - 64 - panelHeight) - (y - anchorHalf), gap: 0 };
  if (width <= 950 && height <= 500 && width > height) return { side: "right", left: width - margin - panelWidth - (x - anchorHalf),
    top: Math.max(88, Math.min(height - 64 - panelHeight, (height - panelHeight) / 2)) - (y - anchorHalf), gap: 0 };
  const roomLeft = x - anchorHalf - margin, roomRight = width - margin - x - anchorHalf;
  const side = roomLeft >= panelWidth + gap && (x < width / 2 || roomRight < panelWidth + gap) ? "left" : "right";
  const desired = side === "left" ? x - anchorHalf - gap - panelWidth : x + anchorHalf + gap;
  const left = Math.max(margin, Math.min(width - margin - panelWidth, desired));
  const top = Math.max(108, Math.min(height - 88 - panelHeight, y - 50));
  return { side, left: left - (x - anchorHalf), top: top - (y - anchorHalf),
    gap: Math.max(0, side === "left" ? x - anchorHalf - left - panelWidth : left - x - anchorHalf) };
}
