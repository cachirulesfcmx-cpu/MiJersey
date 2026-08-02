import type { ThemeSectionKey } from '../value-objects/theme-enums';

export interface ThemeSectionProps {
  id: string;
  section: ThemeSectionKey;
  config: Record<string, unknown>;
  enabled: boolean;
  updatedAt: Date;
}

export class ThemeSectionEntity {
  constructor(private readonly props: ThemeSectionProps) {}

  get section(): ThemeSectionKey {
    return this.props.section;
  }

  toJSON(): ThemeSectionProps {
    return { ...this.props };
  }
}
