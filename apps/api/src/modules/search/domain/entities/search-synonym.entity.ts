export interface SearchSynonymProps {
  id: string;
  term: string;
  synonyms: string[];
  createdAt: Date;
  updatedAt: Date;
}

export class SearchSynonymEntity {
  constructor(private readonly props: SearchSynonymProps) {}

  get id(): string {
    return this.props.id;
  }

  get term(): string {
    return this.props.term;
  }

  get synonyms(): string[] {
    return this.props.synonyms;
  }

  get createdAt(): Date {
    return this.props.createdAt;
  }

  get updatedAt(): Date {
    return this.props.updatedAt;
  }

  toJSON(): SearchSynonymProps {
    return { ...this.props };
  }
}
