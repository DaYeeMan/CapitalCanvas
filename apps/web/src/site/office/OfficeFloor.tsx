import { OfficeShell } from "./OfficeShell";
import { DeskPod, Furnishing, OfficeRoom } from "./Furniture";
import type { FloorLayout } from "./layouts";
import type { DoorState } from "./peopleSimulation";

export function OfficeFloor({ layout, doors }: { layout: FloorLayout; doors?: Map<string, DoorState> }) {
  return <group name={`${layout.id}-floor`} dispose={null}>
    <OfficeShell openings={layout.northwestOpenings} />
    {layout.rooms.map(room => <OfficeRoom key={room.id} room={room} doors={doors} />)}
    {layout.fixtures.map(fixture => <Furnishing key={fixture.id} fixture={fixture} />)}
    {layout.pods.map(pod => <group key={pod.tool} name={pod.tool} position={[pod.at[0], 0, pod.at[1]]}>
      <DeskPod />
    </group>)}
  </group>;
}
