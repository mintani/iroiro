import { useDropTarget } from "@/components/palette-studio/use-drop-target";
import { createEvent, fireEvent, render, screen } from "@testing-library/react";
import { describe, expect, it, vi } from "vitest";

const Harness = ({ onFile, onEmpty }: { onFile: (file: File) => void; onEmpty: () => void }) => {
  const { dragging, handlers } = useDropTarget(onFile, onEmpty);

  return (
    <div data-testid="target" {...handlers}>
      {dragging ? "dragging" : "idle"}
    </div>
  );
};

const setup = () => {
  const onFile = vi.fn<(file: File) => void>();
  const onEmpty = vi.fn<() => void>();
  render(<Harness onFile={onFile} onEmpty={onEmpty} />);
  return { onFile, onEmpty, target: screen.getByTestId("target") };
};

const FILE = new File([new Uint8Array(1)], "photo.png", { type: "image/png" });

describe("useDropTarget", () => {
  it("hands over the first dropped file", () => {
    const { onFile, onEmpty, target } = setup();

    fireEvent.drop(target, { dataTransfer: { files: [FILE] } });

    expect(onFile).toHaveBeenCalledWith(FILE);
    expect(onEmpty).not.toHaveBeenCalled();
  });

  it("reports a drop that carried no file", () => {
    const { onFile, onEmpty, target } = setup();

    fireEvent.drop(target, { dataTransfer: { files: [] } });

    expect(onEmpty).toHaveBeenCalledOnce();
    expect(onFile).not.toHaveBeenCalled();
  });

  it("marks the drop handled, so the browser does not navigate to the file", () => {
    const { target } = setup();
    const event = createEvent.drop(target, { dataTransfer: { files: [FILE] } });

    fireEvent(target, event);

    expect(event.defaultPrevented).toBe(true);
  });

  it("tracks the drag over the target", () => {
    const { target } = setup();

    fireEvent.dragOver(target);
    expect(target.textContent).toBe("dragging");

    fireEvent.dragLeave(target, { relatedTarget: document.body });
    expect(target.textContent).toBe("idle");
  });
});
