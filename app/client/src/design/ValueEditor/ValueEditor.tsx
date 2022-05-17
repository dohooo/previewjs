import {
  ArrayType,
  CollectedTypes,
  dereferenceType,
  EnumType,
  FunctionType,
  IntersectionType,
  LiteralType,
  MapType,
  NamedType,
  ObjectType,
  PromiseType,
  RecordType,
  SetType,
  UnionType,
  ValueType,
} from "@previewjs/type-analyzer";
import assertNever from "assert-never";
import clsx from "clsx";
import React, { Fragment, useState } from "react";
import TextAreaAutosize from "react-textarea-autosize";
import { generateSerializableValue } from "../../generators/generate-serializable-value";
import {
  array,
  EMPTY_ARRAY,
  EMPTY_OBJECT,
  FALSE,
  fn,
  map,
  number,
  object,
  promise,
  SerializableArrayValue,
  SerializableMapValue,
  SerializableObjectValue,
  SerializableSetValue,
  SerializableStringValue,
  SerializableValue,
  set,
  string,
  TRUE,
  UNDEFINED,
  UNKNOWN,
  unknown,
} from "../../generators/serializable-value";
import { serializableValueToJavaScript } from "../../generators/serializable-value-to-js";

export const ValueEditor = ({
  type,
  types,
  value,
  onChange,
}: {
  type: ValueType;
  types: CollectedTypes;
  value: SerializableValue;
  onChange: (value: SerializableValue) => void;
}) => {
  switch (type.kind) {
    case "any":
      return <AnyEditor value={value} onChange={onChange} />;
    case "array":
      return (
        <ArrayEditor
          type={type}
          types={types}
          value={value}
          onChange={onChange}
        />
      );
    case "boolean":
      return <BooleanEditor value={value} onChange={onChange} />;
    case "enum":
      return <EnumEditor type={type} value={value} onChange={onChange} />;
    case "function":
      return (
        <FunctionEditor
          type={type}
          types={types}
          value={value}
          onChange={onChange}
        />
      );
    case "intersection":
      return (
        <IntersectionEditor type={type} value={value} onChange={onChange} />
      );
    case "literal":
      return <LiteralEditor type={type} value={value} onChange={onChange} />;
    case "map":
      return (
        <MapEditor
          type={type}
          types={types}
          value={value}
          onChange={onChange}
        />
      );
    case "name":
      return (
        <NameEditor
          type={type}
          types={types}
          value={value}
          onChange={onChange}
        />
      );
    case "never":
      return <NeverEditor />;
    case "node":
      return <StringEditor value={value} onChange={onChange} />;
    case "null":
      return <Constant label="null" />;
    case "number":
      return <NumberEditor value={value} onChange={onChange} />;
    case "object":
      return (
        <ObjectEditor
          type={type}
          types={types}
          value={value}
          onChange={onChange}
        />
      );
    case "optional":
      return (
        <UnionEditor
          type={{ kind: "union", types: [{ kind: "void" }, type.type] }}
          types={types}
          value={value}
          onChange={onChange}
        />
      );
    case "promise":
      return (
        <PromiseEditor
          type={type}
          types={types}
          value={value}
          onChange={onChange}
        />
      );
    case "record":
      return (
        <RecordEditor
          type={type}
          types={types}
          value={value}
          onChange={onChange}
        />
      );
    case "set":
      return (
        <SetEditor
          type={type}
          types={types}
          value={value}
          onChange={onChange}
        />
      );
    case "string":
      return <StringEditor value={value} onChange={onChange} />;
    case "union":
      return (
        <UnionEditor
          type={type}
          types={types}
          value={value}
          onChange={onChange}
        />
      );
    case "unknown":
      return <UnknownEditor value={value} onChange={onChange} />;
    case "void":
      return <Constant label="undefined" />;
    default:
      throw assertNever(type);
  }
};

const AnyEditor = ({
  value,
  onChange,
}: {
  value: SerializableValue;
  onChange: (value: SerializableValue) => void;
}) => <Unknown label="Any type" value={value} onChange={onChange} />;

const ArrayEditor = ({
  type,
  types,
  value: inputValue,
  onChange,
}: {
  type: ArrayType;
  types: CollectedTypes;
  value: SerializableValue;
  onChange: (value: SerializableArrayValue) => void;
}) => {
  const value = inputValue.kind === "array" ? inputValue : EMPTY_ARRAY;
  const addItem = () => {
    onChange(array([...value.items, generateSerializableValue(type, types)]));
  };
  const removeItem = (i: number) => () => {
    onChange(array([...value.items.slice(0, i), ...value.items.slice(i + 1)]));
  };
  return (
    <div className="flex-grow flex flex-col gap-2">
      {value.items.length === 0 && (
        <div className="bg-gray-100 rounded-md p-2">Empty list</div>
      )}
      {value.items.map((item, i) => (
        <div
          key={i}
          className="border-2 border-gray-200 rounded-md p-2 flex flex-row"
        >
          <ValueEditor
            type={type.items}
            types={types}
            value={item}
            onChange={(item) =>
              onChange(
                array([
                  ...value.items.slice(0, i),
                  item,
                  ...value.items.slice(i + 1),
                ])
              )
            }
          />
          <button
            className="p-2 rounded-md hover:bg-gray-200"
            onClick={removeItem(i)}
          >
            -
          </button>
        </div>
      ))}
      <button className="p-2 rounded-md hover:bg-gray-200" onClick={addItem}>
        +
      </button>
    </div>
  );
};

const BooleanEditor = ({
  value,
  onChange,
}: {
  value: SerializableValue;
  onChange: (value: SerializableValue) => void;
}) => {
  const checked = value.kind === "boolean" && value.value;
  return (
    <div className="grid grid-cols-2">
      <button
        className={clsx([
          "rounded-md",
          !checked ? "bg-gray-300 text-black" : "",
        ])}
        onClick={() => onChange(FALSE)}
      >
        False
      </button>
      <button
        className={clsx([
          "rounded-md",
          checked ? "bg-gray-800 text-white" : "",
        ])}
        onClick={() => onChange(TRUE)}
      >
        True
      </button>
    </div>
  );
};

const EnumEditor = ({
  type,
  value,
  onChange,
}: {
  type: EnumType;
  value: SerializableValue;
  onChange: (value: SerializableValue) => void;
}) => {
  const selectedKey = Object.entries(type.options)
    .filter(
      ([_, optionValue]) =>
        (value.kind === "string" || value.kind === "number") &&
        value.value === optionValue
    )
    .map(([key]) => key)[0];
  return (
    <select
      className="appearance-none w-full bg-white p-1.5 rounded-md outline-none"
      value={selectedKey}
      onChange={(e) => {
        const value = type.options[e.target.value];
        if (typeof value === "string") {
          onChange(string(value));
        } else if (typeof value === "number") {
          onChange(number(value));
        } else {
          // This should not happen. Ignore.
        }
      }}
    >
      {Object.keys(type.options).map((key) => (
        <option key={key} value={key}>
          {key}
        </option>
      ))}
    </select>
  );
};

const FunctionEditor = ({
  type,
  types,
  value,
  onChange,
}: {
  type: FunctionType;
  types: CollectedTypes;
  value: SerializableValue;
  onChange: (value: SerializableValue) => void;
}) => {
  return (
    <div className="flex flex-row">
      <pre className="p-3 border-2 border-transparent">() =&gt; </pre>
      <div className="border-2 border-gray-200 rounded-md p-1 flex flex-row flex-grow">
        <ValueEditor
          type={type.returnType}
          types={types}
          value={value.kind === "function" ? value.returnValue : UNKNOWN}
          onChange={(returnValue) => onChange(fn(returnValue))}
        />
      </div>
    </div>
  );
};

const IntersectionEditor = ({
  type,
  value,
  onChange,
}: {
  type: IntersectionType;
  value: SerializableValue;
  onChange: (value: SerializableValue) => void;
}) => {
  return (
    <Unknown
      label="Unsupported type (intersection)"
      value={value}
      onChange={onChange}
    />
  );
};

const LiteralEditor = ({
  type,
}: {
  type: LiteralType;
  value: SerializableValue;
  onChange: (value: SerializableValue) => void;
}) => {
  return <Constant label={JSON.stringify(type.value)} />;
};

const Constant = ({ label }: { label: string }) => (
  // TODO: Consider showing an error if value doesn't match.
  <pre className="bg-gray-100 flex-grow flex flex-row items-center px-2">
    {label}
  </pre>
);

const MapEditor = ({
  type,
  types,
  value,
  onChange,
}: {
  type: MapType;
  types: CollectedTypes;
  value: SerializableValue;
  onChange: (value: SerializableMapValue) => void;
}) => {
  return (
    <RecordEditor
      type={{ kind: "record", keys: type.keys, values: type.keys }}
      types={types}
      value={value.kind === "map" ? value.values : EMPTY_OBJECT}
      onChange={(recordValue) => onChange(map(recordValue))}
    />
  );
};

const NameEditor = ({
  type,
  types,
  value,
  onChange,
}: {
  type: NamedType;
  types: CollectedTypes;
  value: SerializableValue;
  onChange: (value: SerializableValue) => void;
}) => {
  const [foundType] = dereferenceType(type, types, []);
  if (foundType.kind === "unknown") {
    return (
      <Unknown
        label={`Unknown type (${type.name})`}
        value={value}
        onChange={onChange}
      />
    );
  }
  return (
    <ValueEditor
      type={foundType}
      types={types}
      value={value}
      onChange={onChange}
    />
  );
};

const NeverEditor = () => <div></div>;

const NumberEditor = ({
  value,
  onChange,
}: {
  value: SerializableValue;
  onChange: (value: SerializableValue) => void;
}) => {
  const numberValue = value.kind === "number" ? value.value : undefined;
  return (
    <div>
      <input
        type="number"
        value={numberValue}
        onChange={(e) => onChange(number(parseFloat(e.target.value)))}
        className="block p-1 w-full outline-none"
      />
      <input
        type="range"
        min="0"
        max="100"
        value={numberValue}
        onChange={(e) => onChange(number(parseFloat(e.target.value)))}
        className="block p-1 w-full outline-none"
      />
    </div>
  );
};

const ObjectEditor = ({
  type,
  types,
  value,
  onChange,
}: {
  type: ObjectType;
  types: CollectedTypes;
  value: SerializableValue;
  onChange: (value: SerializableValue) => void;
}) => {
  if (!Object.keys(type.fields).length) {
    return <pre>{"{}"}</pre>;
  }
  return (
    <div className="grid grid-cols-12 gap-2 p-1 flex-grow">
      {Object.entries(type.fields).map(([fieldName, fieldType]) => (
        <ObjectFieldEditor
          key={fieldName}
          fieldName={fieldName}
          fieldType={fieldType}
          types={types}
          value={
            value.kind === "object"
              ? value.entries
                  .filter(
                    (e) => e.key.kind === "string" && e.key.value === fieldName
                  )
                  .map((e) => e.value)[0] || UNDEFINED
              : UNKNOWN
          }
          onChange={(fieldValue) =>
            onChange(
              object([
                ...(value.kind === "object"
                  ? value.entries.filter(
                      (e) =>
                        e.key.kind !== "string" || e.key.value !== fieldName
                    )
                  : []),
                ...(fieldValue.kind === "undefined"
                  ? []
                  : [
                      {
                        key: string(fieldName),
                        value: fieldValue,
                      },
                    ]),
              ])
            )
          }
        />
      ))}
    </div>
  );
};

const ObjectFieldEditor = ({
  fieldName,
  fieldType,
  types,
  value,
  onChange,
}: {
  fieldName: string;
  fieldType: ValueType;
  types: CollectedTypes;
  value: SerializableValue;
  onChange: (value: SerializableValue) => void;
}) => {
  const optional = fieldType.kind === "optional";
  const [forceChecked, setForceChecked] = useState(false);
  const checked = !optional || value.kind !== "undefined" || forceChecked;
  const onCheckChange = (checked: boolean) => {
    if (fieldType.kind !== "optional") {
      return;
    }
    if (checked) {
      onChange(generateSerializableValue(fieldType.type, types));
      setForceChecked(true);
    } else {
      onChange(UNDEFINED);
      setForceChecked(false);
    }
  };
  const type = optional
    ? checked
      ? fieldType.type
      : ({ kind: "never" } as const)
    : fieldType;
  return (
    <Fragment key={fieldName}>
      <div
        className={clsx(
          "p-1 text-right truncate",
          optional && "cursor-default"
        )}
        title={fieldName}
        onClick={optional ? () => onCheckChange(!checked) : undefined}
      >
        {fieldType.kind === "optional" && (
          <>
            <input
              type="checkbox"
              checked={checked}
              onChange={(e) => onCheckChange(e.target.checked)}
            />{" "}
          </>
        )}
        {fieldName}
      </div>
      {checked ? (
        <div className="col-span-11 border-2 border-gray-200 p-1 rounded-lg">
          <ValueEditor
            type={type}
            types={types}
            value={value}
            onChange={onChange}
          />
        </div>
      ) : (
        <div className="col-span-11" onClick={() => onCheckChange(true)}></div>
      )}
    </Fragment>
  );
};

const PromiseEditor = ({
  type,
  types,
  value,
  onChange,
}: {
  type: PromiseType;
  types: CollectedTypes;
  value: SerializableValue;
  onChange: (value: SerializableValue) => void;
}) => {
  return (
    <ValueEditor
      type={type.type}
      types={types}
      value={
        value.kind === "promise" && value.value.type === "resolve"
          ? value.value.value
          : UNKNOWN
      }
      onChange={(resolveValue) =>
        onChange(promise({ type: "resolve", value: resolveValue }))
      }
    />
  );
};

const RecordEditor = ({
  type,
  types,
  value: inputValue,
  onChange,
}: {
  type: RecordType;
  types: CollectedTypes;
  value: SerializableValue;
  onChange: (value: SerializableObjectValue) => void;
}) => {
  const value = inputValue.kind === "object" ? inputValue : EMPTY_OBJECT;
  const addItem = () => {
    onChange(
      object([
        ...value.entries,
        {
          key: generateSerializableValue(type.keys, types),
          value: generateSerializableValue(type.values, types),
        },
      ])
    );
  };
  const removeItem = (i: number) => () => {
    onChange(
      object([...value.entries.slice(0, i), ...value.entries.slice(i + 1)])
    );
  };
  return (
    <div className="flex-grow flex flex-col items-stretch">
      {value.entries.map((entry, i) => (
        <div
          key={i}
          className="border-2 border-gray-200 rounded-md p-2 mb-2 grid grid-cols-[1fr_1fr_auto]"
        >
          <ValueEditor
            type={type.keys}
            types={types}
            value={entry.key}
            onChange={(newKey) =>
              onChange(
                object([
                  ...value.entries.slice(0, i),
                  {
                    key: newKey,
                    value: entry.value,
                  },
                  ...value.entries.slice(i + 1),
                ])
              )
            }
          />
          <ValueEditor
            type={type.values}
            types={types}
            value={entry.value}
            onChange={(newValue) =>
              onChange(
                object([
                  ...value.entries.slice(0, i),
                  {
                    key: entry.key,
                    value: newValue,
                  },
                  ...value.entries.slice(i + 1),
                ])
              )
            }
          />
          <button
            className="p-2 rounded-md hover:bg-gray-200"
            onClick={removeItem(i)}
          >
            -
          </button>
        </div>
      ))}
      <button
        className="col-span-3 p-2 rounded-md hover:bg-gray-200"
        onClick={addItem}
      >
        +
      </button>
    </div>
  );
};

const SetEditor = ({
  type,
  types,
  value,
  onChange,
}: {
  type: SetType;
  types: CollectedTypes;
  value: SerializableValue;
  onChange: (value: SerializableSetValue) => void;
}) => {
  return (
    <ArrayEditor
      type={{ kind: "array", items: type.items }}
      types={types}
      value={value.kind === "set" ? value.values : EMPTY_ARRAY}
      onChange={(arrayValue) => onChange(set(arrayValue))}
    />
  );
};

const StringEditor = ({
  value,
  onChange,
}: {
  value: SerializableValue;
  onChange: (value: SerializableStringValue) => void;
}) => (
  <input
    type="text"
    className="block w-full outline-none"
    value={value.kind === "string" ? value.value : undefined}
    onChange={(e) => onChange(string(e.target.value))}
  />
);

const UnionEditor = ({
  type,
  types,
  value,
  onChange,
}: {
  type: UnionType;
  types: CollectedTypes;
  value: SerializableValue;
  onChange: (value: SerializableValue) => void;
}) => {
  // TODO: Choose the right type based on value.
  const [typeIndex, setTypeIndex] = useState(0);
  const currentType = type.types[typeIndex]!;
  return (
    <div className="flex-grow flex flex-col gap-2">
      {
        /*type.types.length <= 3 ? (
        <div className="flex flex-row flex-wrap justify-evenly gap-2">
          {type.types.map((type, i) => {
            const description = shortDescription(type);
            return (
              <button
                key={i}
                className={clsx(
                  "truncate flex-grow text-center text-sm rounded-md p-1 border-2 border-gray-200",
                  i === typeIndex ? "bg-white" : "bg-gray-200"
                )}
                title={description}
                onClick={() => {
                  setTypeIndex(i);
                  onChange(generateSerializableValue(type, types, false));
                }}
              >
                {description}
              </button>
            );
          })}
        </div>
      ) : */ <select
          className="appearance-none w-full bg-white p-1.5 rounded-md outline-none border-2 border-gray-200"
          onChange={(e) => {
            const i = parseInt(e.target.value);
            setTypeIndex(i);
            onChange(generateSerializableValue(type.types[i]!, types, false));
          }}
        >
          {type.types.map((type, i) => (
            <option key={i} value={i}>
              {shortDescription(type)}
            </option>
          ))}
        </select>
      }
      {currentType.kind !== "literal" && (
        <ValueEditor
          type={currentType}
          types={types}
          value={value}
          onChange={onChange}
        />
      )}
    </div>
  );
};

function shortDescription(type: ValueType): string {
  switch (type.kind) {
    case "any":
      return "any";
    case "array":
      return `${shortDescription(type.items)}[]`;
    case "boolean":
      return "boolean";
    case "enum":
      return `enum: ${Object.keys(type.options).join(", ")}`;
    case "function":
      return `() => ${shortDescription(type.returnType)}`;
    case "intersection":
      return "intersection";
    case "literal":
      return JSON.stringify(type.value);
    case "map":
      return `Map<${shortDescription(type.keys)}, ${shortDescription(
        type.values
      )}>`;
    case "name":
      const lastColumnPosition = type.name.lastIndexOf(":");
      return type.name.substring(lastColumnPosition + 1);
    case "never":
      return "never";
    case "node":
      return "node";
    case "null":
      return "null";
    case "number":
      return "number";
    case "object": {
      let text = "{";
      let i = 0;
      for (const [fieldName, fieldType] of Object.entries(type.fields)) {
        if (i > 0) {
          text += ", ";
        }
        text += fieldName;
        if (fieldType.kind === "literal") {
          text += `: ${JSON.stringify(fieldType.value)}`;
        }
        i++;
      }
      text += "}";
      return text;
    }
    case "optional":
      return `${shortDescription(type.type)}?`;
    case "promise":
      return `Promise<${shortDescription(type.type)}>`;
    case "record":
      return `Record<${shortDescription(type.keys)}, ${shortDescription(
        type.values
      )}>`;
    case "set":
      return `Set<${shortDescription(type.items)}>`;
    case "string":
      return "string";
    case "union":
      return type.types.map(shortDescription).join(" | ");
    case "unknown":
      return "unknown";
    case "void":
      return "void";
    default:
      throw assertNever(type);
  }
}

const UnknownEditor = ({
  value,
  onChange,
}: {
  value: SerializableValue;
  onChange: (value: SerializableValue) => void;
}) => <Unknown label="Unknown type" value={value} onChange={onChange} />;

const Unknown = ({
  label,
  value,
  onChange,
}: {
  label: string;
  value: SerializableValue;
  onChange: (value: SerializableValue) => void;
}) => (
  <div className="flex flex-col">
    <div className="text-gray-500 text-sm mb-1">{label}. Enter JS value:</div>
    <TextAreaAutosize
      className="code w-full bg-gray-800 text-white text-xs p-2 resize-none rounded-md"
      value={serializableValueToJavaScript(value)}
      onChange={(e: React.ChangeEvent<HTMLTextAreaElement>) =>
        onChange(unknown(e.target.value))
      }
    />
  </div>
);
