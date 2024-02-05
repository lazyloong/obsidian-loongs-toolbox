import {
    App,
    CachedMetadata,
    Command,
    FrontMatterCache,
    HeadingCache,
    Notice,
    Plugin_2,
    TAbstractFile,
    TFile,
    TFolder,
    WorkspaceLeaf,
} from "obsidian";
import ThePlugin from "main";
import BiliFavlist from "web/bilibili";
import ZhihuFavlist from "web/zhihu";
import JuejinFavlist from "web/juejin";
import WebParser, { WebData, WebDataType } from "web/webParser";
import { DFile } from "types";
import { monthFileLine, yearFileLine } from "render/echarts";
import { SListItem } from "obsidian-dataview/lib/data-model/serialized/markdown";
import { DataviewInlineApi } from "obsidian-dataview/lib/api/inline-api";
import { DataArray, DataviewApi } from "obsidian-dataview";
import { Grouping } from "obsidian-dataview/lib/data-model/value";
import { createFile } from "uilts";

type MaybeArray<T> = T | T[];

export default class uiltsFunctions {
    app: App;
    webData: WebData;
    plugins: Plugin_2[];
    render: Record<string, Function>;
    file: FileTools;
    constructor(public plugin: ThePlugin) {
        globalThis.loong = this;
        this.app = this.plugin.app;
        this.plugins = this.app.plugins.plugins;
        this.file = new FileTools(this.plugin);
        this.render = {
            yearFileLine: (a, b, c, d) => yearFileLine(a, b, c, d, plugin),
            monthFileLine: (a, b, c, d, e) => monthFileLine(a, b, c, d, e, plugin),
        };
    }
    unload() {
        delete globalThis.loong;
    }
    execCommand(command: string | Command): boolean {
        let id: string;
        if (typeof command === "string") id = this.getCommand(command)?.id;
        else id = command.id;
        if (!id) return;
        return this.app.commands.executeCommandById(id);
    }
    getCommand(command: string): Command {
        if (this.app.commands.commands[command]) return this.app.commands.commands[command];
        else return Object.entries(this.app.commands.commands).find((c) => c[1].name == command)[1];
    }
    pause(ms: number) {
        setTimeout(() => {
            debugger;
        }, ms);
    }
    getWebData(type: "bili", id: string): BiliFavlist;
    getWebData(type: "zhihu", id: string): ZhihuFavlist;
    getWebData(type: "juejin", id: string): JuejinFavlist;
    getWebData(type: WebDataType, id: string): WebParser<WebData> {
        switch (type) {
            case "bili":
                return new BiliFavlist(id, this.plugin);
            case "zhihu":
                return new ZhihuFavlist(id, this.plugin);
            case "juejin":
                return new JuejinFavlist(id, this.plugin);
        }
    }
    getDv(dv: DataviewInlineApi) {
        return new DV(dv);
    }
}

class FileTools {
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
        if (api) return api.pages(path);
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
    async rename(file: File, callback: (name: string) => string): Promise<void>;
    async rename(
        file: File,
        callback: (name: string, folder: string) => [string, string]
    ): Promise<void>;
    async rename(file: File, callback: Function): Promise<void> {
        let tfile = this.toT(file);
        if (callback.length == 1) {
            let newName = callback(tfile.name);
            await app.fileManager.renameFile(tfile, `${tfile.parent.path}/${newName}`);
        } else if (callback.length == 2) {
            let [newName, newFolder] = callback(tfile.name, tfile.parent.path);
            await app.fileManager.renameFile(tfile, `${newFolder}/${newName}`);
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

class LFile {
    app: App;
    plugin: ThePlugin;
    path: string;
    tfile: TFile;
    dfile: DFile;
    content: string;
    headers: Headers;
    frontmatter: FrontMatterCache;
    metadataCache: CachedMetadata;
    constructor(path: string, plugin: ThePlugin) {
        this.plugin = plugin;
        this.app = plugin.app;
        this.path = path;
        this.init();
    }
    async init() {
        let tfile = getTAbstractFileByPathOrName(this.path);
        if (!tfile) {
            new Notice("没有这个文件", 2000);
            return;
        }
        if (tfile instanceof TFolder) {
            new Notice("这是个文件夹", 2000);
            return;
        }
        this.tfile = tfile as TFile;
        this.path = this.tfile.path;
        let api = this.plugin.getAuxiliaryPluginsAPI("dataview");
        if (api) this.dfile = api.page(this.path);
        this.content = await this.app.vault.cachedRead(this.tfile);
        this.getMetadataCache();
        this.headers = new Headers(this);
    }
    getMetadataCache() {
        this.metadataCache = this.app.metadataCache.getFileCache(this.tfile);
        this.frontmatter = this.metadataCache?.frontmatter;
        return this.metadataCache;
    }
    open(leaf: WorkspaceLeaf = this.app.workspace.getMostRecentLeaf()) {
        leaf.openFile(this.tfile);
    }
    getHeadingContent(input: Heading | string | number, withOwnHeading = false) {
        return this.headers.getContent(input, withOwnHeading);
    }
    async updateFrontmatter(frontmatter: FrontMatterCache) {
        await app.fileManager.processFrontMatter(this.tfile, (f) => {
            let f_ = Object.assign({}, this.frontmatter, frontmatter);
            Object.entries(f_).forEach(([k, v]) => (f[k] = v));
        });
        this.getMetadataCache();
        return this.frontmatter;
    }
    async rename(callback: any) {
        await loong.file.rename(this.tfile, callback);
    }
}

class Headers {
    lfile: LFile;
    headings: HeadingCache[];
    headingTree: HeadingTree | HeadingTree[];
    constructor(lfile: LFile) {
        this.lfile = lfile;
        this.headings = this.lfile.metadataCache?.headings;
        if (!this.headings) return;
        this.headingTree = this.buildTree();
    }
    buildTree(): HeadingTree | HeadingTree[] {
        const tree: HeadingTree[] = [];
        let tempNode: HeadingTree[] = Array(6).fill(null);
        for (const heading of this.headings) {
            const current: HeadingTree = { ...heading, children: [], parent: null };
            tempNode[heading.level - 1] = current;
            if (tempNode[heading.level - 2]) {
                current.parent = tempNode[heading.level - 2];
                current.parent.children.push(current);
            } else {
                tree.push(current);
            }
        }
        if (tree.length === 1) return tree[0];
        return tree;
    }
    getContent(input: Heading | string | number, withOwnHeading = false): string {
        let heading: Heading;
        if (typeof input === "string") heading = this.headings.find((h) => h.heading === input);
        else if (typeof input === "number")
            heading = this.headings.find(
                (h) => h.position.start.line === input || h.position.end.line === input - 1
            );
        else heading = input;
        if (!heading) return;
        const content = this.lfile.content;
        return content
            .split("\n")
            .slice(...this.getRange(heading, withOwnHeading))
            .join("\n")
            .trim();
    }
    getRange(heading: Heading, withOwnHeading = false): [number, number] {
        let range: [number, number] = [
            heading.position.start.line + (withOwnHeading ? 0 : 1),
            null,
        ];
        let nextHeading = this.headings.find(
            (h) => h.position.start.line > heading.position.start.line && h.level <= heading.level
        );
        if (!nextHeading) range[1] = this.lfile.content.split("\n").length;
        else range[1] = nextHeading.position.start.line;
        return range;
    }
}

type HeadingTree = HeadingCache & {
    parent: HeadingTree | null;
    children: HeadingTree[];
};
type Heading = HeadingCache | HeadingTree;

function getTAbstractFileByPathOrName(pathOrName: string): TAbstractFile {
    let file = app.vault.getAbstractFileByPath(pathOrName);
    if (!file)
        file = app.vault
            .getAllLoadedFiles()
            .find((f) => f.name == pathOrName || (f as TFile)?.basename == pathOrName);
    return file;
}

class FileGroup {
    constructor(public tfiles: TFile[]) {}
    async batchRename(callback: any): Promise<void> {
        for (const tfile of this.tfiles) await loong.file.rename(tfile, callback);
        new Notice("批量重命名完成", 2000);
    }
    async batchUpdateMetadataCache(k: string | number, v: any) {
        for (const tfile of this.tfiles) {
            await app.fileManager.processFrontMatter(tfile, (f) => {
                f[k] = v;
            });
        }
        new Notice("批量修改完成", 2000);
    }
    async batchModify(callback: (file: TFile) => void | Promise<void>): Promise<void> {
        for (const tfile of this.tfiles) {
            await callback(tfile);
        }
        new Notice("批量修改完成", 2000);
    }
}

class LFolder {
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
    async batchRename(callback: (name: string) => string): Promise<void>;
    async batchRename(callback: (name: string, folder: string) => [string, string]): Promise<void>;
    async batchRename(callback: any): Promise<void> {
        await this.file_groups.batchRename(callback);
    }
    async batchUpdateMetadataCache(k: string | number, v: any) {
        await this.file_groups.batchUpdateMetadataCache(k, v);
    }
    async batchModify(callback: (file: TFile) => void | Promise<void>): Promise<void> {
        await this.file_groups.batchModify(callback);
    }
}

class DV {
    api: DataviewApi;
    constructor(public dv: DataviewInlineApi) {
        this.api = dv.api;
    }
    paragraph(text: any, container: HTMLElement) {
        // @ts-ignore
        return this.dv.paragraph(text, { container });
    }
    table(headers: string[], values: any[][] | DataArray<any>, el: HTMLElement) {
        return this.api.table(headers, values, el, this.dv.component, this.dv.currentFilePath);
    }
    list(values: any[] | DataArray<any>, container: HTMLElement) {
        return this.api.list(values, container, this.dv.component, this.dv.currentFilePath);
    }
    taskList(tasks: Grouping<SListItem>, groupByFile: boolean, container: HTMLElement) {
        return this.api.taskList(
            tasks,
            groupByFile,
            container,
            this.dv.component,
            this.dv.currentFilePath
        );
    }
}
