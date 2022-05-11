import clsx from "clsx";

export const VariantPicker = ({
  variants,
  currentVariant,
  children,
  onVariantSelected,
}: {
  variants: Array<{
    key: string;
    label: string;
  }>;
  currentVariant: string | null;
  children: React.ReactNode;
  onVariantSelected(key: string): void;
}) => (
  <div className="grid grid-cols-4 flex-grow">
    <ul>
      {variants.map((variant) => (
        <li
          key={variant.key}
          className={clsx([
            "truncate",
            currentVariant === variant.key ? "bg-red-200" : "",
          ])}
          onClick={() => onVariantSelected(variant.key)}
        >
          {variant.label}
        </li>
      ))}
    </ul>
    <div className="col-span-3">{children}</div>
  </div>
);
