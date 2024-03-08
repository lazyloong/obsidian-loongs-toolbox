import { request } from "obsidian";
import ThePlugin from "main";
import { WebData } from ".";
import WebParser from "./webParser";

export default class BiliFavlist extends WebParser<WebData> {
    page_count = 20;
    constructor(id: string, plugin: ThePlugin) {
        super(id, plugin, "bili");
        this.default_headers = ["标题", "创建", "封面", "简介"];
        this.default_values = ["link", "notebook", "cover", "intro"];
    }
    getUrl(page: number = 1): string {
        return `https://api.bilibili.com/x/v3/fav/resource/list?media_id=${this.id}&pn=${page}&ps=${this.page_count}&jsonp=jsonp`;
    }
    async getData(page: number = 1) {
        let url = this.getUrl(page);
        const res = await request({
            url: url,
            method: "GET",
        });
        let json = JSON.parse(res);
        if (json.code !== 0) {
            console.log(json?.message);
            return [];
        }
        if (!this.max_num) this.max_num = json.data.info.media_count;
        let medias = json.data.medias;
        let results: WebData[] = [];
        for (const i of medias) {
            results.push({
                title: i.title,
                cover: i.cover,
                intro: i.intro,
                author: i.upper.name,
                author_id: i.upper.mid,
                id: i.bvid,
                url: `https://www.bilibili.com/video/${i.bvid}`,
            });
        }
        return results;
    }
}
