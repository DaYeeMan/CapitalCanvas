import { OfficeShell } from "./OfficeShell";
import { DeskPod, Furnishing, OfficeRoom } from "./Furniture";
import type { FloorLayout } from "./layouts";

export function OfficeFloor({ layout }: { layout: FloorLayout }) {
  return <group name={`${layout.id}-floor`} dispose={null}>
    <OfficeShell openings={layout.northwestOpenings} />
    {layout.rooms.map(room => <OfficeRoom key={room.id} room={room} />)}
    {layout.fixtures.map(fixture => <Furnishing key={fixture.id} fixture={fixture} />)}
    {layout.pods.map(pod => <group key={pod.tool} name={pod.tool} position={[pod.at[0], 0, pod.at[1]]}>
      <DeskPod />
    </group>)}
  </group>;
}
