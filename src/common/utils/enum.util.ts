export function enumKeys<O extends object, K extends keyof O = keyof O>(obj: O): K[] {
  return Object.keys(obj).filter((k) => Number.isNaN(+k)) as K[];
}

export function enumValuesToObject<T>(enumObj: T): { [index: string]: T[keyof T] } {
  const enum_values = Object.values(enumObj);
  return Object.assign({}, ...enum_values.map((_) => ({ [_]: _ })));
}
