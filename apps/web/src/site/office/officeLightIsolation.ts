import { ShaderChunk, Vector4, type Camera, type MeshStandardMaterial } from "three";
import { GROUND_Y, TOWER } from "./towerStructure";

// Street bulbs sit 3.1m above ground; the lowest office is six storeys up.
// This empty height band distinguishes the two existing point-light families
// throughout every tower pose, without changing the shared environment light.
const officeLightHeight = GROUND_Y + TOWER.pitch * 2;
const viewToWorldY = { value: new Vector4(0, 1, 0, 0) };

export function updateExteriorLightView(camera: Camera) {
  const e = camera.matrixWorld.elements;
  viewToWorldY.value.set(e[1], e[5], e[9], e[13]);
}

export function isolateExteriorLighting(material: MeshStandardMaterial) {
  material.onBeforeCompile = shader => {
    shader.uniforms.officeViewToWorldY = viewToWorldY;
    shader.fragmentShader = "uniform vec4 officeViewToWorldY;\n" + shader.fragmentShader;
    const lights = ShaderChunk.lights_fragment_begin.replace(
      "getPointLightInfo( pointLight, geometryPosition, directLight );",
      `getPointLightInfo( pointLight, geometryPosition, directLight );
       directLight.color *= 1.0 - step(${officeLightHeight.toFixed(4)},
         dot(officeViewToWorldY, vec4(pointLight.position, 1.0)));`,
    );
    shader.fragmentShader = shader.fragmentShader.replace("#include <lights_fragment_begin>", lights);
  };
  material.customProgramCacheKey = () => "office-exterior-lighting-v1";
  return material;
}
