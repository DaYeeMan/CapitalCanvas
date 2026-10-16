import { readFile } from "node:fs/promises";
import { createHash } from "node:crypto";
import { describe, expect, it } from "vitest";
import { AnimationMixer, Box3, DoubleSide, Mesh, MeshBasicMaterial, Raycaster, Vector3, type SkinnedMesh } from "three";
import { GLTFLoader } from "three/addons/loaders/GLTFLoader.js";
import manifest from "../../../public/office/people/manifest.json";
import { DESK, FLOORS } from "./layouts";
import { WALKER_DEPTH, WALKER_RADIUS } from "./peoplePaths";
import { characterGeometry } from "./characterAppearance";
import { seatedClips, SEATED_CLIP, WALK_CYCLE_DISTANCE } from "./characterPoses";
import { WALK_SPEED } from "./peopleSimulation";
import { createOfficeSpace, seatedPosition, transform } from "./officeSpatial";
import { furnitureGeometry, roundedBox } from "./sceneResources";

async function load(file: string) {
  const bytes = await readFile(new URL(`../../../public/office/people/${file}`, import.meta.url));
  const gltf = await new GLTFLoader().parseAsync(bytes.buffer.slice(bytes.byteOffset, bytes.byteOffset + bytes.byteLength) as ArrayBuffer, "");
  // Exercise the same normals-only preparation used by the rendered workers.
  gltf.scene.traverse(object => { const mesh = object as SkinnedMesh; if (mesh.isSkinnedMesh) mesh.geometry = characterGeometry(mesh.geometry); });
  return { bytes, ...gltf };
}

describe.each(manifest)("bundled character $file", asset => {
  it("supports raised sofa legs with a clearance buffer across every sofa seat", async () => {
    const { scene, animations } = await load(asset.file), mixer = new AnimationMixer(scene);
    mixer.clipAction(seatedClips(scene, animations, asset.scale).find(clip => clip.name === "SofaRest")!).play();
    const material = new MeshBasicMaterial({ side: DoubleSide });
    const furniture: { mesh: Mesh; bounds: Box3 }[] = [];
    function obstacle(mesh: Mesh) {
      mesh.updateMatrixWorld(true); if (!mesh.geometry.boundingBox) mesh.geometry.computeBoundingBox();
      furniture.push({ mesh, bounds: mesh.geometry.boundingBox!.clone().applyMatrix4(mesh.matrixWorld) });
    }
    obstacle(new Mesh(furnitureGeometry.sofaCushions, material));
    const base = new Mesh(roundedBox([3.2, 0.45, 1.04]), material); base.position.y = 0.3; obstacle(base);
    for (const side of [-1, 1]) {
      const arm = new Mesh(roundedBox([0.25, 0.55, 1.1]), material); arm.position.set(side * 1.5, 0.65, 0); obstacle(arm);
    }
    const pillow = new Mesh(roundedBox([0.48, 0.45, 0.2]), material); pillow.position.set(0.9, 0.87, -0.21); pillow.rotation.set(0.12, 0.1, -0.1); obstacle(pillow);
    const ray = new Raycaster(), direction = new Vector3(0.811, 0.239, 0.533).normalize(), vertex = new Vector3();
    const inside = (point: Vector3, { mesh, bounds }: { mesh: Mesh; bounds: Box3 }) => {
      if (!bounds.containsPoint(point)) return false;
      ray.set(point, direction); ray.near = 0; ray.far = Infinity;
      const distances = ray.intersectObject(mesh, false).map(hit => hit.distance).filter((distance, i, all) => !i || distance - all[i - 1] > 1e-5);
      return distances.length % 2 === 1 && distances[0] > 1e-6;
    };
    let backTwoCentimetresClips = false;
    const clearance = new Map<string, boolean>(); let previousPose = "";
    for (const time of [0, 0.5, 0.99]) {
      mixer.setTime(time); scene.updateMatrixWorld(true);
      scene.traverse(object => { if ((object as SkinnedMesh).isSkinnedMesh) (object as SkinnedMesh).skeleton.update(); });
      for (const side of ["L", "R"]) {
        const hip = scene.getObjectByName(`UpperLeg${side}`)!.getWorldPosition(new Vector3()).multiplyScalar(asset.scale);
        const knee = scene.getObjectByName(`LowerLeg${side}`)!.getWorldPosition(new Vector3()).multiplyScalar(asset.scale);
        const ankle = scene.getObjectByName(`LowerLeg${side}_end`)!.getWorldPosition(new Vector3()).multiplyScalar(asset.scale);
        expect(knee.y).toBeCloseTo(hip.y, 4);
        expect(ankle.z).toBeCloseTo(knee.z, 4);
        expect(ankle.y).toBeGreaterThan(0.2);
      }
      const samples = new Map<string, Vector3>(), edges: [Vector3, Vector3][] = [];
      function sample(point: Vector3) {
        if (point.y < 1.25) samples.set(point.toArray().map(value => value.toFixed(6)).join(","), point.clone());
      }
      scene.traverse(object => {
        const mesh = object as SkinnedMesh; if (!mesh.isSkinnedMesh) return;
        const vertices: Vector3[] = [];
        for (let i = 0; i < mesh.geometry.getAttribute("position").count; i++) {
          mesh.getVertexPosition(i, vertex).applyMatrix4(mesh.matrixWorld).multiplyScalar(asset.scale); vertex.y += 0.03;
          vertices.push(vertex.clone()); sample(vertex);
        }
        const index = mesh.geometry.index;
        for (let i = 0; i < (index?.count ?? vertices.length); i += 3) {
          const [a, b, c] = [0, 1, 2].map(offset => vertices[index ? index.getX(i + offset) : i + offset]);
          for (const [start, end] of [[a, b], [b, c], [c, a]]) {
            sample(start.clone().add(end).multiplyScalar(0.5));
            if (Math.min(start.y, end.y) < 1.25 && start.distanceTo(end) > 1e-6) edges.push([start, end]);
          }
          sample(a.clone().add(b).add(c).multiplyScalar(1 / 3));
        }
      });
      expect(samples.size).toBeGreaterThan(100);
      expect(Math.min(...[...samples.values()].map(point => point.y))).toBeGreaterThan(0.15);
      // Reuse identical local sofa/pose checks across translated/rotated floors.
      const pose = [...samples.keys()].join("|");
      if (pose !== previousPose) { clearance.clear(); previousPose = pose; }
      function intersectsFurniture(offset: Vector3) {
        for (const point of samples.values()) if (furniture.some(mesh => inside(point.clone().add(offset), mesh))) return true;
        for (const [a, b] of edges) {
          const start = a.clone().add(offset), end = b.clone().add(offset), bounds = new Box3().setFromPoints([start, end]);
          const delta = end.clone().sub(start), length = delta.length();
          ray.set(start, delta.normalize()); ray.near = 1e-6; ray.far = length - 1e-6;
          for (const obstacle of furniture) if (obstacle.bounds.intersectsBox(bounds) && ray.intersectObject(obstacle.mesh, false).length) return true;
        }
        return false;
      }
      function penetrates(offset: Vector3) {
        const key = offset.toArray().map(value => value.toFixed(6)).join(",");
        const cached = clearance.get(key); if (cached !== undefined) return cached;
        const result = intersectsFurniture(offset); clearance.set(key, result); return result;
      }
      for (const floor of ["home", "resources"] as const) for (const seat of createOfficeSpace(floor).seats.filter(seat => seat.kind === "sofa")) {
        const fixture = FLOORS[floor].fixtures.find(fixture => fixture.kind === "lounge" && seat.id.startsWith(`${fixture.id}-`))!;
        const at = seatedPosition(seat, asset.file === "office-man.glb" ? "man" : "woman");
        const local = transform([0, 0], [at[0] - fixture.at[0], at[1] - fixture.at[1]], -(fixture.rotation ?? 0));
        const offset = new Vector3(local[0], 0, local[1] + 0.4);
        expect(penetrates(offset), `${floor}/${seat.id} at ${time}s`).toBe(false);
        expect(penetrates(offset.clone().add(new Vector3(0, 0, -0.01))), `${floor}/${seat.id} clearance buffer`).toBe(false);
        backTwoCentimetresClips ||= penetrates(offset.clone().add(new Vector3(0, 0, -0.02)));
      }
    }
    expect(backTwoCentimetresClips).toBe(true);
    material.dispose(); mixer.stopAllAction(); mixer.uncacheRoot(scene);
  }, 30000);
  it("matches ground speed to the grounded feet of each rig's walking cycle", async () => {
    const { scene, animations } = await load(asset.file), mixer = new AnimationMixer(scene);
    const walk = animations.find(clip => clip.name === "Walk")!;
    const rate = WALK_SPEED * walk.duration / WALK_CYCLE_DISTANCE;
    mixer.clipAction(walk).play().setEffectiveTimeScale(rate);
    const samples: Vector3[][] = [], dt = 0.02;
    for (let time = 0; time < walk.duration / rate; time += dt) {
      mixer.setTime(time); scene.updateMatrixWorld(true);
      samples.push(["L", "R"].map(side => scene.getObjectByName(`Foot${side}`)!.getWorldPosition(new Vector3()).multiplyScalar(asset.scale)));
    }
    for (const side of [0, 1]) {
      const ground = Math.min(...samples.map(sample => sample[side].y));
      const speeds: number[] = [];
      for (let i = 1; i < samples.length; i++) {
        const a = samples[i - 1][side], b = samples[i][side];
        if (Math.max(a.y, b.y) < ground + 0.04 && b.z < a.z) speeds.push((a.z - b.z) / dt);
      }
      expect(speeds.length).toBeGreaterThan(20);
      const stanceSpeed = speeds.reduce((sum, speed) => sum + speed, 0) / speeds.length;
      expect(Math.abs(stanceSpeed - WALK_SPEED)).toBeLessThan(WALK_SPEED * 0.08);
    }
    mixer.stopAllAction(); mixer.uncacheRoot(scene);
  });
  it("fits every resting seat height and keeps simple typing above the keyboard", async () => {
    const { scene, animations } = await load(asset.file);
    const clips = seatedClips(scene, animations, asset.scale), mixer = new AnimationMixer(scene);
    for (const [kind, height] of [["conference", 0.59], ["armchair", 0.67], ["sofa", 0.69], ["stool", 0.76]] as const) {
      mixer.stopAllAction(); mixer.clipAction(clips.find(clip => clip.name === SEATED_CLIP[kind])!).reset().play(); mixer.setTime(0);
      scene.updateMatrixWorld(true); scene.traverse(object => { if ((object as SkinnedMesh).isSkinnedMesh) (object as SkinnedMesh).skeleton.update(); });
      expect(scene.getObjectByName("UpperLegL")!.getWorldPosition(new Vector3()).y * asset.scale).toBeCloseTo(height + (kind === "sofa" ? 0.11 : 0.06), 2);
      expect(new Box3().setFromObject(scene, true).min.y * asset.scale + 0.03, kind).toBeGreaterThanOrEqual(0);
      for (const side of ["L", "R"]) expect(scene.getObjectByName(`Wrist${side}`)!.getWorldPosition(new Vector3()).z * asset.scale).toBeLessThan(kind === "conference" ? 0.5 : 0.35);
    }
    mixer.stopAllAction(); mixer.clipAction(clips.find(clip => clip.name === "DeskTyping")!).reset().play();
    const heights: number[] = [];
    for (let t = 0; t <= 1; t += 0.05) {
      mixer.setTime(t); scene.updateMatrixWorld(true);
      const wrist = scene.getObjectByName("WristL")!.getWorldPosition(new Vector3()).multiplyScalar(asset.scale);
      heights.push(wrist.y); expect(wrist.y + 0.03).toBeGreaterThan(DESK.height + DESK.top / 2); expect(wrist.y + 0.03).toBeLessThan(1);
    }
    expect(Math.max(...heights) - Math.min(...heights)).toBeGreaterThan(0.005);
    expect(Math.max(...heights) - Math.min(...heights)).toBeLessThan(0.04);
    mixer.stopAllAction(); mixer.uncacheRoot(scene);
  });
  it("bounds shortened gait skins for safe turns and seat approaches", async () => {
    const { scene, animations } = await load(asset.file), mixer = new AnimationMixer(scene);
    const idle = mixer.clipAction(animations.find(clip => clip.name === "Idle")!).play(), walk = mixer.clipAction(animations.find(clip => clip.name === "Walk")!).play();
    for (const stride of [0, 0.25, 0.5, 0.75, 1]) {
      idle.setEffectiveWeight(1 - stride); walk.setEffectiveWeight(stride);
      for (let t = 0; t < 1.34; t += 0.1) {
        mixer.setTime(t); scene.updateMatrixWorld(true); scene.traverse(object => { if ((object as SkinnedMesh).isSkinnedMesh) (object as SkinnedMesh).skeleton.update(); });
        const bounds = new Box3().setFromObject(scene, true);
        expect(Math.max(Math.abs(bounds.min.x), Math.abs(bounds.max.x)) * asset.scale).toBeLessThanOrEqual(WALKER_RADIUS);
        expect(Math.max(Math.abs(bounds.min.z), Math.abs(bounds.max.z)) * asset.scale).toBeLessThanOrEqual(WALKER_RADIUS + (WALKER_DEPTH / 2 - WALKER_RADIUS) * stride);
        if (Math.abs(t - 0.3) < 0.01 || Math.abs(t - 0.9) < 0.01) {
          let radial = 0;
          const vertex = new Vector3(), reach = (WALKER_DEPTH / 2 - WALKER_RADIUS) * stride;
          scene.traverse(object => {
            const mesh = object as SkinnedMesh; if (!mesh.isSkinnedMesh) return;
            for (let i = 0; i < mesh.geometry.getAttribute("position").count; i++) {
              mesh.getVertexPosition(i, vertex).applyMatrix4(mesh.matrixWorld).multiplyScalar(asset.scale);
              radial = Math.max(radial, Math.hypot(vertex.x, Math.max(0, Math.abs(vertex.z) - reach)));
            }
          });
          expect(radial, `stride ${stride}, time ${t}`).toBeLessThanOrEqual(WALKER_RADIUS);
        }
      }
    }
    mixer.stopAllAction(); mixer.uncacheRoot(scene);
  });
  it("smooths surfaces once without changing source geometry or skin attributes", async () => {
    const bytes = await readFile(new URL(`../../../public/office/people/${asset.file}`, import.meta.url));
    const { scene } = await new GLTFLoader().parseAsync(bytes.buffer.slice(bytes.byteOffset, bytes.byteOffset + bytes.byteLength) as ArrayBuffer, "");
    let changed = 0;
    scene.traverse(object => {
      const mesh = object as SkinnedMesh;
      if (!mesh.isSkinnedMesh) return;
      const source = mesh.geometry, originalNormals = source.getAttribute("normal").clone();
      const expanded = source.index ? source.toNonIndexed() : source;
      const result = characterGeometry(source);
      expect(result).not.toBe(source);
      expect(characterGeometry(source)).toBe(result);
      expect(characterGeometry(result)).toBe(result);
      expect(source.getAttribute("normal").array).toEqual(originalNormals.array);
      for (const name of Object.keys(expanded.attributes).filter(name => name !== "normal")) expect(result.getAttribute(name).array).toEqual(expanded.getAttribute(name).array);
      const normals = result.getAttribute("normal"), before = expanded.getAttribute("normal");
      for (let i = 0; i < normals.count; i++) {
        const normal = new Vector3().fromBufferAttribute(normals, i);
        expect(Number.isFinite(normal.length())).toBe(true);
        if (normal.distanceTo(new Vector3().fromBufferAttribute(before, i)) > 0.05) changed++;
      }
      if (expanded !== source) expanded.dispose();
    });
    expect(changed).toBeGreaterThan(100);
  });

  it("matches its shipped hash, retains the rig and provides seamless required clips", async () => {
    const { bytes, scene, animations } = await load(asset.file);
    expect(createHash("sha256").update(bytes).digest("hex")).toBe(asset.sha256);
    expect(bytes.length).toBe(asset.bytes);
    let bones = 0;
    scene.traverse(object => { if (object.type === "Bone") bones++; });
    expect(bones).toBe(62);
    expect(animations.map(clip => clip.name)).toEqual(["Idle", "Walk", "DeskIdle"]);
    for (const clip of animations) for (const track of clip.tracks) {
      const size = track.getValueSize();
      for (let i = 0; i < size; i++) expect(track.values[i]).toBeCloseTo(track.values[track.values.length - size + i], 5);
    }
  });

  it("seats hips above the cushion, hands at the keyboard and soles above the floor across the loop", async () => {
    const { scene, animations } = await load(asset.file);
    const mixer = new AnimationMixer(scene);
    mixer.clipAction(animations.find(clip => clip.name === "DeskIdle")!).play();
    const point = new Vector3();
    const joint = (name: string) => scene.getObjectByName(name)!.getWorldPosition(point).multiplyScalar(asset.scale).clone();
    for (let t = 0; t <= 4; t += 0.25) {
      mixer.setTime(t); scene.updateMatrixWorld(true);
      scene.traverse(object => { if ((object as SkinnedMesh).isSkinnedMesh) (object as SkinnedMesh).skeleton.update(); });
      for (const side of ["L", "R"]) {
        expect(joint(`UpperLeg${side}`).y).toBeCloseTo(DESK.seatTop + 0.06, 2);
        for (const hand of [`Wrist${side}`, `Middle4${side}`]) {
          const position = joint(hand);
          expect(position.y + 0.03).toBeGreaterThan(DESK.height + DESK.top / 2 + 0.015);
          expect(position.y + 0.03).toBeLessThan(DESK.height + DESK.top / 2 + 0.09);
          const deskZ = DESK.chairOffset - position.z;
          expect(deskZ).toBeGreaterThan(-DESK.depth / 2);
          expect(deskZ).toBeLessThan(DESK.depth / 2);
        }
      }
      const bounds = new Box3().setFromObject(scene, true);
      expect(bounds.min.y * asset.scale + 0.03).toBeGreaterThanOrEqual(0);
    }
    mixer.stopAllAction(); mixer.uncacheRoot(scene);
  });

  it("keeps the fuller walking mesh inside the route envelope and above the floor", async () => {
    const { scene, animations } = await load(asset.file);
    const clip = animations.find(clip => clip.name === "Walk")!;
    const mixer = new AnimationMixer(scene);
    mixer.clipAction(clip).play();
    for (let t = 0; t <= clip.duration; t += 0.05) {
      mixer.setTime(t); scene.updateMatrixWorld(true);
      scene.traverse(object => { if ((object as SkinnedMesh).isSkinnedMesh) (object as SkinnedMesh).skeleton.update(); });
      const bounds = new Box3().setFromObject(scene, true);
      expect(Math.max(Math.abs(bounds.min.x), Math.abs(bounds.max.x)) * asset.scale).toBeLessThan(WALKER_RADIUS);
      expect(Math.max(Math.abs(bounds.min.z), Math.abs(bounds.max.z)) * asset.scale).toBeLessThan(WALKER_DEPTH / 2);
      expect(bounds.min.y * asset.scale + 0.03).toBeGreaterThanOrEqual(0);
    }
    mixer.stopAllAction(); mixer.uncacheRoot(scene);
  });
});
