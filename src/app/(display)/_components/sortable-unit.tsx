"use client";

import { useSortable } from "@dnd-kit/sortable";
import { CSS } from "@dnd-kit/utilities";
import React from "react";
import { Unit } from "./unit";

type SortableUnitProps = {
  id: string;
  variant: "source" | "sampler" | "effect-adjustment" | "effect-shifter" | "empty";
};

export const SortableUnit: React.FC<SortableUnitProps> = ({ id, variant }) => {
  const { attributes, listeners, setNodeRef, transform, transition, isDragging } = useSortable({
    id,
  });

  const style = {
    transform: CSS.Transform.toString(transform),
    transition,
    opacity: isDragging ? 0.5 : 1,
  };

  return (
    <div ref={setNodeRef} style={style} {...attributes} {...listeners}>
      <Unit
        variant={variant}
        size="lg"
        allowedKinds={["source", "sampler", "effect-adjustment", "effect-shifter"]}
      />
    </div>
  );
};
