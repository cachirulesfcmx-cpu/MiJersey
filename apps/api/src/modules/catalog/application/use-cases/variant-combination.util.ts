/** Normaliza un conjunto de IDs de valor de opción para que el orden de entrada no importe. */
export function computeCombinationKey(optionValueIds: string[]): string {
  return optionValueIds.slice().sort().join(',');
}

/** Producto cartesiano de los valores de cada opción, un valor por opción. */
export function cartesianProduct<T>(groups: T[][]): T[][] {
  return groups.reduce<T[][]>(
    (acc, group) => acc.flatMap((combo) => group.map((value) => [...combo, value])),
    [[]],
  );
}
