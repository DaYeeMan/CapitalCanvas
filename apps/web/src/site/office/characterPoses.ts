import { AnimationClip, AnimationMixer, Euler, Quaternion, QuaternionKeyframeTrack, Vector3, VectorKeyframeTrack, type Object3D } from "three";
import type { SeatKind } from "./officeSpatial";

const cached = new WeakMap<Object3D, AnimationClip[]>();
// Grounded-foot travel measured over one full cycle of the scaled bundled rigs.
export const WALK_CYCLE_DISTANCE = 1.96;
export const SEATED_CLIP: Record<SeatKind, string> = { desk: "DeskRest", conference: "ConferenceRest", armchair: "ArmchairRest", sofa: "SofaRest", stool: "StoolRest" };

// Derive compact shared pose clips once from each shipped rig. Geometry, GLB
// bytes, proportions and licensing stay intact; runtime workers clone only rigs.
export function seatedClips(scene: Object3D, animations: AnimationClip[], scale: number) {
  const existing = cached.get(scene); if (existing) return existing;
  const bones: Object3D[] = []; scene.traverse(object => { if (object.type === "Bone") bones.push(object); });
  const original = bones.map(bone => ({ bone, p: bone.position.clone(), q: bone.quaternion.clone() }));
  const mixer = new AnimationMixer(scene), desk = animations.find(clip => clip.name === "DeskIdle")!;
  const find = (name: string) => scene.getObjectByName(name)!;
  function resetDesk() { mixer.stopAllAction(); mixer.clipAction(desk).reset().play(); mixer.setTime(0); scene.updateMatrixWorld(true); }
  function aim(name: string, childName: string, direction: Vector3) {
    const bone = find(name), child = find(childName);
    const local = child.position.clone().multiply(bone.scale).normalize();
    const parentDirection = direction.transformDirection(bone.parent!.matrixWorld.clone().invert());
    bone.quaternion.setFromUnitVectors(local, parentDirection); scene.updateMatrixWorld(true);
  }
  function bend(upperName: string, middleName: string, endName: string, goal: Vector3, sign: number) {
    const upper = find(upperName), middle = find(middleName), end = find(endName), origin = upper.getWorldPosition(new Vector3());
    const a = origin.distanceTo(middle.getWorldPosition(new Vector3())), b = middle.getWorldPosition(new Vector3()).distanceTo(end.getWorldPosition(new Vector3()));
    const direction = goal.clone().sub(origin), d = Math.max(1e-5, Math.min(direction.length(), a + b - 1e-5)); direction.normalize();
    const along = (a * a - b * b + d * d) / (2 * d), height = Math.sqrt(Math.max(0, a * a - along * along));
    const perpendicular = new Vector3(0, direction.z * sign, -direction.y * sign).normalize();
    const elbow = origin.clone().addScaledVector(direction, along).addScaledVector(perpendicular, height);
    aim(upperName, middleName, elbow.sub(origin));
    aim(middleName, endName, goal.clone().sub(middle.getWorldPosition(new Vector3())));
  }
  function clip(name: string, typing = false) {
    const times = typing ? [0, 0.25, 0.5, 0.75, 1] : [0, 1];
    return new AnimationClip(name, 1, bones.flatMap(bone => {
      const values = times.flatMap(t => bone.quaternion.clone().multiply(new Quaternion().setFromEuler(new Euler(/^LowerArm/.test(bone.name) && typing ? Math.sin(t * Math.PI * 2) * 0.035 : 0, 0, 0))).toArray());
      return [new VectorKeyframeTrack(`${bone.name}.position`, [0, 1], [...bone.position.toArray(), ...bone.position.toArray()]), new QuaternionKeyframeTrack(`${bone.name}.quaternion`, times, values)];
    }));
  }
  const clips: AnimationClip[] = [];
  resetDesk(); clips.push(clip("DeskRest"), clip("DeskTyping", true));
  for (const [kind, height] of [["conference", 0.59], ["armchair", 0.67], ["sofa", 0.69], ["stool", 0.76]] as const) {
    resetDesk();
    // Conference hands rest on the table, without typing, so tucked chairs do
    // not put forearms through the tabletop on the way down to a lap pose.
    if (kind === "conference") { clips.push(clip(SEATED_CLIP[kind])); continue; }
    const body = find("Body"), targetHip = (height + (kind === "sofa" ? 0.11 : 0.06)) / scale;
    const hip = find("UpperLegL").getWorldPosition(new Vector3()).y;
    const target = body.getWorldPosition(new Vector3()).add(new Vector3(0, targetHip - hip, 0));
    body.position.copy(body.parent!.worldToLocal(target)); scene.updateMatrixWorld(true);
    for (const side of ["L", "R"]) {
      const hip = find(`UpperLeg${side}`).getWorldPosition(new Vector3());
      if (kind === "sofa") {
        // Support the thighs across the cushion and hang the calves over its edge.
        // Rotate the existing limbs; their lengths and the furniture stay intact.
        aim(`UpperLeg${side}`, `LowerLeg${side}`, new Vector3(0, 0, 1));
        aim(`LowerLeg${side}`, `LowerLeg${side}_end`, new Vector3(0, -1, 0));
      } else {
        bend(`UpperLeg${side}`, `LowerLeg${side}`, `LowerLeg${side}_end`, new Vector3(hip.x, (kind === "stool" ? 0.18 : 0.04) / scale, hip.z + 0.42 / scale), 1);
      }
      const ankle = find(`LowerLeg${side}_end`).getWorldPosition(new Vector3());
      ankle.y = kind === "sofa" ? ankle.y - 0.04 / scale : (kind === "stool" ? 0.14 : 0) / scale;
      const foot = find(`Foot${side}`); foot.position.copy(foot.parent!.worldToLocal(ankle)); scene.updateMatrixWorld(true);
      const shoulder = find(`UpperArm${side}`).getWorldPosition(new Vector3());
      bend(`UpperArm${side}`, `LowerArm${side}`, `Wrist${side}`, new Vector3(shoulder.x * 0.83, targetHip + 0.07 / scale, hip.z + 0.25 / scale), -1);
      aim(`Wrist${side}`, `Middle1${side}`, new Vector3(0, -0.1, 1));
    }
    clips.push(clip(SEATED_CLIP[kind]));
  }
  mixer.stopAllAction(); mixer.uncacheRoot(scene);
  for (const { bone, p, q } of original) { bone.position.copy(p); bone.quaternion.copy(q); }
  scene.updateMatrixWorld(true); cached.set(scene, clips); return clips;
}
