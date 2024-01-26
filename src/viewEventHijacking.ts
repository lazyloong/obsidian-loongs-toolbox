import { TFile, View } from "obsidian";
import ThePlugin from "./main";

interface CanvasView extends View {
    file: TFile;
    canvas: {
        dragTempNode(e: PointerEvent, n: any, arg2: (e: any) => void): unknown;
        config: any;
        posCenter(): any;
        createFileNode(arg0: { pos: any; file: TFile; size?: any }): unknown;
        cardMenuEl: HTMLElement;
        dirty: Set<{ file: TFile; nodeEl: HTMLDivElement }>;
    };
}

export function hijackingCanvasView(plugin: ThePlugin) {
    let app = plugin.app;
    plugin.registerEvent(
        app.workspace.on("active-leaf-change", (leaf) => {
            if (!isCanvasView(leaf.view)) return;
            let canvas = leaf.view.canvas;
            canvas.dirty.forEach((p) => {
                if (!p.file) return;
                p.nodeEl.addEventListener("click", (e) => {
                    if (!e.ctrlKey) return;
                    e.stopPropagation();
                    let leaf = app.workspace.getLeaf("tab");
                    leaf.openFile(p.file);
                });
            });
        })
    );
}

function isCanvasView(view: View): view is CanvasView {
    return view.getViewType() === "canvas";
}
