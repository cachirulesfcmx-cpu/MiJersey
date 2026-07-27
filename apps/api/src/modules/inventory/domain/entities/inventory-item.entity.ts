export interface InventoryItemProps {
  id: string;
  variantId: string;
  warehouseId: string;
  availableQuantity: number;
  reservedQuantity: number;
  incomingQuantity: number;
  safetyStock: number;
  version: number;
  createdAt: Date;
  updatedAt: Date;
}

export class InventoryItemEntity {
  constructor(private readonly props: InventoryItemProps) {}

  get id(): string {
    return this.props.id;
  }

  get variantId(): string {
    return this.props.variantId;
  }

  get warehouseId(): string {
    return this.props.warehouseId;
  }

  get availableQuantity(): number {
    return this.props.availableQuantity;
  }

  get reservedQuantity(): number {
    return this.props.reservedQuantity;
  }

  get incomingQuantity(): number {
    return this.props.incomingQuantity;
  }

  get safetyStock(): number {
    return this.props.safetyStock;
  }

  get version(): number {
    return this.props.version;
  }

  get isBelowSafetyStock(): boolean {
    return this.props.availableQuantity < this.props.safetyStock;
  }

  get createdAt(): Date {
    return this.props.createdAt;
  }

  get updatedAt(): Date {
    return this.props.updatedAt;
  }

  toJSON(): InventoryItemProps & { isBelowSafetyStock: boolean } {
    return { ...this.props, isBelowSafetyStock: this.isBelowSafetyStock };
  }
}
