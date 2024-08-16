import React from "react";
import Image from "next/image";

interface Props<T> {
  label?: string;
  availableOptions: readonly T[];
  selectedOptions: Set<T>;
  setSelectedOptions: React.Dispatch<React.SetStateAction<Set<T>>>;
  all?: string;
  keysPrefix?: string;
  getIconPath?: (option: T) => string;
  iconPathAll?: string;
}

export function InlineCheckboxGroup<T>({
  label = "include",
  availableOptions,
  selectedOptions,
  setSelectedOptions,
  all = "all",
  keysPrefix = "",
  getIconPath,
  iconPathAll,
}: Props<T>) {
  return (
    <p style={{ maxWidth: "85%" }}>
      {label}{" "}
      {availableOptions
        .filter((tag) => tag !== "all")
        .map<React.ReactNode>((tag) => (
          <span
            key={`${keysPrefix}${tag}`}
            className="tag"
            style={{
              cursor: "pointer",
              opacity: selectedOptions.has(tag) ? 1 : 0.3,
              display: "inline-block",
              lineHeight: "1rem",
            }}
            onClick={() => {
              if (selectedOptions.has(tag)) {
                if (selectedOptions.size === 1) {
                  setSelectedOptions(new Set(availableOptions));
                } else if (selectedOptions.size === availableOptions.length) {
                  setSelectedOptions(new Set([tag]));
                } else {
                  const newSet = selectedOptions;
                  newSet.delete(tag);
                  setSelectedOptions(new Set(newSet));
                }
              } else {
                setSelectedOptions((values) => new Set(values.add(tag)));
              }
            }}
          >
            {getIconPath && (
              <Image
                src={getIconPath(tag)}
                alt={`${tag}`}
                height={10}
                width={10}
              />
            )}
            {getIconPath && " "}
            {`${tag}`}
          </span>
        ))
        .reduce((prev, curr) => [prev, " ", curr])}{" "}
      <span
        key={`${keysPrefix}all`}
        className="tag"
        style={{
          cursor: "pointer",
          opacity: selectedOptions.size === availableOptions.length ? 1 : 0.35,
        }}
        onClick={() => setSelectedOptions(new Set(availableOptions))}
      >
        {iconPathAll && (
          <Image src={iconPathAll} alt={all} height={10} width={10} />
        )}
        {iconPathAll && " "}
        {all}
      </span>
    </p>
  );
}
