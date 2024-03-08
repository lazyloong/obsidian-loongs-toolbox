import ThePlugin from "main";
import { DataviewInlineApi } from "obsidian-dataview/lib/api/inline-api";
import Renderer from "webParser/webDataRenderer";
import BiliFavlist from "./bilibili";
import ZhihuFavlist from "./zhihu";
import JuejinFavlist from "./juejin";

export { BiliFavlist, ZhihuFavlist, JuejinFavlist };

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
