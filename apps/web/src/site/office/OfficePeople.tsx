import { Component, Suspense, useEffect, useMemo, useRef, type ReactNode } from "react";
import { useGLTF, useAnimations } from "@react-three/drei";
import { useFrame, useThree } from "@react-three/fiber";
import { clone } from "three/addons/utils/SkeletonUtils.js";
import { type Group, type Mesh, type SkinnedMesh } from "three";
import { seatedWorkers, WALK_ROUTES, walkSample, type WalkRoute } from "./peoplePaths";
import type { FloorId } from "./layouts";
import characterManifest from "../../../public/office/people/manifest.json";

const MODEL = {
  man: { url: `/office/people/${characterManifest[0].file}?v=${characterManifest[0].sha256.slice(0, 12)}`, scale: characterManifest[0].scale },
  woman: { url: `/office/people/${characterManifest[1].file}?v=${characterManifest[1].sha256.slice(0, 12)}`, scale: characterManifest[1].scale },
};
class PeopleBoundary extends Component<{ children: ReactNode }, { failed: boolean }> {
  state = { failed: false };
  static getDerivedStateFromError() { return { failed: true }; }
  render() { return this.state.failed ? null : this.props.children; }
}
function Worker({ model, x = 0, z = 0, angle = 0, phase = 0, route, active, animate }: { model: "man" | "woman"; x?: number; z?: number; angle?: number; phase?: number; route?: WalkRoute; active: boolean; animate: boolean }) {
  const { scene, animations } = useGLTF(MODEL[model].url, false, false);
  const invalidate = useThree(state => state.invalidate);
  const person = useMemo(() => {
    const instance = clone(scene);
    instance.traverse(object => { if ((object as Mesh).isMesh) { object.castShadow = true; object.receiveShadow = true; object.frustumCulled = false; } });
    return instance;
  }, [scene]);
  const { actions, mixer } = useAnimations(animations, person);
  const root = useRef<Group>(null);
  const elapsed = useRef(0);
  const walking = useRef(true);
  useEffect(() => {
    const initial = actions[route ? "Walk" : "DeskIdle"]!;
    initial.reset().play(); initial.time = phase * initial.getClip().duration;
    mixer.update(0);
    if (route && root.current) {
      const sample = walkSample(route, 0); root.current.position.set(sample.x, 0.03, sample.z); root.current.rotation.y = sample.angle;
    }
    // Effects can apply the seated pose after a paused Canvas has already drawn
    // its first frame. Render once more so reduced motion shows that pose too.
    invalidate();
    return () => {
      mixer.stopAllAction();
      // SkeletonUtils clones independent GPU bone textures, while retaining the
      // cached model's geometry/materials. Dispose only the per-person skeletons.
      person.traverse(object => { if ((object as SkinnedMesh).isSkinnedMesh) (object as SkinnedMesh).skeleton.dispose(); });
    };
  }, [actions, mixer, person, route, phase, invalidate]);
  useEffect(() => { mixer.timeScale = active && animate ? 1 : 0; }, [mixer, active, animate]);
  useFrame((_, delta) => {
    if (!active || !animate || !route || !root.current) return;
    elapsed.current += Math.min(delta, 0.05);
    const sample = walkSample(route, elapsed.current);
    root.current.position.set(sample.x, 0.03, sample.z);
    const difference = Math.atan2(Math.sin(sample.angle - root.current.rotation.y), Math.cos(sample.angle - root.current.rotation.y));
    root.current.rotation.y += difference * (1 - Math.exp(-Math.min(delta, 0.05) * 9));
    if (walking.current !== sample.walking) {
      walking.current = sample.walking;
      actions[sample.walking ? "Idle" : "Walk"]?.fadeOut(0.2);
      actions[sample.walking ? "Walk" : "Idle"]?.reset().fadeIn(0.2).play();
    }
  });
  return <group ref={root} position={[x, 0.03, z]} rotation-y={angle} scale={MODEL[model].scale} dispose={null} name={route ? "walking-worker" : "seated-worker"}><primitive object={person} /></group>;
}
export function OfficePeople({ floor, active, animate }: { floor: FloorId; active: boolean; animate: boolean }) {
  return <PeopleBoundary><Suspense fallback={null}>
    {seatedWorkers(floor).map((seat, i) => <Worker key={seat.id} {...seat} phase={i / 7} active={active} animate={animate} />)}
    {WALK_ROUTES[floor].map((route, i) => <Worker key={`walk-${i}`} model={route.model} route={route} active={active} animate={animate} />)}
  </Suspense></PeopleBoundary>;
}
