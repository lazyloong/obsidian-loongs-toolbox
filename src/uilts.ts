import { Notice, TFile, getIcon } from "obsidian";
import { MatchData } from "./blockIdEditorSuggest";
import sanitize from "sanitize-filename";
import * as Path from "path";

export class SuggestionRenderer {
    containerEl: HTMLElement;
    contentEl: HTMLElement;
    flairEl: HTMLElement;
    noteEl: HTMLElement;
    titleEl: HTMLElement;
    toHighlightEl: HTMLElement;
    title: string = "";
    note: string = "";
    constructor(containerEl: HTMLElement) {
        this.containerEl = containerEl;
        this.contentEl = this.containerEl.createEl("div", { cls: "fz-suggestion-content" });
        this.titleEl = this.contentEl.createEl("div", { cls: "fz-suggestion-title" });
        this.noteEl = this.contentEl.createEl("div", {
            cls: "fz-suggestion-note",
        });
        this.toHighlightEl = this.titleEl;
    }
    setToHighlightEl(name: "title" | "note") {
        this.toHighlightEl = this[`${name}El`];
    }
    render(matchData: MatchData) {
        let range = matchData.matches,
            text: string,
            index = 0;
        if (this.title == "") this.setTitle(matchData.text);
        if (this.toHighlightEl == this.titleEl) {
            text = this.title;
            this.noteEl.innerText = this.note;
        } else {
            text = this.note;
            this.titleEl.innerText = this.title;
        }
        if (range) {
            for (const r of range) {
                this.toHighlightEl.appendText(text.slice(index, r[0]));
                this.toHighlightEl.createSpan({
                    cls: "suggestion-highlight",
                    text: text.slice(r[0], r[1] + 1),
                });
                index = r[1] + 1;
            }
        }
        this.toHighlightEl.appendText(text.slice(index));
    }
    setTitle(text: string) {
        this.title = text;
    }
    setNote(text: string) {
        this.note = text;
    }
    addIcon(icon: string) {
        if (!this.flairEl)
            this.flairEl = this.containerEl.createEl("span", {
                cls: "suggestion-flair",
            });
        this.flairEl.appendChild(getIcon(icon));
    }
}

export async function createFile(name: string, path: string) {
    let fullPath = Path.join(path, sanitize(name) + ".md");
    let file = app.vault.getAbstractFileByPath(fullPath) as TFile;
    if (!file) file = await app.vault.create(fullPath, "");
    app.workspace.getMostRecentLeaf().openFile(file);
}

export function copy(text: string) {
    navigator.clipboard.writeText(text).then(
        () => new Notice("已复制到剪贴板：" + text, 1000),
        () => new Notice("复制失败：" + text, 1000)
    );
}
