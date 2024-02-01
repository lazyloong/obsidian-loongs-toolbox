import { Plugin, Notice } from "obsidian";
import addCopyPathMenu from "./addCopyPath";
import uiltsFunctions from "./uiltsFunction";
import TheSettingTab, { DEFAULT_SETTINGS, TheSettings } from "./settingTab";
import BlockIdEditorSuggest from "./blockIdEditorSuggest";
import { hijackingCanvasView } from "./viewEventHijacking";

export let auxiliaryPlugins: AuxiliaryPlugin[] = [
    { id: "dataview", getApi: (p) => p.api },
    { id: "obsidian-echarts", getApi: (p) => p },
];

export default class ThePlugin extends Plugin {
    settings: TheSettings;
    uiltsFunctions: uiltsFunctions;
    auxiliaryPlugins: Record<string, AuxiliaryPlugin> = {};
    blockIdEditorSuggest: BlockIdEditorSuggest;
    async onload() {
        await this.loadSettings();
        this.updateAuxiliaryPluginsAPI();
        if (this.settings.copyPathMenuItem) addCopyPathMenu(this);
        hijackingCanvasView(this);
        this.uiltsFunctions = new uiltsFunctions(this);
        this.blockIdEditorSuggest = new BlockIdEditorSuggest(this.app, this);
        this.registerEditorSuggest(this.blockIdEditorSuggest);
        this.addSettingTab(new TheSettingTab(this));
    }
    updateAuxiliaryPluginsAPI() {
        for (const p of auxiliaryPlugins) this.updateSingleAPI(p);
        new Notice("更新完成", 2000);
    }
    updateSingleAPI(ap: AuxiliaryPlugin) {
        this.auxiliaryPlugins[ap.id] = ap;
        let plugin: Plugin = this.app.plugins.getPlugin(ap.id);
        this.auxiliaryPlugins[ap.id].api = ap.getApi(plugin);
        return this.auxiliaryPlugins[ap.id].api;
    }
    getAuxiliaryPluginsAPI(id: string) {
        if (this.auxiliaryPlugins?.[id]?.api) return this.auxiliaryPlugins[id].api;
        else {
            let ap = auxiliaryPlugins.find((p) => p.id === id);
            let api = this.updateSingleAPI(ap);
            if (api) return api;
            new Notice(`没有 ${id} 插件`);
            return;
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

type AuxiliaryPlugin = {
    readonly id: string;
    readonly getApi: (p: Plugin & { [K: string]: any }) => any;
    api?: any;
};
