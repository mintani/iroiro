"use client";

import React from "react";
import { Unit } from "./unit";

export const RightColumn: React.FC = () => {
  return (
    <div className="grid h-full min-h-0 w-full auto-rows-[minmax(0,1fr)] grid-cols-2 gap-2 overflow-auto">
      {/* Top small modules */}
      <Unit variant="contrast" size="sm" allowedKinds={["sphere", "contrast", "pie", "theme"]} />
      <Unit variant="pie" size="sm" allowedKinds={["sphere", "contrast", "pie", "theme"]} />

      {/* Middle: one large full-width temp pool (only large module) */}
      <div className="col-span-2 row-span-2 min-h-0">
        <Unit variant="pool" size="lg" allowedKinds={["pool"]} />
      </div>

      {/* Bottom small modules */}
      <Unit variant="sphere" size="sm" allowedKinds={["sphere", "contrast", "pie", "theme"]} />
      <Unit variant="theme" size="sm" allowedKinds={["sphere", "contrast", "pie", "theme"]} />
      <Unit variant="empty" size="sm" allowedKinds={["sphere", "contrast", "pie", "theme"]} />
      <Unit variant="empty" size="sm" allowedKinds={["sphere", "contrast", "pie", "theme"]} />
    </div>
  );
};
