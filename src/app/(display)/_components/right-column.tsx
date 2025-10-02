"use client";

import React from "react";
import { Unit } from "./unit";

export const RightColumn: React.FC = () => {
  return (
    <div className="grid h-full min-h-0 w-full auto-rows-[minmax(0,1fr)] grid-cols-2 gap-2">
      <Unit variant="contrast" size="sm" allowedKinds={["sphere", "contrast", "pie", "theme"]} />
      <Unit variant="pie" size="sm" allowedKinds={["sphere", "contrast", "pie", "theme"]} />
      <div className="col-span-2 row-span-2 min-h-0">
        <Unit variant="pool" size="lg" allowedKinds={["pool"]} />
      </div>
      <Unit variant="sphere" size="sm" allowedKinds={["sphere", "contrast", "pie", "theme"]} />
      <Unit variant="theme" size="sm" allowedKinds={["sphere", "contrast", "pie", "theme"]} />
      <Unit variant="empty" size="sm" allowedKinds={["sphere", "contrast", "pie", "theme"]} />
      <Unit variant="empty" size="sm" allowedKinds={["sphere", "contrast", "pie", "theme"]} />
    </div>
  );
};
