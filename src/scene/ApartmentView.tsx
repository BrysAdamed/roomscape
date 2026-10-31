import type { Apartment } from '../schema/apartment';
import { FloorView } from './FloorView';

export function ApartmentView({ apartment }: { apartment: Apartment }) {
  return (
    <group>
      {apartment.floors.map((floor) => (
        <FloorView key={floor.id} floor={floor} />
      ))}
    </group>
  );
}
