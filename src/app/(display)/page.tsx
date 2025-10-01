"use client";

import { ResizableHandle, ResizablePanel, ResizablePanelGroup } from "@/components/ui/resizable";
import { DndContext, DragEndEvent, DragOverlay, DragStartEvent } from "@dnd-kit/core";
import { arrayMove, rectSortingStrategy, SortableContext } from "@dnd-kit/sortable";
import { useEffect, useState } from "react";
import { RightColumn } from "./_components/right-column";
import { SortableUnit } from "./_components/sortable-unit";
import { Unit } from "./_components/unit";

type UnitConfig = {
  id: string;
  variant: "source" | "sampler" | "effect-adjustment" | "effect-shifter" | "empty";
};

export default function AboutPage() {
  const [units, setUnits] = useState<UnitConfig[]>([
    { id: "unit-0", variant: "source" },
    { id: "unit-1", variant: "sampler" },
    { id: "unit-2", variant: "effect-adjustment" },
    { id: "unit-3", variant: "effect-shifter" },
    { id: "unit-4", variant: "sampler" },
    { id: "unit-5", variant: "empty" },
  ]);

  const [activeId, setActiveId] = useState<string | null>(null);
  const [isMounted, setIsMounted] = useState(false);

  useEffect(() => {
    setIsMounted(true);
  }, []);

  const handleDragStart = (event: DragStartEvent) => {
    setActiveId(event.active.id as string);
  };

  const handleDragEnd = (event: DragEndEvent) => {
    const { active, over } = event;

    if (over && active.id !== over.id) {
      setUnits((items) => {
        const oldIndex = items.findIndex((item) => item.id === active.id);
        const newIndex = items.findIndex((item) => item.id === over.id);
        return arrayMove(items, oldIndex, newIndex);
      });
    }

    setActiveId(null);
  };

  const activeUnit = units.find((unit) => unit.id === activeId);

  return (
    <div className="flex h-screen bg-gradient-to-br from-background via-background to-muted/20">
      <ResizablePanelGroup direction="horizontal" className="flex h-full min-h-0">
        <ResizablePanel minSize={50} defaultSize={70} className="bg-grid h-full min-h-0 grow-7">
          {isMounted ? (
            <DndContext onDragStart={handleDragStart} onDragEnd={handleDragEnd}>
              <SortableContext items={units} strategy={rectSortingStrategy}>
                <div className="col-span-2 grid h-full grid-cols-2 grid-rows-3 gap-2 p-5">
                  {units.map((unit) => (
                    <SortableUnit key={unit.id} id={unit.id} variant={unit.variant} />
                  ))}
                </div>
              </SortableContext>
              <DragOverlay>
                {activeUnit ? (
                  <div className="opacity-50">
                    <Unit
                      variant={activeUnit.variant}
                      size="lg"
                      allowedKinds={["source", "sampler", "effect-adjustment", "effect-shifter"]}
                    />
                  </div>
                ) : null}
              </DragOverlay>
            </DndContext>
          ) : (
            <div className="col-span-2 grid h-full grid-cols-2 grid-rows-3 gap-2 p-5">
              {units.map((unit) => (
                <div key={unit.id}>
                  <Unit
                    variant={unit.variant}
                    size="lg"
                    allowedKinds={["source", "sampler", "effect-adjustment", "effect-shifter"]}
                  />
                </div>
              ))}
            </div>
          )}
        </ResizablePanel>
        <ResizableHandle withHandle />
        <ResizablePanel
          minSize={25}
          defaultSize={30}
          className="h-full min-h-0 bg-muted/70 backdrop-blur"
        >
          <div className="h-full min-h-0 w-full p-5">
            <RightColumn />
          </div>
        </ResizablePanel>
      </ResizablePanelGroup>
    </div>
  );
}
