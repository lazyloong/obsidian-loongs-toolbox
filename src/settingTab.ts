import { Setting, PluginSettingTab } from "obsidian";
import ThePlugin from "./main";

export default class TheSettingTab extends PluginSettingTab {
    plugin: ThePlugin;
    constructor(plugin: ThePlugin) {
        super(plugin.app, plugin);
        this.plugin = plugin;
    }

    display(): void {
        let { containerEl } = this;
        containerEl.empty();
        new Setting(containerEl).setName("菜单栏里增加“复制相对路径”").addToggle((cb) => {
            cb.setValue(this.plugin.settings.copyPathMenuItem).onChange(async (value) => {
                this.plugin.settings.copyPathMenuItem = value;
                await this.plugin.saveSettings();
            });
        });
    }
}

export interface TheSettings {
    copyPathMenuItem: boolean;
}

export const DEFAULT_SETTINGS: TheSettings = {
    copyPathMenuItem: true,
};
