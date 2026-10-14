import { useLayoutEffect, useRef, type RefObject } from "react";
import { useFrame } from "@react-three/fiber";
import { Matrix4, Vector3, Quaternion, type InstancedMesh, type Group, type DirectionalLight, type Object3D, type OrthographicCamera } from "three";
import { geometry, materials } from "./sceneResources";
import { SURROUNDING_BLOCKS, SURROUNDINGS, surroundingsPosition } from "./surroundings";

export function OfficeSurroundings({ progress }: { progress: RefObject<number> }) {
  const mesh = useRef<InstancedMesh>(null);
  const group = useRef<Group>(null);
  const light = useRef<DirectionalLight>(null);
  const target = useRef<Object3D>(null);
  useLayoutEffect(() => {
    const matrix = new Matrix4(), rotation = new Quaternion(), position = new Vector3(), scale = new Vector3();
    SURROUNDING_BLOCKS.forEach(({ at, size }, i) => {
      matrix.compose(position.set(...at), rotation, scale.set(...size));
      mesh.current!.setMatrixAt(i, matrix);
    });
    mesh.current!.instanceMatrix.needsUpdate = true;
    mesh.current!.computeBoundingSphere();
    light.current!.target = target.current!;
    light.current!.shadow.needsUpdate = true;
  }, []);
  useFrame(({ camera }) => {
    const cam = camera as OrthographicCamera;
    const [x, y, z] = surroundingsPosition(cam.top - cam.bottom, progress.current);
    if (group.current!.position.x !== x || group.current!.position.y !== y) {
      group.current!.position.set(x, y, z);
      // Static environment shadows are cached at rest, and refreshed only for
      // a resize/slide. Workers retain their separate, sharper office shadows.
      light.current!.shadow.needsUpdate = true;
    }
  }, -1);
  return <group ref={group} name="office-surroundings" dispose={null}>
    <instancedMesh ref={mesh} name="stepped-block-stacks" args={[geometry.box, materials.outside, SURROUNDING_BLOCKS.length]} layers-mask={2} castShadow receiveShadow />
    <mesh name="surroundings-ground" position={[-34, -0.12, -34]} rotation-x={-Math.PI / 2} scale={[SURROUNDINGS.groundSide, SURROUNDINGS.groundSide, 1]} geometry={geometry.pane} material={materials.outsideGround} layers-mask={2} receiveShadow />
    <object3D ref={target} position={[-35, 0, -35]} />
    <directionalLight ref={light} name="surroundings-daylight" position={[-71, 72, -7]} color="#fff3de" intensity={2.6} layers-mask={2} castShadow shadow-autoUpdate={false} shadow-mapSize={[2048, 2048]} shadow-radius={5} shadow-blurSamples={6} shadow-camera-near={10} shadow-camera-far={180} shadow-camera-left={-55} shadow-camera-right={55} shadow-camera-top={55} shadow-camera-bottom={-55} shadow-normalBias={0.025} shadow-bias={-0.0001} />
  </group>;
}
