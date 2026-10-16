import { Component, Suspense, useEffect, useMemo, useRef, type ReactNode } from "react";
import { useGLTF } from "@react-three/drei";
import { useFrame, useThree } from "@react-three/fiber";
import { clone } from "three/addons/utils/SkeletonUtils.js";
import { AnimationMixer, type Group, type Mesh, type SkinnedMesh } from "three";
import characterManifest from "../../../public/office/people/manifest.json";
import { characterGeometry } from "./characterAppearance";
import { seatedClips, SEATED_CLIP, WALK_CYCLE_DISTANCE } from "./characterPoses";
import { personSeat, STEP, WALK_SPEED, type FloorSimulation, type PeopleSession, type Person } from "./peopleSimulation";

const MODEL = {
  man: { url: `/office/people/${characterManifest[0].file}?v=${characterManifest[0].sha256.slice(0, 12)}`, scale: characterManifest[0].scale },
  woman: { url: `/office/people/${characterManifest[1].file}?v=${characterManifest[1].sha256.slice(0, 12)}`, scale: characterManifest[1].scale },
};
class PeopleBoundary extends Component<{ children: ReactNode }, { failed: boolean }> {
  state = { failed: false };
  static getDerivedStateFromError() { return { failed: true }; }
  render() { return this.state.failed ? null : this.props.children; }
}
function Worker({ worker, simulation, session, visible }: { worker: Person; simulation: FloorSimulation; session: PeopleSession; visible: boolean }) {
  const model = MODEL[worker.model], { scene, animations } = useGLTF(model.url, false, false);
  const invalidate = useThree(state => state.invalidate), root = useRef<Group>(null);
  const runtime = useMemo(() => {
    const clips = seatedClips(scene, animations, model.scale), person = clone(scene);
    person.traverse(object => {
      const mesh = object as Mesh;
      if (mesh.isMesh) { mesh.geometry = characterGeometry(mesh.geometry); mesh.castShadow = true; mesh.receiveShadow = true; mesh.frustumCulled = false; }
    });
    const mixer = new AnimationMixer(person);
    const actions = Object.fromEntries([...animations.filter(clip => clip.name !== "DeskIdle"), ...clips].map(clip => [clip.name, mixer.clipAction(clip)]));
    // The two rigs have different cycle durations; match both to ground speed.
    actions.Walk.setEffectiveTimeScale(WALK_SPEED * actions.Walk.getClip().duration / WALK_CYCLE_DISTANCE);
    return { person, mixer, actions };
  }, [scene, animations, model.scale]);
  useEffect(() => {
    for (const action of Object.values(runtime.actions)) action.play().setEffectiveWeight(0);
    runtime.actions.Idle.setEffectiveWeight(1); runtime.mixer.setTime(0); invalidate();
    return () => {
      runtime.mixer.stopAllAction(); runtime.mixer.uncacheRoot(runtime.person);
      runtime.person.traverse(object => { if ((object as SkinnedMesh).isSkinnedMesh) (object as SkinnedMesh).skeleton.dispose(); });
    };
  }, [runtime, invalidate]);
  useFrame(() => {
    if (!visible || !root.current || root.current.parent?.visible === false || !session.ready) return;
    const time = simulation.tick * STEP;
    const alpha = session.paused || worker.state === "seated" ? 1 : Math.max(0, Math.min(1, (session.time - time) / STEP));
    for (const action of Object.values(runtime.actions)) action.setEffectiveWeight(0);
    const seat = personSeat(simulation, worker);
    if (worker.state === "seated" && seat) {
      const typing = seat.kind === "desk" && time < worker.typingUntil && !session.paused;
      runtime.actions[typing ? "DeskTyping" : SEATED_CLIP[seat.kind]].setEffectiveWeight(1);
    } else {
      const walking = worker.previousStride + (worker.stride - worker.previousStride) * alpha;
      runtime.actions.Walk.setEffectiveWeight(walking); runtime.actions.Idle.setEffectiveWeight(1 - walking);
    }
    // Behavior is stepped; sample the animation on the continuous session clock.
    // It advances every rendered frame and freezes with reduced motion.
    runtime.mixer.setTime(session.time + worker.phase);
    root.current.position.set(worker.previous[0] + (worker.at[0] - worker.previous[0]) * alpha, 0.03, worker.previous[1] + (worker.at[1] - worker.previous[1]) * alpha);
    const turn = Math.atan2(Math.sin(worker.angle - worker.previousAngle), Math.cos(worker.angle - worker.previousAngle));
    root.current.rotation.y = worker.previousAngle + turn * alpha;
    root.current.name = `${worker.state}-worker`;
    root.current.userData.state = worker.state; root.current.userData.seat = worker.seat; root.current.userData.home = worker.home;
  });
  return <group ref={root} position={[worker.at[0], 0.03, worker.at[1]]} rotation-y={worker.angle} scale={model.scale} dispose={null} userData={{ personId: worker.id }}><primitive object={runtime.person} /></group>;
}
export function OfficePeople({ simulation, session, visible }: { simulation: FloorSimulation; session: PeopleSession; visible: boolean }) {
  return <PeopleBoundary><Suspense fallback={null}>{simulation.people.map(worker => <Worker key={worker.id} worker={worker} simulation={simulation} session={session} visible={visible} />)}</Suspense></PeopleBoundary>;
}
