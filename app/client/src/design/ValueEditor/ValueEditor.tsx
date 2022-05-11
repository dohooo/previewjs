import {
  ArrayType,
  EnumType,
  FunctionType,
  LiteralType,
  ObjectType,
  ValueType,
} from "@previewjs/type-analyzer";
import assertNever from "assert-never";
import clsx from "clsx";
import React, { Fragment, useState } from "react";

export const ValueEditor = ({ type }: { type: ValueType }) => {
  switch (type.kind) {
    case "any":
      throw new Error("not implemented");
    case "array":
      return <ArrayEditor type={type} />;
    case "boolean":
      return <BooleanEditor />;
    case "enum":
      return <EnumEditor type={type} />;
    case "function":
      return <FunctionEditor type={type} />;
    case "intersection":
      throw new Error("not implemented");
    case "literal":
      return <LiteralEditor type={type} />;
    case "map":
      throw new Error("not implemented");
    case "name":
      throw new Error("not implemented");
    case "never":
      return <div></div>;
    case "node":
      throw new Error("not implemented");
    case "null":
      return <Constant label="null" />;
    case "number":
      return <NumberEditor />;
    case "object":
      return <ObjectEditor type={type} />;
    case "optional":
      throw new Error("not implemented");
    case "promise":
      throw new Error("not implemented");
    case "record":
      throw new Error("not implemented");
    case "set":
      throw new Error("not implemented");
    case "string":
      return <StringEditor />;
    case "union":
      throw new Error("not implemented");
    case "unknown":
      throw new Error("not implemented");
    case "void":
      return <Constant label="undefined" />;
    default:
      throw assertNever(type);
  }
};

const ArrayEditor = ({ type }: { type: ArrayType }) => {
  const [items, setItems] = useState<any[]>([]);
  const addItem = () => {
    setItems([...items, {}]);
  };
  const removeItem = (i: number) => () => {
    setItems([...items.slice(0, i), ...items.slice(i + 1)]);
  };
  return (
    <div className="flex-grow flex flex-col">
      {items.map((item, i) => (
        <div
          key={i}
          className="border-2 border-gray-200 rounded-md p-2 mb-2 flex flex-row"
        >
          <ValueEditor type={type.items} />
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

const BooleanEditor = () => {
  const [checked, setChecked] = useState(false);
  return (
    <div className="grid grid-cols-2">
      <button
        className={clsx([
          "rounded-md",
          !checked ? "bg-gray-300 text-black" : "",
        ])}
        onClick={() => setChecked(false)}
      >
        False
      </button>
      <button
        className={clsx([
          "rounded-md",
          checked ? "bg-gray-800 text-white" : "",
        ])}
        onClick={() => setChecked(true)}
      >
        True
      </button>
    </div>
  );
};

const EnumEditor = ({ type }: { type: EnumType }) => {
  return (
    <select className="appearance-none w-full bg-white p-1.5 rounded-md outline-none">
      {Object.keys(type.options).map((key) => (
        <option key={key}>{key}</option>
      ))}
    </select>
  );
};

const FunctionEditor = ({ type }: { type: FunctionType }) => {
  return (
    <div className="flex flex-row">
      <pre className="p-3 border-2 border-transparent">() =&gt; </pre>
      <div className="border-2 border-gray-200 rounded-md p-1 flex flex-row flex-grow">
        <ValueEditor type={type.returnType} />
      </div>
    </div>
  );
};

const LiteralEditor = ({ type }: { type: LiteralType }) => {
  return <Constant label={JSON.stringify(type.value)} />;
};

const Constant = ({ label }: { label: string }) => (
  <div className="bg-gray-100 rounded-mg">{label}</div>
);

const NumberEditor = () => {
  const [value, setValue] = useState(123);
  return (
    <div>
      <input
        type="number"
        value={value}
        onChange={(e) => setValue(parseFloat(e.target.value))}
        className="block p-1 w-full outline-none"
      />
      <input
        type="range"
        min="0"
        max="100"
        value={value}
        onChange={(e) => setValue(parseFloat(e.target.value))}
        className="block p-1 w-full outline-none"
      />
    </div>
  );
};

const ObjectEditor = ({ type }: { type: ObjectType }) => {
  if (!Object.keys(type.fields).length) {
    return <pre>{"{}"}</pre>;
  }
  return (
    <div className="grid grid-cols-12 gap-2 p-1">
      {Object.entries(type.fields).map(([fieldName, fieldType]) => (
        <ObjectFieldEditor fieldName={fieldName} fieldType={fieldType} />
      ))}
    </div>
  );
};

const ObjectFieldEditor = ({
  fieldName,
  fieldType,
}: {
  fieldName: string;
  fieldType: ValueType;
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
        <ValueEditor type={type} />
      </div>
    </Fragment>
  );
};

const StringEditor = () => (
  <input type="text" value="test" className="block w-full outline-none" />
);
