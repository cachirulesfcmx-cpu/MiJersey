export interface ShippingZoneProps {
  id: string;
  name: string;
  countries: string[];
  states: string[];
  createdAt: Date;
  updatedAt: Date;
}

export class ShippingZoneEntity {
  constructor(private readonly props: ShippingZoneProps) {}

  get id(): string {
    return this.props.id;
  }

  get countries(): string[] {
    return this.props.countries;
  }

  get states(): string[] {
    return this.props.states;
  }

  /** `states` vacío significa "todo el país" — coincide con cualquier estado del país listado. */
  matches(country: string, state: string | null): boolean {
    if (!this.props.countries.includes(country)) return false;
    if (this.props.states.length === 0) return true;
    return state !== null && this.props.states.includes(state);
  }

  toJSON(): ShippingZoneProps {
    return { ...this.props };
  }
}
