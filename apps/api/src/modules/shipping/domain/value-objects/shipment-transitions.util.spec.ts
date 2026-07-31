import { ShipmentStatus } from './shipment-status';
import { canTransitionShipment } from './shipment-transitions.util';

describe('canTransitionShipment', () => {
  it.each([ShipmentStatus.LABEL_CREATED, ShipmentStatus.IN_TRANSIT])(
    'allows transitioning a shipment in status %s',
    (status) => {
      expect(canTransitionShipment(status)).toBe(true);
    },
  );

  it.each([ShipmentStatus.DELIVERED, ShipmentStatus.RETURNED, ShipmentStatus.FAILED])(
    'rejects transitioning a shipment in terminal status %s',
    (status) => {
      expect(canTransitionShipment(status)).toBe(false);
    },
  );
});
