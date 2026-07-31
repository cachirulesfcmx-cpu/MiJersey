export interface CarrierProps {
  id: string;
  name: string;
  code: string;
  isActive: boolean;
  createdAt: Date;
  updatedAt: Date;
}

export class CarrierEntity {
  constructor(private readonly props: CarrierProps) {}

  get id(): string {
    return this.props.id;
  }

  get name(): string {
    return this.props.name;
  }

  get isActive(): boolean {
    return this.props.isActive;
  }

  toJSON(): CarrierProps {
    return { ...this.props };
  }
}
