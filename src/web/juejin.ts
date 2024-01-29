import { request } from "obsidian";
import ThePlugin from "../main";
import WebParser, { WebData } from "./webParser";

export default class JuejinFavlist extends WebParser<WebData> {
    constructor(id: string, plugin: ThePlugin) {
        super(id, plugin, "juejin");
    }
    getUrl() {
        return `https://api.juejin.cn/interact_api/v2/collectionset/detail`;
    }
    getPostBody(page: number = 1) {
        let body = {
            collection_id: this.id,
            limit: this.page_count,
            cursor: ((page - 1) * this.page_count).toString(),
        };
        return JSON.stringify(body);
    }
    async getData(page: number = 1) {
        let url = this.getUrl();
        const res = await request({
            url: url,
            method: "POST",
            contentType: "application/json",
            body: this.getPostBody(page),
        });
        let json = JSON.parse(res);
        if (json.err_no !== 0) {
            console.log(json?.err_msg);
            return [];
        }
        if (!this.max_num) this.max_num = json.data.collection_info.post_article_count;
        let data = json.data.articles;
        let results: WebData[] = [];
        for (const i of data) {
            results.push({
                title: i.article_info.title,
                id: i.article_id,
                cover: i.article_info.cover_image,
                intro: i.article_info.brief_content,
                author: i.author_user_info.user_name,
                author_id: i.author_user_info.user_id,
                url: `https://juejin.cn/post/${i.article_id}`,
            });
        }
        return results;
    }
}
