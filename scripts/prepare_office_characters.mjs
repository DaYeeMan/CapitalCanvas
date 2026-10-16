// node scripts/prepare_office_characters.mjs <downloaded-man.glb> <downloaded-woman.glb>
// Source/license details live in public/office/people/CREDITS.md. No network I/O.
import fs from "node:fs/promises";
import path from "node:path";
import { createHash } from "node:crypto";
import { fileURLToPath } from "node:url";
import { AnimationClip, AnimationMixer, Vector3, Quaternion, Euler, QuaternionKeyframeTrack, VectorKeyframeTrack, Box3 } from "../apps/web/node_modules/three/build/three.module.js";
import { GLTFLoader } from "../apps/web/node_modules/three/examples/jsm/loaders/GLTFLoader.js";
import { GLTFExporter } from "../apps/web/node_modules/three/examples/jsm/exporters/GLTFExporter.js";

// GLTFExporter uses FileReader for its binary Blob. Node provides Blob, but not FileReader.
globalThis.FileReader = class {
  readAsArrayBuffer(blob) { blob.arrayBuffer().then(result => { this.result = result; this.onloadend?.(); }); }
};
const output = fileURLToPath(new URL("../apps/web/public/office/people/", import.meta.url));
if (process.argv.length !== 4) throw new Error("Pass exactly two source GLBs: man, then woman");
await fs.mkdir(output, { recursive: true });
const manifest = [];
for (const [index, source] of process.argv.slice(2).entries()) {
  const bytes = await fs.readFile(source);
  const gltf = await new GLTFLoader().parseAsync(bytes.buffer.slice(bytes.byteOffset, bytes.byteOffset + bytes.byteLength), "");
  const idle = gltf.animations.find(clip => clip.name.endsWith("|Idle_Neutral"));
  const walk = gltf.animations.find(clip => clip.name.endsWith("|Walk"));
  if (!idle || !walk) throw new Error("Required Idle_Neutral and Walk clips missing");
  idle.name = "Idle"; walk.name = "Walk";
  const mixer = new AnimationMixer(gltf.scene);
  mixer.clipAction(idle).play(); mixer.update(0); gltf.scene.updateMatrixWorld(true);
  const box = new Box3().setFromObject(gltf.scene);
  const height = box.max.y - box.min.y;
  const scale = 1.8 / height;
  // Fuller toy-like silhouettes without uniformly enlarging people into desks.
  gltf.scene.scale.set(1.18, 1, 1.12);
  const bones = [];
  gltf.scene.traverse(object => {
    if (object.isBone) bones.push(object);
    if (object.isMesh) {
      const materials = Array.isArray(object.material) ? object.material : [object.material];
      for (const material of materials) {
        material.roughness = 0.9;
        if (material.name === "Suit" || (index === 1 && material.name === "Black")) material.color.set("#193e70");
        if (material.name === "Tie") material.color.set("#4578bd");
        if (/Hair/.test(material.name)) material.color.set(index ? "#382b25" : "#241e1a");
      }
    }
  });
  gltf.scene.getObjectByName("Head").scale.multiplyScalar(1.16);
  gltf.scene.updateMatrixWorld(true);
  const standing = bones.map(bone => ({ bone, position: bone.position.clone(), quaternion: bone.quaternion.clone() }));
  const find = name => { const bone = gltf.scene.getObjectByName(name); if (!bone) throw new Error(`Missing bone ${name}`); return bone; };
  const body = find("Body");
  const hipHeight = (find("UpperLegL").getWorldPosition(new Vector3()).y + find("UpperLegR").getWorldPosition(new Vector3()).y) / 2;
  // Hip joints sit 6cm above the 59cm cushion. Both rigs have different Body
  // origins, so a fixed root-height subtraction would seat them differently.
  const target = body.getWorldPosition(new Vector3()).add(new Vector3(0, 0.65 / scale - hipHeight, 0));
  body.position.copy(body.parent.worldToLocal(target));
  gltf.scene.updateMatrixWorld(true);
  function aim(name, childName, direction) {
    const bone = find(name), child = find(childName);
    const local = child.position.clone().multiply(bone.scale).normalize();
    const parentDirection = new Vector3(...direction).transformDirection(bone.parent.matrixWorld.clone().invert());
    bone.quaternion.setFromUnitVectors(local, parentDirection);
    gltf.scene.updateMatrixWorld(true);
  }
  function bendTo(upperName, middleName, endName, goal, bendSign) {
    const upper = find(upperName), middle = find(middleName), end = find(endName);
    const origin = upper.getWorldPosition(new Vector3());
    const aLength = origin.distanceTo(middle.getWorldPosition(new Vector3()));
    const bLength = middle.getWorldPosition(new Vector3()).distanceTo(end.getWorldPosition(new Vector3()));
    const direction = goal.clone().sub(origin), distance = direction.length();
    direction.normalize();
    const along = (aLength ** 2 - bLength ** 2 + distance ** 2) / (2 * distance);
    const height = Math.sqrt(Math.max(0, aLength ** 2 - along ** 2));
    const bend = new Vector3(0, direction.z * bendSign, -direction.y * bendSign).normalize();
    const elbow = origin.clone().addScaledVector(direction, along).addScaledVector(bend, height);
    aim(upperName, middleName, elbow.sub(origin).toArray());
    aim(middleName, endName, goal.clone().sub(middle.getWorldPosition(new Vector3())).toArray());
  }
  aim("Abdomen", "Torso", [0, 1, 0.18]);
  for (const side of ["L", "R"]) {
    const hip = find(`UpperLeg${side}`).getWorldPosition(new Vector3());
    const ankleGoal = new Vector3(hip.x, 0.04 / scale, hip.z + 0.58 / scale);
    bendTo(`UpperLeg${side}`, `LowerLeg${side}`, `LowerLeg${side}_end`, ankleGoal, 1);
    const foot = find(`Foot${side}`);
    const ankle = find(`LowerLeg${side}_end`).getWorldPosition(new Vector3());
    ankle.y = 0; // Shoe soles extend below this pivot; the runtime adds 3cm.
    foot.position.copy(foot.parent.worldToLocal(ankle));
    gltf.scene.updateMatrixWorld(true);
    const shoulder = find(`UpperArm${side}`).getWorldPosition(new Vector3());
    bendTo(`UpperArm${side}`, `LowerArm${side}`, `Wrist${side}`, new Vector3(shoulder.x * 0.88, 0.88 / scale, 0.37 / scale), -1);
    aim(`Wrist${side}`, `Middle1${side}`, [0, 0, 1]);
    for (const finger of ["Index", "Middle", "Ring", "Pinky"]) for (let joint = 1; joint < 4; joint++) aim(`${finger}${joint}${side}`, `${finger}${joint + 1}${side}`, [0, 0, 1]);
  }
  const times = [0, 1, 2, 3, 4];
  const tracks = bones.flatMap(bone => {
    const quaternions = times.flatMap(t => {
      const angle = Math.sin(t * Math.PI / 2);
      const movement = bone.name === "Head" ? new Euler(angle * 0.018, angle * 0.025, 0) : /^LowerArm/.test(bone.name) ? new Euler(angle * (bone.name.endsWith("L") ? 0.025 : -0.025), 0, 0) : new Euler();
      return bone.quaternion.clone().multiply(new Quaternion().setFromEuler(movement)).toArray();
    });
    return [new VectorKeyframeTrack(`${bone.name}.position`, [0, 4], [...bone.position.toArray(), ...bone.position.toArray()]), new QuaternionKeyframeTrack(`${bone.name}.quaternion`, times, quaternions)];
  });
  const desk = new AnimationClip("DeskIdle", 4, tracks);
  for (const state of standing) { state.bone.position.copy(state.position); state.bone.quaternion.copy(state.quaternion); }
  mixer.stopAllAction(); mixer.uncacheRoot(gltf.scene);
  gltf.scene.userData = { author: "Quaternius", source: index ? "https://poly.pizza/m/sOUciDsoVV" : "https://poly.pizza/m/JFrLIKqvCH", modifications: "Office palette; broader body and larger head; retained Walk/Idle; desk-aligned authored DeskIdle clip", normalizedHeight: 1.8, normalizationScale: scale };
  const binary = await new GLTFExporter().parseAsync(gltf.scene, { binary: true, animations: [idle, walk, desk] });
  const name = index ? "office-woman.glb" : "office-man.glb";
  await fs.writeFile(path.join(output, name), Buffer.from(binary));
  const geometries = new Set();
  gltf.scene.traverse(object => { if (object.isMesh) geometries.add(object.geometry); });
  const triangles = [...geometries].reduce((sum, geometry) => sum + (geometry.index?.count ?? geometry.attributes.position.count) / 3, 0);
  const record = { file: name, source: gltf.scene.userData.source, license: index ? "CC-BY-3.0" : "CC0-1.0", sourceSha256: createHash("sha256").update(bytes).digest("hex"), sha256: createHash("sha256").update(Buffer.from(binary)).digest("hex"), bytes: binary.byteLength, sourceHeight: height, scale, proportions: { bodyWidth: 1.18, bodyDepth: 1.12, head: 1.16, baseHeight: 1.8 }, pose: { hipHeight: 0.65, wristHeight: 0.88, wristReach: 0.37 }, triangles, bones: bones.length, clips: { Idle: idle.duration, Walk: walk.duration, DeskIdle: desk.duration } };
  manifest.push(record);
  console.log(JSON.stringify(record));
}
await fs.writeFile(path.join(output, "manifest.json"), JSON.stringify(manifest, null, 2) + "\n");
