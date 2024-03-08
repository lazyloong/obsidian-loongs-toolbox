import {
    App,
    Editor,
    EditorPosition,
    EditorSuggest,
    EditorSuggestContext,
    EditorSuggestTriggerInfo,
    TFile,
    fuzzySearch,
    prepareQuery,
} from "obsidian";
import ThePlugin from "main";
import { MatchData, SuggestionRenderer } from "uilts";

const Code_Block_Label = [
    "autohotkey",
    "bash",
    "basic",
    "batch",
    "c",
    "csharp",
    "cpp",
    "css",
    "docker",
    "fortran",
    "golang",
    "haskell",
    "html",
    "ini",
    "java",
    "javascript",
    "js",
    "json",
    "kotlin",
    "less",
    "lua",
    "makefile",
    "markdown",
    "matlab",
    "nginx",
    "objectivec",
    "perl",
    "php",
    "plaintext",
    "powershell",
    "python",
    "r",
    "ruby",
    "rust",
    "sass",
    "scala",
    "scheme",
    "shell",
    "sql",
    "swift",
    "toml",
    "typescript",
    "ts",
    "vim",
    "wiki",
    "yaml",
];

export default class CodeBlockEditorSuggest extends EditorSuggest<MatchData> {
    plugin: ThePlugin;
    app: any;
    items: string[];
    constructor(app: App, plugin: ThePlugin) {
        super(app);
        this.plugin = plugin;
        this.updateItems();
    }
    updateItems() {
        this.items = Code_Block_Label.concat(this.plugin.settings.customCodeBlockSuggest);
    }
    onTrigger(cursor: EditorPosition, editor: Editor, file: TFile): EditorSuggestTriggerInfo {
        let lineContent = editor.getLine(cursor.line);
        let m = /^(```+)([a-zA-Z]*)$/.exec(lineContent);
        if (m)
            return {
                start: {
                    line: cursor.line,
                    ch: m[1].length,
                },
                end: {
                    line: cursor.line,
                    ch: lineContent.length,
                },
                query: m[2],
            };
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
