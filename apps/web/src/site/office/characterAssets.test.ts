import { readFile } from "node:fs/promises";
import { createHash } from "node:crypto";
import { describe, expect, it } from "vitest";
import { AnimationMixer, Box3, Vector3, type SkinnedMesh } from "three";
import { GLTFLoader } from "three/addons/loaders/GLTFLoader.js";
import manifest from "../../../public/office/people/manifest.json";
import { DESK } from "./layouts";
import { WALKER_DEPTH, WALKER_RADIUS } from "./peoplePaths";

async function load(file: string) {
  const bytes = await readFile(new URL(`../../../public/office/people/${file}`, import.meta.url));
  const gltf = await new GLTFLoader().parseAsync(bytes.buffer.slice(bytes.byteOffset, bytes.byteOffset + bytes.byteLength) as ArrayBuffer, "");
  return { bytes, ...gltf };
}

describe.each(manifest)("bundled character $file", asset => {
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
