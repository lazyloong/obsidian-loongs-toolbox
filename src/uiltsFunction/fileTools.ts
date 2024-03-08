import ThePlugin from "main";
import { TAbstractFile, TFile, WorkspaceLeaf } from "obsidian";
import { getTAbstractFileByPathOrName, createFile } from "uilts";
import LFile from "./lfile";
import FileGroup from "./fileGroup";
import LFolder from "./lfolder";
import { SMarkdownPage } from "obsidian-dataview";

export default class FileTools {
    constructor(public plugin: ThePlugin) {}
    getFile(path: string, type: "l" | "d" | "t" = "l") {
        switch (type) {
            case "l":
                return this.getLFile(path);
            case "d":
                return this.getDFile(path);
            case "t":
                return this.getTFile(path);
        }
    }
    getTFile(path: string): TAbstractFile {
        return getTAbstractFileByPathOrName(path);
    }
    getDFile(path: string): DFile {
        let api = this.plugin.getAuxiliaryPluginsAPI("dataview");
        if (api) return api.page(path);
    }
    getLFile(path: string): LFile {
        return new LFile(path, this.plugin);
    }
    getLFolder(path: string): LFolder {
        return new LFolder(path, this.plugin);
    }
    getFileGroup(files: File[]): FileGroup {
        let files_ = files.map(this.toT);
        return new FileGroup(files_);
    }
    pages(query: string): LFile[] {
        let api = this.plugin.getAuxiliaryPluginsAPI("dataview");
        if (api) return api.pages(query).map(this.toL).array();
    }
    toT(file: File): TFile {
        let l2t = (l: LFile) => l.tfile;
        let d2t = (d: DFile) => getTAbstractFileByPathOrName(d.file.path) as TFile;
        if (isLfile(file)) return l2t(file);
        else if (isDfile(file)) return d2t(file);
        else return file;
    }
    toL(file: File): LFile {
        let t2l = (t: TFile) => this.getLFile(t.path);
        let d2l = (d: DFile) => this.getLFile(d.file.path);
        if (isTfile(file)) return t2l(file);
        else if (isDfile(file)) return d2l(file);
        else return file;
    }
    toD(file: File): DFile {
        if (isDfile(file)) return file;
        else return this.getDFile(file.path);
    }
    // rename(file: File, name: string): Promise<void>;
    // rename(file: File, [name, path]: [string, string]): Promise<void>;
    // rename(file: File, callback: (name: string) => string): Promise<void>;
    // rename(file: File, callback: (name: string, folder: string) => [string, string]): Promise<void>;
    async rename(file: File, arg0: RenameArg): Promise<void> {
        let tfile = this.toT(file);
        if (typeof arg0 == "string")
            await app.fileManager.renameFile(tfile, `${tfile.parent.path}/${arg0}`);
        else if (Array.isArray(arg0))
            await app.fileManager.renameFile(tfile, `${arg0[1]}/${arg0[0]}`);
        else {
            if (arg0.length == 1) {
                let newName = (arg0 as (name: string) => string)(tfile.name);
                await app.fileManager.renameFile(tfile, `${tfile.parent.path}/${newName}`);
            } else if (arg0.length == 2) {
                let [newName, newFolder] = arg0(tfile.name, tfile.parent.path);
                await app.fileManager.renameFile(tfile, `${newFolder}/${newName}`);
            }
        }
    }
    async create(
        name: string,
        path: string = app.fileManager.getNewFileParent("").path,
        content: string = ""
    ): Promise<TFile> {
        return await createFile(name, path, content);
    }
    async modify(file: File, content: string) {
        await app.vault.modify(this.toT(file), content);
    }
    async delete(file: File) {
        await app.vault.trash(this.toT(file), true);
    }
    open(file: File, leaf: WorkspaceLeaf = app.workspace.getMostRecentLeaf()) {
        leaf.openFile(this.toT(file));
    }
}
function isLfile(file: File): file is LFile {
    return file instanceof LFile;
}
function isTfile(file: File): file is TFile {
    return file instanceof TFile;
}
function isDfile(file: File): file is DFile {
    return Boolean((file as DFile)?.file?.name);
}

type File = TFile | LFile | DFile;

export type RenameArg =
    | string
    | [string, string]
    | ((name: string) => string)
    | ((name: string, folder: string) => [string, string]);

export type DFile = SMarkdownPage;
