import { Setting, PluginSettingTab } from "obsidian";
import ThePlugin, { auxiliaryPlugins } from "./main";
import { WebDataType } from "./web/webParser";

export default class TheSettingTab extends PluginSettingTab {
    plugin: ThePlugin;
    constructor(plugin: ThePlugin) {
        super(plugin.app, plugin);
        this.plugin = plugin;
    }

    display(): void {
        let { containerEl } = this;
        containerEl.empty();
        this.addMiscellaneous();
        this.addAuxiliaryPluginsAPI();
        this.addWebData();
    }
    addMiscellaneous() {
        let { containerEl } = this;
        containerEl.createEl("h2", { text: "杂项" });
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
    }
    addAuxiliaryPluginsAPI() {
        let { containerEl } = this;
        containerEl.createEl("h2", { text: "辅助插件 API" });
        for (const ap of auxiliaryPlugins) {
            new Setting(containerEl).setName(ap.id).addExtraButton((cb) => {
                cb.setIcon(this.plugin.auxiliaryPlugins[ap.id].api ? "check" : "x");
            });
        }
        new Setting(containerEl).setName("依赖插件状态").addButton((cb) => {
            cb.setButtonText("更新").onClick(async () => {
                this.plugin.updateAuxiliaryPluginsAPI();
                this.display();
            });
        });
    }
    addWebData() {
        let { containerEl } = this;
        containerEl.createEl("h2", { text: "网站收藏夹" });
        let setting = this.plugin.settings.newFileLocation;
        for (const key of Object.keys(setting)) {
            new Setting(containerEl)
                .setName(key)
                .setDesc("新文件位置")
                .addText((cb) => {
                    cb.setValue(setting[key]).onChange(async (value) => {
                        setting[key] = value;
                        await this.plugin.saveSettings();
                    });
                });
        }
    }
}

export interface TheSettings {
    copyPathMenuItem: boolean;
    customBlockIdSuggest: string[];
    newFileLocation: { [p in WebDataType]: string };
}

export const DEFAULT_SETTINGS: TheSettings = {
    copyPathMenuItem: true,
    customBlockIdSuggest: [],
    newFileLocation: {
        bili: app.fileManager.getNewFileParent("").path,
        zhihu: app.fileManager.getNewFileParent("").path,
        juejin: app.fileManager.getNewFileParent("").path,
    },
};
