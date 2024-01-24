import {
    App,
    Editor,
    EditorPosition,
    EditorSuggest,
    EditorSuggestContext,
    EditorSuggestTriggerInfo,
    PreparedQuery,
    SearchResult,
    TFile,
    fuzzySearch,
    prepareQuery,
} from "obsidian";
import ThePlugin from "./main";
import { SuggestionRenderer } from "./uilts";

export interface MatchData extends SearchResult {
    text: string;
}

export default class BlockIdEditorSuggest extends EditorSuggest<MatchData> {
    plugin: ThePlugin;
    app: any;
    items: string[];
    constructor(app: App, plugin: ThePlugin) {
        super(app);
        this.plugin = plugin;
        this.items = this.plugin.settings.customBlockIdSuggest;
    }
    updateItems() {
        this.items = this.plugin.settings.customBlockIdSuggest;
    }
    onTrigger(cursor: EditorPosition, editor: Editor, file: TFile): EditorSuggestTriggerInfo {
        let cursorPos = editor.getCursor();
        let lineContent = editor.getLine(cursorPos.line);
        let m = /\^([a-zA-Z]*)$/.exec(lineContent);
        if (cursorPos.ch == lineContent.length && m) {
            let startPos = {
                line: cursorPos.line,
                ch: cursorPos.ch - m[1].length,
            };
            return { start: startPos, end: cursorPos, query: m[1] };
        }
    }
    getSuggestions(content: EditorSuggestContext): MatchData[] {
        let results: MatchData[] = [];
        for (const item of this.items) {
            let r = fuzzySearch(prepareQuery(content.query), item);
            if (r) results.push({ ...r, text: item });
        }
        if (results.length == 1 && results[0].text == content.query) return [];
        return results;
    }
    renderSuggestion(matchData: MatchData, el: HTMLElement) {
        el.addClass("fz-item");
        new SuggestionRenderer(el).render(matchData);
    }
    selectSuggestion(matchData: MatchData): void {
        var context = this.context;
        if (context) {
            var editor = context.editor,
                start = context.start,
                end = context.end;
            editor.transaction({
                changes: [
                    {
                        from: start,
                        to: end,
                        text: matchData.text,
                    },
                ],
            });
            editor.setCursor({ line: start.line, ch: start.ch + matchData.text.length });
        }
    }
}
