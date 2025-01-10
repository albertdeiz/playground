// eslint-disable-next-line @typescript-eslint/no-explicit-any
export type Arg = any;

export type DataType =
  | "undefined"
  | "null"
  | "number"
  | "string"
  | "date"
  | "object"
  | "array"
  | "circular"
  | "function"
  | "other";

export type LogArgument = {
  dataType: Exclude<DataType, 'object' | 'array'>;
  value: string;
} | {
  dataType: 'object',
  value: Record<string, LogArgument>,
} | {
  dataType: 'array',
  value: LogArgument[],
}

/** */
export const sanitizeArg = (item: Arg, seen: Set<Arg> = new Set()): LogArgument => {
  if (seen.has(item)) {
    return { dataType: "circular", value: "[Circular]" };
  }

  if (item === null) {
    return { dataType: "null", value: "null" };
  }

  if (item === undefined) {
    return { dataType: "undefined", value: "undefined" };
  }

  if (item.constructor.name === 'Number') {
    return { dataType: "number", value: `${item}` };
  }

  if (item.constructor.name === 'String') {
    return { dataType: "string", value: `"${item}"` };
  }

  if (item.constructor.name === 'Date') {
    return { dataType: "date", value: item.toString() };
  }

  if (item.constructor.name === 'Object' || item.constructor.name === 'Array') {
    seen.add(item);
  }

  if (item.constructor.name === 'Array') {
    const value = item.map((arg: Arg) => sanitizeArg(arg, seen)); // Recursivo con dataType
    return { dataType: "array", value };
  }

  if (item.constructor.name === 'Object') {
    const value = Object.entries(item).reduce((acc, [key, val]) => {
      acc[key] = sanitizeArg(val, seen); // Recursivo con dataType
      return acc;
    }, {} as Record<string, LogArgument>);

    return { dataType: "object", value };
  }

  if (item.constructor.name === 'Function') {
    const name = item.name || "anonymous";
    return { dataType: "function", value: `[Function: ${name}]` };
  }

  return {
    dataType: "other",
    value: item.toString(),
  };
};