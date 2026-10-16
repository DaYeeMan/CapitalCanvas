type Vector = number[];
type Camera = { model: Vector; view: Vector; projection: Vector };
type DrawText = (axis: number, size: number, angle: number, offset: Vector, color: Vector, direction: Vector, alignDirection: Vector, align: Vector) => void;

export type SurfaceScene = {
  axesOptions: { tickPad: Vector; labelPad: Vector };
  glplot: {
    canvas: HTMLCanvasElement;
    cameraParams: Camera;
    axes: {
      bounds: Vector[];
      lastCubeProps: { cubeEdges: Vector };
      _text: { drawTicks: DrawText; drawLabel: DrawText };
    };
    redraw: () => void;
  };
};

function transform(matrix: Vector, point: Vector): Vector {
  return [0, 1, 2, 3].map(row => point.reduce((sum, value, column) => sum + matrix[column * 4 + row] * value, 0));
}

// Plotly 2.35.3 exposes no screen-side positioning for 3D labels. Keep its
// native text and ticks, but offset Price text along camera-right, not a world
// axis that can project below the origin after an orbit. Model is diagonal and
// view is a rigid camera transform in the pinned gl-plot3d renderer.
export function spaceSurfaceAxisLabels(scene: SurfaceScene): () => void {
  const plot = scene.glplot;
  const axes = plot.axes;
  const text = axes._text;
  const drawTicks = text.drawTicks;
  const drawLabel = text.drawLabel;
  scene.axesOptions.tickPad = [28, 28, 18];
  scene.axesOptions.labelPad = [84, 84, 30];

  function leftOfPriceAxis(offset: Vector, pixels: number): Vector {
    const { model, view, projection } = plot.cameraParams;
    const edge = axes.lastCubeProps.cubeEdges[2];
    const anchor = [axes.bounds[(edge & 1) ? 1 : 0][0], axes.bounds[(edge & 2) ? 1 : 0][1], offset[2]];
    const midpoint = [...anchor];
    midpoint[2] = (axes.bounds[0][2] + axes.bounds[1][2]) / 2;
    const clip = transform(projection, transform(view, transform(model, [...midpoint, 1])));
    const cameraOffset = -2 * pixels * clip[3] / (plot.canvas.clientWidth * projection[0]);
    return anchor.map((value, index) => value + cameraOffset * view[index * 4] / model[index * 5]);
  }

  text.drawTicks = function (axis, size, angle, offset, color, direction, alignDirection, align) {
    if (axis === 2) {
      drawTicks.call(this, axis, size, 0, leftOfPriceAxis(offset, 26), color, direction, alignDirection, [-1, 0.5, 1]);
    } else {
      drawTicks.call(this, axis, size, angle, offset, color, direction, alignDirection, align);
    }
  };
  text.drawLabel = function (axis, size, angle, offset, color, direction, alignDirection, align) {
    if (axis === 2) {
      drawLabel.call(this, axis, size, Math.PI / 2, leftOfPriceAxis(offset, 60), color, direction, alignDirection, [-1, 0.5, 1]);
    } else {
      drawLabel.call(this, axis, size, angle, offset, color, direction, alignDirection, align);
    }
  };
  plot.redraw();
  return () => {
    text.drawTicks = drawTicks;
    text.drawLabel = drawLabel;
  };
}
