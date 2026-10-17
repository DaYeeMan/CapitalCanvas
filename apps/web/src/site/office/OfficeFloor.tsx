import { OfficeLamps } from "./OfficeLamps";
import { OfficeShell } from "./OfficeShell";
import { DeskPod, Furnishing, OfficeRoom } from "./Furniture";
import type { FloorLayout } from "./layouts";
import type { DoorState } from "./peopleSimulation";
import { useLayoutEffect, useRef } from "react";
import { useThree } from "@react-three/fiber";
import type { Group } from "three";
import { batchStaticFurniture } from "./staticFurniture";

export function OfficeFloor({ layout, doors, lighterShadows = false }: { layout: FloorLayout; doors?: Map<string, DoorState>; lighterShadows?: boolean }) {
  const root = useRef<Group>(null);
  const invalidate = useThree(state => state.invalidate);
  useLayoutEffect(() => {
    if (!root.current) return;
    const restore = batchStaticFurniture(root.current, lighterShadows);
    invalidate();
    return () => { restore(); invalidate(); };
  }, [lighterShadows, layout, invalidate]);
  return <group ref={root} name={`${layout.id}-floor`} dispose={null}>
    <OfficeShell openings={layout.northwestOpenings} />
    <OfficeLamps floor={layout.id} />
    {layout.rooms.map(room => <OfficeRoom key={room.id} room={room} doors={doors} />)}
    {layout.fixtures.map(fixture => <Furnishing key={fixture.id} fixture={fixture} />)}
    {layout.pods.map(pod => <group key={pod.tool} name={pod.tool} position={[pod.at[0], 0, pod.at[1]]}>
      <DeskPod />
    </group>)}
  </group>;
}
