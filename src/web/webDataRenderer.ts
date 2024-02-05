import { DataviewInlineApi } from "obsidian-dataview/lib/api/inline-api";
import { DataviewApi } from "obsidian-dataview/lib/api/plugin-api";
import { createFile } from "../uilts";
import WebParser, { WebData } from "./webParser";

export default class Renderer<T extends WebData> {
    dv: DataviewInlineApi;
    page: number = 1;
    containerEl: HTMLDivElement;
    parser: WebParser<T>;
    limit: number = 10;
    headers: string[];
    values: string[];
    max_page: number;
    constructor(dv: DataviewInlineApi, parser: WebParser<T>, headers: string[], values: string[]) {
        this.dv = dv;
        this.parser = parser;
        this.headers = headers;
        this.values = values;
        this.containerEl = dv.container.createEl("div");
    }
    async render(limit = 10) {
        if (this.parser.data.length === 0) await this.parser.addNextPageData();
        this.max_page = Math.ceil(this.parser.max_num / this.limit);
        let { dv } = this;
        this.limit = limit;
        let api: DataviewApi = dv.api;
        this.containerEl.empty();
        this.renderButtons();
        api.table(
            this.headers,
            this.parser.data.slice((this.page - 1) * limit, this.page * limit).map((p) => {
                let results = [];
                for (const k of this.values) results.push(this.getAttr(p, k));
                return results;
            }),
            this.containerEl,
            dv.component,
            dv.currentFilePath
        );
        this.renderButtons();
    }
    renderButtons() {
        let prevButton = this.containerEl.createEl("button");
        prevButton.addEventListener("click", () => {
            if (this.page == 1) return;
            this.page -= 1;
            this.render();
        });
        prevButton.style.margin = "10px";
        prevButton.textContent = "上一页";

        let nextButton = this.containerEl.createEl("button");
        nextButton.addEventListener("click", async () => {
            if (this.page == this.max_page) return;
            while (
                this.parser.data.length < this.parser.max_num &&
                this.parser.data.length <= this.page * this.limit
            )
                await this.parser.addNextPageData();
            this.page += 1;
            this.render();
        });
        nextButton.style.margin = "10px";
        nextButton.textContent = "下一页";

        let refreshButton = this.containerEl.createEl("button");
        refreshButton.addEventListener("click", async () => {
            this.parser.clear();
            this.page = 1;
            this.max_page = Math.ceil(this.parser.max_num / this.limit);
            this.render();
        });
        refreshButton.style.margin = "10px";
        refreshButton.textContent = "刷新";

        this.containerEl.createSpan({
            text: `第 ${this.page}/${this.max_page} 页\t每页 ${this.limit} 个\t共 ${this.parser.max_num} 个`,
        });
    }
    getAttr(p: T, key: string): any {
        switch (key) {
            case "notebook":
                let div = this.containerEl.createEl("div");
                let b = div.createEl("button");
                b.textContent = "创建笔记";
                b.addEventListener("click", async () => {
                    loong.webData = p;
                    let type = this.parser.type;
                    let path = loong.plugin.settings.newFileLocation[type];
                    let file = await createFile(p.title, path);
                    app.workspace.getMostRecentLeaf().openFile(file);
                });
                return div;
            case "link":
                return `[${p.title}](${p.url})`;
            case "cover":
                return `![|250](${p.cover})`;
            default:
                return p[key];
        }
    }
}
