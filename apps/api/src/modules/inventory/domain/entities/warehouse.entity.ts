import type { WarehouseStatus } from '../value-objects/inventory-enums';

export interface WarehouseProps {
  id: string;
  code: string;
  name: string;
  status: WarehouseStatus;
  createdAt: Date;
  updatedAt: Date;
}

export class WarehouseEntity {
  constructor(private readonly props: WarehouseProps) {}

  get id(): string {
    return this.props.id;
  }

  get code(): string {
    return this.props.code;
  }

  get name(): string {
    return this.props.name;
  }

  get status(): WarehouseStatus {
    return this.props.status;
  }

  get createdAt(): Date {
    return this.props.createdAt;
  }

  get updatedAt(): Date {
    return this.props.updatedAt;
  }

  toJSON(): WarehouseProps {
    return { ...this.props };
  }
}
