import { Color, DepthTexture, Matrix4, type Camera, type Scene, type WebGLRenderer } from "three";
import { EffectComposer } from "three/addons/postprocessing/EffectComposer.js";
import { RenderPass } from "three/addons/postprocessing/RenderPass.js";
import { OutputPass } from "three/addons/postprocessing/OutputPass.js";

// Reconstruct each visible surface from the depth buffer, so peripheral roads
// and context fade into the ground without blurring their silhouettes. The
// central tower stays fully visible from its foundation to its roof.
const spatialUniforms = `
  uniform sampler2D tDepth;
  uniform mat4 projectionInverse, viewInverse;
  uniform float presence;
  uniform vec3 ground;
  float districtDistance(vec2 uv, float depth) {
    vec4 view = projectionInverse * vec4(uv * 2.0 - 1.0, depth * 2.0 - 1.0, 1.0);
    vec3 world = (viewInverse * (view / view.w)).xyz;
    return max(max((-world.x - 28.0) / 52.0, (-world.z - 17.0) / 48.0),
      max((world.x - 40.0) / 25.0, (world.z - 40.0) / 25.0));
  }`;

export class CityAtmosphere {
  private composer: EffectComposer;
  private scenePass: RenderPass;
  private output = new OutputPass();
  private width = 0;
  private height = 0;
  private ratio = 0;

  constructor(private renderer: WebGLRenderer, scene: Scene, camera: Camera) {
    this.composer = new EffectComposer(renderer);
    this.scenePass = new RenderPass(scene, camera);
    Object.assign(this.output.uniforms, {
      tDepth: { value: null }, projectionInverse: { value: new Matrix4() },
      viewInverse: { value: new Matrix4() }, presence: { value: 1 },
      ground: { value: new Color("#f5f4f0") },
    });
    // Fade after tone mapping and before the sRGB transfer. The native clear
    // colour bypasses tone mapping, so the haze must preserve that colour too.
    this.output.material.fragmentShader = this.output.material.fragmentShader
      .replace("uniform sampler2D tDiffuse;", `uniform sampler2D tDiffuse; ${spatialUniforms}`)
      .replace("// color space", `
        float sceneDepth = texture2D(tDepth, vUv).x;
        float haze = sceneDepth >= 0.99999 ? 1.0
          : smoothstep(0.0, 1.35, districtDistance(vUv, sceneDepth)) * presence;
        gl_FragColor.rgb = mix(gl_FragColor.rgb, ground, haze);
        // color space`);
    for (const target of [this.composer.renderTarget1, this.composer.renderTarget2]) {
      target.depthTexture = new DepthTexture(target.width, target.height);
      // Match the existing antialiased canvas while rendering via a target.
      target.samples = Math.min(4, renderer.capabilities.maxSamples);
    }
    this.composer.addPass(this.scenePass);
    this.composer.addPass(this.output);
  }

  render(camera: Camera, width: number, height: number, presence: number, background: Color) {
    const renderer = this.renderer, ratio = renderer.getPixelRatio();
    if (width !== this.width || height !== this.height || ratio !== this.ratio) {
      this.composer.setPixelRatio(ratio);
      this.composer.setSize(width, height);
      this.width = width; this.height = height; this.ratio = ratio;
    }
    this.output.uniforms.tDepth.value = this.composer.readBuffer.depthTexture;
    this.output.uniforms.projectionInverse.value.copy(camera.projectionMatrixInverse);
    this.output.uniforms.viewInverse.value.copy(camera.matrixWorld);
    this.output.uniforms.presence.value = presence;
    this.output.uniforms.ground.value.copy(background);
    this.scenePass.camera = camera;
    // Keep the existing performance counters meaningful across all passes.
    const autoReset = renderer.info.autoReset;
    renderer.info.autoReset = false; renderer.info.reset();
    try { this.composer.render(0); } finally { renderer.info.autoReset = autoReset; }
  }

  dispose() {
    this.scenePass.dispose(); this.output.dispose(); this.composer.dispose();
  }
}
