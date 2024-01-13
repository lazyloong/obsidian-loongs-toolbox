import { Plugin, MarkdownRenderer } from "obsidian";
import addCopyPathMenu from "./AddCopyPath";
import uiltsFunctions from "./uiltsFunction";
import TheSettingTab, { DEFAULT_SETTINGS, TheSettings } from "./settingTab";

export default class ThePlugin extends Plugin {
    api: any;
    settings: TheSettings;
    uiltsFunctions: uiltsFunctions;
    async onload() {
        await this.loadSettings();
        this.api = { MarkdownRenderer: MarkdownRenderer };
        addCopyPathMenu(this);
        this.uiltsFunctions = new uiltsFunctions(this);
        this.addSettingTab(new TheSettingTab(this));
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
