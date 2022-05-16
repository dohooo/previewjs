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
  UNKNOWN,
  unknown,
} from "../../generators/serializable-value";

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
    <div className="flex-grow flex flex-col">
      {value.items.map((item, i) => (
        <div
          key={i}
          className="border-2 border-gray-200 rounded-md p-2 mb-2 flex flex-row"
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
  <div className="bg-gray-100 rounded-mg">{label}</div>
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
    <div className="grid grid-cols-12 gap-2 p-1">
      {Object.entries(type.fields).map(([fieldName, fieldType]) => (
        <ObjectFieldEditor
          fieldName={fieldName}
          fieldType={fieldType}
          types={types}
          value={
            value.kind === "object"
              ? value.entries[fieldName] || UNKNOWN
              : UNKNOWN
          }
          onChange={(fieldValue) =>
            onChange(
              object({
                ...(value.kind === "object" ? value.entries : {}),
                [fieldName]: fieldValue,
              })
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
  const [checked, setChecked] = useState(false);
  const type =
    fieldType.kind === "optional"
      ? checked
        ? fieldType.type
        : ({ kind: "never" } as const)
      : fieldType;
  return (
    <Fragment key={fieldName}>
      <div className="col-span-2 p-1 text-right truncate">{fieldName}</div>
      <div
        onClick={() => setChecked(!checked)}
        className="flex justify-center p-3"
      >
        {fieldType.kind === "optional" && (
          <input
            type="checkbox"
            checked={checked}
            onChange={(e) => setChecked(e.target.checked)}
          />
        )}
      </div>
      <div className="col-span-9 border-2 border-gray-200 p-1 rounded-lg">
        <ValueEditor
          type={type}
          types={types}
          value={value}
          onChange={onChange}
        />
      </div>
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
      object(
        Object.fromEntries([
          ...Object.entries(value.entries),
          [
            generateSerializableValue(type.keys, types),
            generateSerializableValue(type.values, types),
          ],
        ])
      )
    );
  };
  const removeItem = (i: number) => () => {
    onChange(array([...value.items.slice(0, i), ...value.items.slice(i + 1)]));
  };
  return (
    <div className="flex-grow flex flex-col">
      {items.map((item, i) => (
        <div
          key={i}
          className="border-2 border-gray-200 rounded-md p-2 mb-2 grid grid-cols-[1fr_1fr_auto]"
        >
          <ValueEditor type={type.keys} types={types} onChange={} />
          <ValueEditor type={type.values} types={types} />
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
  const [typeIndex, setTypeIndex] = useState(0);
  return (
    <div>
      {type.types.length <= 3 ? (
        <div className="flex flex-row justify-evenly gap-2 mb-2">
          {type.types.map((type, i) => (
            <button
              key={i}
              className={clsx(
                "truncate flex-grow text-center rounded-md p-1 border-2 border-gray-200",
                i === typeIndex ? "bg-white" : "bg-gray-200"
              )}
              onClick={() => setTypeIndex(i)}
            >
              {shortDescription(type)}
            </button>
          ))}
        </div>
      ) : (
        <select
          className="appearance-none w-full bg-white p-1.5 rounded-md outline-none border-2 border-gray-200 mb-2"
          onChange={(e) => setTypeIndex(parseInt(e.target.value))}
        >
          {type.types.map((type, i) => (
            <option key={i} value={i}>
              {shortDescription(type)}
            </option>
          ))}
        </select>
      )}
      <ValueEditor type={type.types[typeIndex]!} types={types} />
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
      return type.name;
    case "never":
      return "never";
    case "node":
      return "node";
    case "null":
      return "null";
    case "number":
      return "number";
    case "object":
      return `{ ${Object.keys(type.fields).join(", ")} }`;
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
      value={value}
      onChange={(e: React.ChangeEvent<HTMLTextAreaElement>) =>
        onChange(unknown(e.target.value))
      }
    />
  </div>
);
