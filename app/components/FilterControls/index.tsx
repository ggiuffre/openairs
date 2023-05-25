import React from "react";
import styles from "./styles.module.css";
import {
  type SortMethod,
  type MusicType,
  sortMethods,
  musicTypes,
} from "@/app/data/types";

interface Props {
  sortMethod: SortMethod;
  setSortMethod: React.Dispatch<React.SetStateAction<SortMethod>>;
  selectedMusicTypes: Set<MusicType>;
  setSelectedMusicTypes: React.Dispatch<React.SetStateAction<Set<MusicType>>>;
}

export const FilterControls: React.FC<Props> = ({
  sortMethod,
  setSortMethod,
  selectedMusicTypes,
  setSelectedMusicTypes,
}) => (
  <div className={styles.filters}>
    <p>
      <label>
        sort by{" "}
        <select
          value={sortMethod}
          onChange={(e) => {
            const targetValue = e.target.value as SortMethod;
            setSortMethod(targetValue);
          }}
        >
          {sortMethods.map((sortMethod) => (
            <option key={sortMethod} value={sortMethod}>
              {sortMethod}
            </option>
          ))}
        </select>
      </label>
    </p>
    <p>
      include{" "}
      {musicTypes
        .map<React.ReactNode>((tag) => (
          <span
            key={tag}
            className="tag"
            style={{
              cursor: "pointer",
              opacity: selectedMusicTypes.has(tag) ? 1 : 0.3,
            }}
            onClick={() => {
              if (selectedMusicTypes.has(tag)) {
                const newSet = selectedMusicTypes;
                selectedMusicTypes.delete(tag);
                setSelectedMusicTypes(new Set(newSet));
              } else {
                setSelectedMusicTypes((tags) => new Set(tags.add(tag)));
              }
            }}
          >
            {tag}
          </span>
        ))
        .reduce((prev, curr) => [prev, " ", curr])}
    </p>
  </div>
);
