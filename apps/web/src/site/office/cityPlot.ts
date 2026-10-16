import { ExtrudeGeometry, Shape } from "three";
import { DISTRICT_BUILDINGS, TOWER_PLOT, TOWER_SIDEWALK } from "./towerStructure";

// Shape coordinates use -z so extrusion rotated onto the ground faces upward.
export function roundedPlotOutline(width: number, depth: number, x = 0, z = 0) {
  const shape = new Shape(), rx = width * 0.07, rz = depth * 0.07;
  const left = x - width / 2, right = x + width / 2;
  const bottom = -z - depth / 2, top = -z + depth / 2;
  shape.moveTo(left + rx, bottom);
  shape.lineTo(right - rx, bottom);
  shape.quadraticCurveTo(right, bottom, right, bottom + rz);
  shape.lineTo(right, top - rz);
  shape.quadraticCurveTo(right, top, right - rx, top);
  shape.lineTo(left + rx, top);
  shape.quadraticCurveTo(left, top, left, top - rz);
  shape.lineTo(left, bottom + rz);
  shape.quadraticCurveTo(left, bottom, left + rx, bottom);
  return shape;
}

export function towerSidewalkGeometry() {
  const { x, z, width, depth } = TOWER_SIDEWALK;
  const shape = new Shape();
  shape.moveTo(x - width / 2, -z - depth / 2);
  shape.lineTo(x + width / 2, -z - depth / 2);
  shape.lineTo(x + width / 2, -z + depth / 2);
  shape.lineTo(x - width / 2, -z + depth / 2);
  shape.closePath();
  // The curved hole matches the curb exactly, including its trimmed rear.
  shape.holes.push(roundedPlotOutline(TOWER_PLOT.width, TOWER_PLOT.depth, TOWER_PLOT.x, TOWER_PLOT.z));
  // Continue up to the neighbour's rounded edge instead of leaving its two
  // rectangular corner cutouts exposed beside the connecting sidewalk.
  const neighbour = DISTRICT_BUILDINGS[0];
  const w = neighbour.width + 5, d = neighbour.depth + 5;
  const right = neighbour.x + w / 2, rx = w * 0.07, rz = d * 0.07;
  const corners = [-1, 1].map(side => {
    const edge = -neighbour.z - side * d / 2, corner = new Shape();
    corner.moveTo(right, edge);
    corner.lineTo(right - rx, edge);
    corner.quadraticCurveTo(right, edge, right, edge + side * rz);
    corner.closePath();
    return corner;
  });
  const mesh = new ExtrudeGeometry([shape, ...corners], { depth: 0.16, bevelEnabled: false, curveSegments: 5 });
  mesh.rotateX(-Math.PI / 2); mesh.translate(0, 0.04, 0);
  return mesh;
}
