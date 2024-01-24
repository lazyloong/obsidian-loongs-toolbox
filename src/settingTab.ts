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
        new Setting(containerEl).setName("自定义 blockId 提示").addText((cb) => {
            cb.setValue(this.plugin.settings.customBlockIdSuggest.join(", ")).onChange(
                async (value) => {
                    this.plugin.settings.customBlockIdSuggest = value
                        .split(",")
                        .map((v) => v.trim());
                    this.plugin.blockIdEditorSuggest.updateItems();
                    await this.plugin.saveSettings();
                }
            );
        });
        for (const [plugin, status] of Object.entries(this.plugin.auxiliaryPluginsAPI)) {
            new Setting(containerEl).setName(plugin).addExtraButton((cb) => {
                cb.setIcon(status ? "check" : "x");
            });
        }
        new Setting(containerEl).setName("依赖插件状态").addButton((cb) => {
            cb.setButtonText("更新").onClick(async () => {
                this.plugin.updateAuxiliaryPluginsAPI();
                this.display();
            });
        });
    }
}

export interface TheSettings {
    copyPathMenuItem: boolean;
    customBlockIdSuggest: string[];
}

export const DEFAULT_SETTINGS: TheSettings = {
    copyPathMenuItem: true,
    customBlockIdSuggest: [],
};
