import { App, TFolder, TFile, Notice } from "obsidian";
import { getTAbstractFileByPathOrName } from "uilts";
import ThePlugin from "main";
import { DFile } from "./fileTools";
import FileGroup from "./fileGroup";
import { RenameArg } from "./fileTools";

export default class LFolder {
    plugin: ThePlugin;
    path: string;
    app: App;
    tfolder: TFolder;
    tfiles: TFile[];
    dfiles: DFile[];
    direct_tfiles: TFile[];
    direct_dfiles: DFile[];
    file_groups: FileGroup;
    constructor(path: string, plugin: ThePlugin) {
        this.path = path;
        this.plugin = plugin;
        this.app = plugin.app;
        this.init();
    }
    init() {
        let tfolder = getTAbstractFileByPathOrName(this.path);
        if (!tfolder) {
            new Notice("没有这个文件夹", 2000);
            return;
        }
        if (tfolder instanceof TFile) {
            new Notice("这是个文件", 2000);
            return;
        }
        this.tfolder = tfolder as TFolder;
        this.path = this.tfolder.path;
        if (this.path == "/") this.tfiles = this.app.vault.getMarkdownFiles();
        else
            this.tfiles = this.app.vault
                .getMarkdownFiles()
                .filter((f) => f.parent.path.startsWith(this.path));
        this.direct_tfiles = this.tfiles.filter((f) => f.parent.path == this.path);
        this.file_groups = new FileGroup(this.tfiles);
        let api = this.plugin.getAuxiliaryPluginsAPI("dataview");
        if (api) {
            this.dfiles = api.pages(`"${this.path}"`).array();
            this.direct_dfiles = this.dfiles.filter((f) => f.file.path == this.path);
        }
    }
    async batchRename(callback: RenameArg): Promise<void> {
        await this.file_groups.batchRename(callback);
    }
    async batchUpdateMetadataCache(k: string | number, v: any) {
        await this.file_groups.batchUpdateMetadataCache(k, v);
    }
    async batchDealWith(callback: (file: TFile) => void | Promise<void>): Promise<void> {
        await this.file_groups.batchDealWith(callback);
    }
}
