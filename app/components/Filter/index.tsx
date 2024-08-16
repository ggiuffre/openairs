import React, { useState } from "react";
import styles from "./styles.module.css";
import {
  type Canton,
  type MusicType,
  type SortMethod,
  cantons,
  musicTypes,
  sortMethods,
} from "@/app/data/types";
import { ChevronDown, ChevronUp } from "react-feather";
import { InlineCheckboxGroup } from "../InlineCheckboxGroup";

interface Props {
  sortMethod: SortMethod;
  setSortMethod: React.Dispatch<React.SetStateAction<SortMethod>>;
  selectedMusicTypes: Set<MusicType>;
  setSelectedMusicTypes: React.Dispatch<React.SetStateAction<Set<MusicType>>>;
  selectedCantons: Set<Canton>;
  setSelectedCantons: React.Dispatch<React.SetStateAction<Set<Canton>>>;
}

export const Filter: React.FC<Props> = ({
  sortMethod,
  setSortMethod,
  selectedMusicTypes,
  setSelectedMusicTypes,
  selectedCantons,
  setSelectedCantons,
}) => {
  const [isExpanded, setIsExpanded] = useState(true);
  return (
    <div className={styles.filter}>
      <p style={{ maxWidth: "85%" }}>
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
      <button
        className={styles.moreFilters + " tag clickable"}
        title={isExpanded ? "show less filters" : "show more filters"}
        onClick={() => setIsExpanded((value) => !value)}
      >
        {isExpanded ? <ChevronUp /> : <ChevronDown />}
      </button>
      {isExpanded && (
        <>
          <InlineCheckboxGroup
            label="include"
            availableOptions={musicTypes}
            selectedOptions={selectedMusicTypes}
            setSelectedOptions={setSelectedMusicTypes}
            all="all"
            keysPrefix="music-type"
          />
          <InlineCheckboxGroup
            label="n cantons"
            availableOptions={[...cantons]}
            selectedOptions={selectedCantons}
            setSelectedOptions={setSelectedCantons}
            all="all cantons"
            keysPrefix="canton"
            getIconPath={(canton) => `/flags/${canton.toLowerCase()}.svg`}
            iconPathAll="/flags/ch.svg"
          />
        </>
      )}
    </div>
  );
};
