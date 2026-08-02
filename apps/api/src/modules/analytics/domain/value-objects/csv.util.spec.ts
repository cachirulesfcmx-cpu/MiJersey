import { toCsv } from './csv.util';

interface Row {
  name: string;
  amount: number;
}

describe('toCsv', () => {
  it('renders a header row followed by one row per item', () => {
    const rows: Row[] = [
      { name: 'Ana', amount: 10 },
      { name: 'Luis', amount: 20 },
    ];

    const csv = toCsv(rows, [
      { header: 'name', value: (row) => row.name },
      { header: 'amount', value: (row) => row.amount },
    ]);

    expect(csv).toBe('name,amount\nAna,10\nLuis,20');
  });

  it('returns only the header when there are no rows', () => {
    const csv = toCsv<Row>([], [{ header: 'name', value: (row) => row.name }]);
    expect(csv).toBe('name');
  });

  it('quotes cells containing commas, quotes, or newlines', () => {
    const rows: Row[] = [{ name: 'Doe, "John"\nJr', amount: 1 }];
    const csv = toCsv(rows, [{ header: 'name', value: (row) => row.name }]);
    expect(csv).toBe('name\n"Doe, ""John""\nJr"');
  });
});
