export function serialize(value: unknown): Value {
  if (value === undefined) {
    return UNDEFINED;
  }
  if (
    value === null ||
    typeof value === "boolean" ||
    typeof value === "string" ||
    typeof value === "number"
  ) {
    return literal(value);
  }
  if (typeof value === "function") {
    return FUNCTION;
  }
  if (Array.isArray(value)) {
    return array(value.map(serialize));
  }
  if (typeof value === "object" && value.constructor === Object) {
    return object(
      Object.fromEntries(
        Object.entries(value).map(([key, value]) => [key, serialize(value)])
      )
    );
  }
  return UNKNOWN;
}

export type Value =
  | ArrayValue
  | FunctionValue
  | LiteralValue
  | ObjectValue
  | UndefinedValue
  | UnknownValue;

export type ArrayValue = {
  kind: "array";
  items: Value[];
};

function array(items: Value[]): ArrayValue {
  return {
    kind: "array",
    items,
  };
}

const FUNCTION = { kind: "function" } as const;

export type FunctionValue = typeof FUNCTION;

export type LiteralValue = {
  kind: "literal";
  value: any; // must be serializable (e.g. not a function)
};

function literal(value: any): LiteralValue {
  return {
    kind: "literal",
    value,
  };
}

export type ObjectValue = {
  kind: "object";
  entries: Record<string, Value>;
};

function object(entries: Record<string, Value>): ObjectValue {
  return {
    kind: "object",
    entries,
  };
}

const UNDEFINED = { kind: "undefined" } as const;

export type UndefinedValue = typeof UNDEFINED;

const UNKNOWN = { kind: "unknown" } as const;

export type UnknownValue = typeof UNKNOWN;
