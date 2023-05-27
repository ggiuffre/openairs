import React, { useState } from "react";
import Image from "next/image";
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
  const [isExpanded, setIsExpanded] = useState(false);
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
        title="show more filters"
        onClick={() => setIsExpanded((value) => !value)}
      >
        {isExpanded ? <ChevronUp /> : <ChevronDown />}
      </button>
      {isExpanded && (
        <>
          <p style={{ maxWidth: "85%" }}>
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
          <p>
            In cantons{" "}
            {[...cantons]
              .sort()
              .map<React.ReactNode>((canton) => (
                <span
                  key={`canton-${canton}`}
                  className="tag"
                  style={{
                    cursor: "pointer",
                    opacity: selectedCantons.has(canton) ? 1 : 0.3,
                    display: "inline-block",
                    lineHeight: "1rem",
                  }}
                  onClick={() => {
                    if (selectedCantons.has(canton)) {
                      const newSet = selectedCantons;
                      selectedCantons.delete(canton);
                      setSelectedCantons(new Set(newSet));
                    } else {
                      setSelectedCantons(
                        (cantons) => new Set(cantons.add(canton))
                      );
                    }
                  }}
                >
                  <Image
                    src={`/flags/${canton.toLowerCase()}.svg`}
                    alt={`Flag of canton ${canton}`}
                    height={10}
                    width={10}
                  />{" "}
                  {canton}
                </span>
              ))
              .reduce((prev, curr) => [prev, " ", curr])}
          </p>
        </>
      )}
    </div>
  );
};
