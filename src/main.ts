import { Plugin, Notice } from "obsidian";
import addCopyPathMenu from "./addCopyPath";
import uiltsFunctions from "./uiltsFunction";
import TheSettingTab, { DEFAULT_SETTINGS, TheSettings } from "./settingTab";
import BlockIdEditorSuggest from "./blockIdEditorSuggest";
import { hijackingCanvasView, hijackingEmptyView, d } from "./viewEventHijacking";
import { DataviewApi } from "obsidian-dataview";

type AuxiliaryPlugin<T extends keyof PluginApiMap> = {
    readonly id: T;
    readonly getApi: (p: Plugin & { [K: string]: any }) => PluginApiMap[T];
    api?: PluginApiMap[T];
};

type PluginApiMap = {
    dataview: DataviewApi;
    "obsidian-echarts": any;
};

export let auxiliaryPlugins: Array<AuxiliaryPlugin<keyof PluginApiMap>> = [
    { id: "dataview", getApi: (p) => p.api },
    { id: "obsidian-echarts", getApi: (p) => p },
];

export default class ThePlugin extends Plugin {
    settings: TheSettings;
    uiltsFunctions: uiltsFunctions;
    auxiliaryPlugins: Record<string, AuxiliaryPlugin<keyof PluginApiMap>> = {};
    blockIdEditorSuggest: BlockIdEditorSuggest;
    async onload() {
        await this.loadSettings();
        this.updateAuxiliaryPluginsAPI();
        if (this.settings.copyPathMenuItem) addCopyPathMenu(this);
        d(this)(hijackingCanvasView);
        d(this)(hijackingEmptyView);
        this.uiltsFunctions = new uiltsFunctions(this);
        this.blockIdEditorSuggest = new BlockIdEditorSuggest(this.app, this);
        this.registerEditorSuggest(this.blockIdEditorSuggest);
        this.addSettingTab(new TheSettingTab(this));
    }
    updateAuxiliaryPluginsAPI() {
        for (const p of auxiliaryPlugins) this.updateSingleAPI(p);
        new Notice("更新完成", 2000);
    }
    updateSingleAPI(ap: AuxiliaryPlugin<keyof PluginApiMap>) {
        this.auxiliaryPlugins[ap.id] = ap;
        let plugin: Plugin = this.app.plugins.getPlugin(ap.id);
        this.auxiliaryPlugins[ap.id].api = ap.getApi(plugin);
        return this.auxiliaryPlugins[ap.id].api;
    }
    getAuxiliaryPluginsAPI<T extends keyof PluginApiMap>(id: T): PluginApiMap[T] {
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
