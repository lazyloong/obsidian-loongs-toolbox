import { TFile, View, WorkspaceLeaf } from "obsidian";
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

interface EmptyView extends View {
    actionListEl: HTMLElement;
}

export function hijackingCanvasView(leaf: WorkspaceLeaf) {
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
}

function isCanvasView(view: View): view is CanvasView {
    return view.getViewType() === "canvas";
}

export function d(plugin: ThePlugin) {
    let app = plugin.app;
    return (callback: (leaf: WorkspaceLeaf) => void) => {
        plugin.registerEvent(
            app.workspace.on("active-leaf-change", (leaf) => {
                callback(leaf);
            })
        );
    };
}

export function hijackingEmptyView(leaf: WorkspaceLeaf) {
    if (!isEmptyView(leaf.view)) return;
    let actionListEl = leaf.view.actionListEl;
    let temBtn = actionListEl.children[3].cloneNode() as HTMLElement;
    temBtn.innerText = "打开主页";
    temBtn.addEventListener("click", (e) => {
        leaf.openFile(loong.file.getTFile("管理面板.canvas") as TFile);
    });
    actionListEl.children[3].replaceWith(temBtn);
    // actionListEl.appendChild(temBtn);
}

function isEmptyView(view: View): view is EmptyView {
    return view.getViewType() === "empty";
}
