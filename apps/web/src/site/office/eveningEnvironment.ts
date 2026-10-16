import { DataTexture, EquirectangularReflectionMapping, LinearFilter, RGBAFormat, SRGBColorSpace } from "three";

// Project-authored dusk sky, shared by glazing and metal finishes. PMREM in
// Three filters this environment for each material's roughness; no HDR download.
const width = 128, height = 64, pixels = new Uint8Array(width * height * 4);
for (let y = 0; y < height; y++) for (let x = 0; x < width; x++) {
  const elevation = y / (height - 1), azimuth = x / width;
  const horizon = Math.exp(-(((elevation - 0.5) / 0.21) ** 2));
  const sky = Math.max(0, (elevation - 0.5) * 2);
  const softSky = Math.exp(-(((azimuth - 0.2) / 0.18) ** 2) - ((elevation - 0.7) / 0.23) ** 2);
  const i = (y * width + x) * 4;
  pixels[i] = Math.round(22 + horizon * 29 + sky * 16 + softSky * 65);
  pixels[i + 1] = Math.round(29 + horizon * 35 + sky * 23 + softSky * 70);
  pixels[i + 2] = Math.round(39 + horizon * 45 + sky * 35 + softSky * 76);
  pixels[i + 3] = 255;
}
export const eveningEnvironment = new DataTexture(pixels, width, height, RGBAFormat);
eveningEnvironment.mapping = EquirectangularReflectionMapping;
eveningEnvironment.colorSpace = SRGBColorSpace;
eveningEnvironment.magFilter = eveningEnvironment.minFilter = LinearFilter;
eveningEnvironment.needsUpdate = true;
