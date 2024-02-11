import { Menu, TAbstractFile } from "obsidian";
import ThePlugin from "./main";
import { copy } from "./uilts";

export default function addCopyPathMenu(plugin: ThePlugin) {
    plugin.registerEvent(
        plugin.app.workspace.on("file-menu", (menu: Menu, file: TAbstractFile) => {
            menu.addItem((item) => {
                item.setIcon("copy")
                    .setTitle("复制路径")
                    .onClick(() => copy(file.path));
            }).addItem((item) => {
                item.setIcon("copy")
                    .setTitle("控制台文件")
                    .onClick(() => {
                        globalThis.lfile = loong.file.getLFile(file.path);
                        console.log(globalThis.lfile);
                    });
            });
        })
    );
}
