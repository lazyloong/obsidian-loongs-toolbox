import { Menu, TAbstractFile, WorkspaceLeaf, Notice } from "obsidian";
import ThePlugin from "./main";

export default function addCopyPathMenu(plugin: ThePlugin) {
    plugin.registerEvent(
        plugin.app.workspace.on(
            "file-menu",
            (menu: Menu, file: TAbstractFile, source: string, leaf?: WorkspaceLeaf) => {
                menu.addItem((item) => {
                    item.setIcon("copy")
                        .setTitle("复制路径")
                        .onClick(() => {
                            navigator.clipboard.writeText(file.path);
                            new Notice("路径已复制", 1000);
                        });
                });
            }
        )
    );
}
