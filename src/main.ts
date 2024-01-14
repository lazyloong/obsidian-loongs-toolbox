import { Plugin, MarkdownRenderer, Notice } from "obsidian";
import addCopyPathMenu from "./AddCopyPath";
import uiltsFunctions from "./uiltsFunction";
import TheSettingTab, { DEFAULT_SETTINGS, TheSettings } from "./settingTab";

type AuxiliaryPluginsAPI = Record<"dataview", any>;

export default class ThePlugin extends Plugin {
    api: any;
    settings: TheSettings;
    uiltsFunctions: uiltsFunctions;
    auxiliaryPluginsAPI: AuxiliaryPluginsAPI = {
        dataview: null,
    };
    async onload() {
        await this.loadSettings();
        this.updateAuxiliaryPluginsAPI();
        this.api = { MarkdownRenderer: MarkdownRenderer };
        addCopyPathMenu(this);
        this.uiltsFunctions = new uiltsFunctions(this);
        this.addSettingTab(new TheSettingTab(this));
    }
    updateAuxiliaryPluginsAPI() {
        let plugins = Object.keys(this.auxiliaryPluginsAPI);
        for (const p of plugins) this.auxiliaryPluginsAPI[p] = this.app.plugins.getPlugin(p)?.api;
        new Notice("更新完成", 2000);
    }
    getAuxiliaryPluginsAPI(plugin: string) {
        if (this.auxiliaryPluginsAPI[plugin]) return this.auxiliaryPluginsAPI[plugin];
        else {
            new Notice(`没有 ${plugin} 插件`);
            return null;
        }
    }
    async onunload() {
        this.uiltsFunctions.unload();
    }
    async loadSettings() {
        this.settings = Object.assign({}, DEFAULT_SETTINGS, await this.loadData());
    }
    async saveSettings() {
        await this.saveData(this.settings);
    }
}
