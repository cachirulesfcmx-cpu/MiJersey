import type { InventoryMovementType } from '../value-objects/inventory-enums';

export interface InventoryMovementProps {
  id: string;
  inventoryItemId: string;
  type: InventoryMovementType;
  quantity: number;
  reason: string | null;
  referenceType: string | null;
  referenceId: string | null;
  createdBy: string;
  createdAt: Date;
}

/** Inmutable: no expone ningún método de mutación (spec §4 y §10 — nunca se borra ni edita un movimiento). */
export class InventoryMovementEntity {
  constructor(private readonly props: InventoryMovementProps) {}

  get id(): string {
    return this.props.id;
  }

  get inventoryItemId(): string {
    return this.props.inventoryItemId;
  }

  get type(): InventoryMovementType {
    return this.props.type;
  }

  get quantity(): number {
    return this.props.quantity;
  }

  get reason(): string | null {
    return this.props.reason;
  }

  get referenceType(): string | null {
    return this.props.referenceType;
  }

  get referenceId(): string | null {
    return this.props.referenceId;
  }

  get createdBy(): string {
    return this.props.createdBy;
  }

  get createdAt(): Date {
    return this.props.createdAt;
  }

  toJSON(): InventoryMovementProps {
    return { ...this.props };
  }
}
