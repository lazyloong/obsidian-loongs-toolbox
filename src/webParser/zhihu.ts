import { request } from "obsidian";
import ThePlugin from "main";
import { WebData } from ".";
import WebParser from "./webParser";

export default class ZhihuFavlist extends WebParser<WebData> {
    constructor(id: string, plugin: ThePlugin) {
        super(id, plugin, "zhihu");
    }
    getUrl(page: number = 1) {
        return `https://api.zhihu.com/collections/${this.id}/contents?excerpt_len=150&limit=${
            this.page_count
        }&offset=${(page - 1) * 10}`;
    }
    async getData(page: number = 1) {
        let url = this.getUrl(page);
        const res = await request({
            url: url,
            method: "GET",
        });
        let json = JSON.parse(res);
        if (!this.max_num) this.max_num = json.paging.totals;
        let data = json.data;
        let results: WebData[] = [];
        for (const i of data) {
            switch (i.type) {
                case "answer":
                    results.push({
                        title: i.question.title,
                        id: i.id,
                        intro: i.excerpt,
                        author: i.author.name,
                        author_id: i.author.id,
                        url: i.url,
                    });
                    break;
                case "pin":
                    results.push({
                        title: i.content.find((p) => p?.title).title,
                        id: i.id,
                        intro: i.excerpt_title,
                        author: i.author.name,
                        author_id: i.author.id,
                        url: i.url,
                    });
                    break;
                default:
                    results.push({
                        title: i.title,
                        id: i.id,
                        intro: i.excerpt,
                        author: i.author.name,
                        author_id: i.author.id,
                        url: i.url,
                    });
                    break;
            }
        }
        return results;
    }
}
