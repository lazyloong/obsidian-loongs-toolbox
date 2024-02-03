import ThePlugin from "main";
import { DataviewInlineApi } from "obsidian-dataview/lib/api/inline-api";
import Renderer from "web/webDataRenderer";

export default abstract class WebParser<T extends WebData> {
    page_count: number = 10;
    data: T[] = [];
    max_num: number;
    current_page: number = 0;
    default_headers: string[];
    default_values: string[];
    constructor(public id: string, public plugin: ThePlugin, public type: WebDataType) {
        this.default_headers = ["标题", "创建", "简介"];
        this.default_values = ["link", "notebook", "intro"];
    }
    abstract getUrl(page: number): string;
    abstract getData(page: number): T[] | Promise<T[]>;
    async addNextPageData() {
        this.current_page += 1;
        let data = await this.getData(this.current_page);
        this.data = this.data.concat(data);
        return this.data;
    }
    async getAllData() {
        while (this.data.length < this.max_num) await this.addNextPageData();
        return this.data;
    }
    render(dv: DataviewInlineApi): void;
    render(dv: DataviewInlineApi, headers: string[]): void;
    render(dv: DataviewInlineApi, headers: string[], values: string[]): void;
    async render(dv: DataviewInlineApi, headers?: string[], values?: string[]) {
        if (!headers) {
            headers = this.default_headers;
            values = this.default_values;
        } else if (!values) {
            values = headers;
        }
        new Renderer(dv, this, headers, values).render();
    }
    clear() {
        this.data = [];
        this.current_page = 0;
        this.max_num = null;
    }
}

export type WebDataType = "bili" | "zhihu" | "juejin";

export type WebData = {
    title: string;
    intro: string;
    author: string;
    author_id: string;
    url: string;
    id: string;
    cover?: string;
};
