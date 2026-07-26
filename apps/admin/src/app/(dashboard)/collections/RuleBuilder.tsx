'use client';

import type {
  CollectionRuleField,
  CollectionRuleMatchType,
  CollectionRuleOperator,
  CollectionRuleValue,
} from '@mijersey/sdk';
import { Button } from '@mijersey/ui';

const FIELD_LABELS: Record<CollectionRuleField, string> = {
  NAME: 'Nombre',
  SKU: 'SKU',
  TYPE: 'Tipo',
  STATUS: 'Estado',
};

const OPERATOR_LABELS: Record<CollectionRuleOperator, string> = {
  EQUALS: 'es igual a',
  CONTAINS: 'contiene',
};

const EMPTY_RULE: CollectionRuleValue = { field: 'SKU', operator: 'CONTAINS', value: '' };

interface RuleBuilderProps {
  matchType: CollectionRuleMatchType;
  rules: CollectionRuleValue[];
  onChange: (matchType: CollectionRuleMatchType, rules: CollectionRuleValue[]) => void;
}

export function RuleBuilder({ matchType, rules, onChange }: RuleBuilderProps) {
  function updateRule(index: number, patch: Partial<CollectionRuleValue>) {
    onChange(
      matchType,
      rules.map((rule, i) => (i === index ? { ...rule, ...patch } : rule)),
    );
  }

  function removeRule(index: number) {
    onChange(
      matchType,
      rules.filter((_, i) => i !== index),
    );
  }

  return (
    <div className="flex flex-col gap-3 rounded-md border border-neutral-200 p-4">
      <div className="flex items-center gap-2 text-sm">
        <span>El producto debe cumplir</span>
        <select
          className="rounded-md border border-neutral-200 px-2 py-1"
          value={matchType}
          onChange={(event) => onChange(event.target.value as CollectionRuleMatchType, rules)}
        >
          <option value="ALL">todas las condiciones</option>
          <option value="ANY">cualquier condición</option>
        </select>
      </div>

      {rules.map((rule, index) => (
        <div key={index} className="flex items-center gap-2">
          <select
            className="rounded-md border border-neutral-200 px-2 py-1 text-sm"
            value={rule.field}
            onChange={(event) =>
              updateRule(index, { field: event.target.value as CollectionRuleField })
            }
          >
            {Object.entries(FIELD_LABELS).map(([value, label]) => (
              <option key={value} value={value}>
                {label}
              </option>
            ))}
          </select>
          <select
            className="rounded-md border border-neutral-200 px-2 py-1 text-sm"
            value={rule.operator}
            onChange={(event) =>
              updateRule(index, { operator: event.target.value as CollectionRuleOperator })
            }
          >
            {Object.entries(OPERATOR_LABELS).map(([value, label]) => (
              <option key={value} value={value}>
                {label}
              </option>
            ))}
          </select>
          <input
            className="flex-1 rounded-md border border-neutral-200 px-2 py-1 text-sm"
            value={rule.value}
            onChange={(event) => updateRule(index, { value: event.target.value })}
            placeholder="Valor"
          />
          <button
            type="button"
            className="text-danger-600 text-sm"
            onClick={() => removeRule(index)}
          >
            Quitar
          </button>
        </div>
      ))}

      <div>
        <Button
          type="button"
          variant="secondary"
          onClick={() => onChange(matchType, [...rules, { ...EMPTY_RULE }])}
        >
          Agregar regla
        </Button>
      </div>
    </div>
  );
}
