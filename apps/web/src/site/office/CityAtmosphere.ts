import { Color, DepthTexture, Matrix4, Vector2, type Camera, type Scene, type WebGLRenderer } from "three";
import { EffectComposer } from "three/addons/postprocessing/EffectComposer.js";
import { RenderPass } from "three/addons/postprocessing/RenderPass.js";
import { OutputPass } from "three/addons/postprocessing/OutputPass.js";
import { UnrealBloomPass } from "three/addons/postprocessing/UnrealBloomPass.js";
import { updateExteriorLightView } from "./officeLightIsolation";
import { TOWER_SITE } from "./towerStructure";

// Reconstruct each visible surface from the depth buffer, so peripheral roads
// and context recede softly while the central tower stays sharp. The blur
// rejects foreground samples, so the cutaway never bleeds into the city.
const spatialUniforms = `
  uniform sampler2D tDepth;
  uniform mat4 projectionInverse, viewInverse;
  uniform float presence, focusY, landing, about;
  uniform vec3 ground, cityShadow, cityGlow;
  uniform vec2 texel, towerOrigin;
  vec3 worldPosition(vec2 uv, float depth) {
    vec4 view = projectionInverse * vec4(uv * 2.0 - 1.0, depth * 2.0 - 1.0, 1.0);
    vec3 world = (viewInverse * (view / view.w)).xyz;
    return world.xyz;
  }
  float districtDistance(vec3 world) {
    return max(max((-world.x - 28.0) / 52.0, (-world.z - 17.0) / 48.0),
      max((world.x - 40.0) / 25.0, (world.z - 40.0) / 25.0));
  }
  float outsideTower(vec3 world) {
    vec2 relative = world.xz - towerOrigin;
    return smoothstep(14.0, 20.0, max(abs(relative.x), abs(relative.y)));
  }
  vec4 citySample(vec2 uv, vec4 center) {
    float depth = texture2D(tDepth, uv).x;
    float outside = outsideTower(worldPosition(uv, depth));
    return mix(center, texture2D(tDiffuse, uv), outside);
  }`;

export class CityAtmosphere {
  private composer: EffectComposer;
  private scenePass: RenderPass;
  private output = new OutputPass();
  // High threshold confines the halo to emitters and bright occupied windows.
  private bloom = new UnrealBloomPass(new Vector2(1, 1), 0.12, 0.4, 1.25);
  private width = 0;
  private height = 0;
  private ratio = 0;

  constructor(private renderer: WebGLRenderer, scene: Scene, camera: Camera) {
    this.composer = new EffectComposer(renderer);
    this.scenePass = new RenderPass(scene, camera);
    Object.assign(this.output.uniforms, {
      tDepth: { value: null }, projectionInverse: { value: new Matrix4() },
      viewInverse: { value: new Matrix4() }, presence: { value: 1 }, focusY: { value: 0 },
      ground: { value: new Color("#202a2d") },
      cityShadow: { value: new Color("#101c26") }, cityGlow: { value: new Color("#3a4a57") },
      landing: { value: 0 },
      about: { value: 0 },
      texel: { value: new Vector2() },
      towerOrigin: { value: new Vector2(TOWER_SITE.x, TOWER_SITE.z) },
    });
    // Fade after tone mapping and before the sRGB transfer. The native clear
    // colour bypasses tone mapping, so the haze must preserve that colour too.
    this.output.material.fragmentShader = this.output.material.fragmentShader
      .replace("uniform sampler2D tDiffuse;", `uniform sampler2D tDiffuse; ${spatialUniforms}`)
      .replace("gl_FragColor = texture2D( tDiffuse, vUv );", `
        vec4 center = texture2D(tDiffuse, vUv);
        float surfaceDepth = texture2D(tDepth, vUv).x;
        vec3 surfaceWorld = worldPosition(vUv, surfaceDepth);
        float softness = outsideTower(surfaceWorld) * (1.0 - presence);
        gl_FragColor = center;
        if (surfaceDepth < 0.99999 && softness < 0.99) {
          vec2 dx = vec2(texel.x, 0.0), dy = vec2(0.0, texel.y);
          vec3 tangentX = worldPosition(vUv + dx, texture2D(tDepth, vUv + dx).x) - surfaceWorld;
          vec3 tangentY = worldPosition(vUv + dy, texture2D(tDepth, vUv + dy).x) - surfaceWorld;
          vec3 normal = normalize(cross(tangentX, tangentY));
          if (dot(normal, viewInverse[3].xyz - surfaceWorld) < 0.0) normal = -normal;
          float contact = 0.0;
          for (int i = 0; i < 8; i++) {
            float angle = float(i) * 2.399963;
            vec2 uv = vUv + vec2(cos(angle), sin(angle)) * texel * (4.0 + float(i) * 1.4);
            float depth = texture2D(tDepth, uv).x;
            vec3 delta = worldPosition(uv, depth) - surfaceWorld;
            float distance = length(delta);
            if (depth < 0.99999 && distance > 0.035 && distance < 1.0) {
              contact += max(0.0, dot(normal, delta / distance) - 0.12)
                * (1.0 - smoothstep(0.05, 1.0, distance));
            }
          }
          gl_FragColor.rgb *= 1.0 - min(0.28, contact * 0.18);
        }
        if (softness > 0.001) {
        vec2 spread = texel * 3.0 * softness;
        vec4 softened = center * 4.0;
        softened += citySample(vUv + vec2(spread.x, 0.0), center) * 2.0;
        softened += citySample(vUv - vec2(spread.x, 0.0), center) * 2.0;
        softened += citySample(vUv + vec2(0.0, spread.y), center) * 2.0;
        softened += citySample(vUv - vec2(0.0, spread.y), center) * 2.0;
        softened += citySample(vUv + spread, center);
        softened += citySample(vUv - spread, center);
        softened += citySample(vUv + vec2(spread.x, -spread.y), center);
        softened += citySample(vUv + vec2(-spread.x, spread.y), center);
        gl_FragColor = mix(center, softened / 16.0, softness);
        }`)
      .replace("// color space", `
        float sceneDepth = texture2D(tDepth, vUv).x;
        vec3 world = worldPosition(vUv, sceneDepth);
        float edgeHaze = smoothstep(0.0, 1.35, districtDistance(world));
        vec2 relativeToTower = world.xz - towerOrigin;
        float awayFromTower = smoothstep(14.5, 25.0, max(abs(relativeToTower.x), abs(relativeToTower.y)));
        float aerialHaze = awayFromTower * (1.0 - presence)
          * (0.32 + 0.22 * smoothstep(4.0, 55.0, focusY - world.y));
        float haze = sceneDepth >= 0.99999 ? 1.0 : max(edgeHaze, aerialHaze);
        vec3 atmosphere = ground * mix(1.06, 0.78, smoothstep(0.0, 1.0, vUv.y));
        // One continuous field supplies the landing background and the colour
        // that distant geometry fades into. Office/inspection keep their grade.
        float landingWeight = smoothstep(0.0, 1.0, landing);
        vec2 cityOffset = (vUv - vec2(0.73, 0.43)) / vec2(0.52, 0.65);
        float cityField = exp(-2.0 * dot(cityOffset, cityOffset))
          * smoothstep(0.17, 0.60, vUv.x);
        vec3 landingAtmosphere = mix(cityShadow, cityGlow, cityField);
        atmosphere = mix(atmosphere, landingAtmosphere, landingWeight);
        // Lift the city midtones locally without washing out deep glazing or
        // warming/cooling the bright window and fixture emission.
        float luminance = dot(gl_FragColor.rgb, vec3(0.2126, 0.7152, 0.0722));
        float midtones = smoothstep(0.002, 0.04, luminance)
          * (1.0 - smoothstep(0.22, 0.65, luminance));
        float localGrade = landingWeight * cityField;
        gl_FragColor.rgb = mix(gl_FragColor.rgb, vec3(luminance), localGrade * midtones * 0.22);
        gl_FragColor.rgb += vec3(0.024, 0.026, 0.027) * localGrade * midtones;
        float copyShade = 1.0 - smoothstep(0.16, 0.48, vUv.x);
        gl_FragColor.rgb *= 1.0 - landingWeight * copyShade * 0.38;
        gl_FragColor.rgb = mix(gl_FragColor.rgb, atmosphere, haze);
        // About only extends the reading shade. The right-hand city, camera,
        // physical lights and the existing background/distance field stay put.
        float aboutShade = about * (1.0 - smoothstep(0.46, 0.62, vUv.x));
        gl_FragColor.rgb = mix(gl_FragColor.rgb, cityShadow, aboutShade * 0.72);
        // color space`);
    for (const target of [this.composer.renderTarget1, this.composer.renderTarget2]) {
      target.depthTexture = new DepthTexture(target.width, target.height);
      // Match the existing antialiased canvas while rendering via a target.
      target.samples = Math.min(4, renderer.capabilities.maxSamples);
    }
    this.composer.addPass(this.scenePass);
    this.composer.addPass(this.bloom);
    this.composer.addPass(this.output);
  }

  prepare(camera: Camera) {
    // Surface programs must be compiled for the composer's linear render target,
    // rather than the canvas's tone-mapped output variant.
    const target = this.renderer.getRenderTarget();
    this.renderer.setRenderTarget(this.composer.readBuffer);
    try { return this.renderer.compileAsync(this.scenePass.scene, camera); }
    finally { this.renderer.setRenderTarget(target); }
  }

  render(camera: Camera, width: number, height: number, presence: number, background: Color, focusY = 0, landing = 0, about = 0) {
    updateExteriorLightView(camera);
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
    this.output.uniforms.landing.value = landing;
    this.output.uniforms.about.value = about;
    this.output.uniforms.focusY.value = focusY;
    this.output.uniforms.ground.value.copy(background);
    this.output.uniforms.texel.value.set(1 / width, 1 / height);
    this.scenePass.camera = camera;
    // Keep the existing performance counters meaningful across all passes.
    const autoReset = renderer.info.autoReset;
    renderer.info.autoReset = false; renderer.info.reset();
    try { this.composer.render(0); } finally { renderer.info.autoReset = autoReset; }
  }

  dispose() {
    this.scenePass.dispose(); this.bloom.dispose();
    // The installed Three pass leaves its high-pass filter out of dispose().
    this.bloom.materialHighPassFilter.dispose();
    this.output.dispose(); this.composer.dispose();
  }
}
