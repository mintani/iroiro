import { ResizableHandle, ResizablePanel, ResizablePanelGroup } from "@/components/ui/resizable";
import { RightColumn } from "./_components/right-column";
import { Unit } from "./_components/unit";
export default function AboutPage() {
  return (
    <div className="flex min-h-screen bg-gradient-to-br from-background via-background to-muted/20">
      <ResizablePanelGroup direction="horizontal" className="flex">
        <ResizablePanel minSize={50} defaultSize={70} className="bg-grid h-full grow-7">
          <div className="col-span-2 grid h-screen grid-cols-2 gap-2 p-5">
            <Unit
              variant="source"
              size="lg"
              allowedKinds={["source", "sampler", "effect-adjustment", "effect-shifter"]}
            />
            <Unit
              variant="sampler"
              size="lg"
              allowedKinds={["source", "sampler", "effect-adjustment", "effect-shifter"]}
            />
            <Unit
              variant="effect-adjustment"
              size="lg"
              allowedKinds={["source", "sampler", "effect-adjustment", "effect-shifter"]}
            />
            <Unit
              variant="effect-shifter"
              size="lg"
              allowedKinds={["source", "sampler", "effect-adjustment", "effect-shifter"]}
            />
            <Unit
              variant="sampler"
              size="lg"
              allowedKinds={["source", "sampler", "effect-adjustment", "effect-shifter"]}
            />
            <Unit
              variant="empty"
              size="lg"
              allowedKinds={["source", "sampler", "effect-adjustment", "effect-shifter"]}
            />
          </div>
        </ResizablePanel>
        <ResizableHandle withHandle />
        <ResizablePanel
          minSize={25}
          defaultSize={30}
          className="h-screen bg-muted/70 backdrop-blur"
        >
          <div className="h-screen grow-3 gap-2 border-l-1 p-5">
            <RightColumn />
          </div>
        </ResizablePanel>
      </ResizablePanelGroup>
    </div>
  );
}
