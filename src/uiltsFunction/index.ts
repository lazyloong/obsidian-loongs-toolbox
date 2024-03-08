import { App, Command, Plugin_2 } from "obsidian";
import ThePlugin from "main";
import { WebData, WebDataType, BiliFavlist, ZhihuFavlist, JuejinFavlist } from "webParser";
import { monthFileLine, yearFileLine } from "render/echarts";
import { DataviewInlineApi } from "obsidian-dataview/lib/api/inline-api";
import DV from "./dv";
import FileTools from "./fileTools";
import WebParser from "webParser/webParser";

export default class uiltsFunctions {
    app: App;
    webData: WebData;
    plugins: Plugin_2[];
    render: Record<string, Function>;
    file: FileTools;
    constructor(public plugin: ThePlugin) {
        globalThis.loong = this;
        this.app = this.plugin.app;
        this.plugins = this.app.plugins.plugins;
        this.file = new FileTools(this.plugin);
        this.render = {
            yearFileLine: (a, b, c, d) => yearFileLine(a, b, c, d, plugin),
            monthFileLine: (a, b, c, d, e) => monthFileLine(a, b, c, d, e, plugin),
        };
    }
    unload() {
        delete globalThis.loong;
    }
    execCommand(command: string | Command): boolean {
        let id: string;
        if (typeof command === "string") id = this.getCommand(command)?.id;
        else id = command.id;
        if (!id) return;
        return this.app.commands.executeCommandById(id);
    }
    getCommand(command: string): Command {
        if (this.app.commands.commands[command]) return this.app.commands.commands[command];
        else return Object.entries(this.app.commands.commands).find((c) => c[1].name == command)[1];
    }
    pause(
        ms: number,
        callback: Function = () => {
            debugger;
        }
    ) {
        setTimeout(callback, ms);
    }
    getWebData(type: WebDataType, id: string): WebParser<WebData> {
        switch (type) {
            case "bili":
                return new BiliFavlist(id, this.plugin);
            case "zhihu":
                return new ZhihuFavlist(id, this.plugin);
            case "juejin":
                return new JuejinFavlist(id, this.plugin);
        }
    }
    getDv(dv: DataviewInlineApi) {
        return new DV(dv);
    }
}
