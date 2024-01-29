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
import ThePlugin from "./main";
import BiliFavlist from "./web/bilibili";
import ZhihuFavlist from "./web/zhihu";
import JuejinFavlist from "./web/juejin";
import WebParser, { WebData, WebDataType } from "./web/webParser";

export default class uiltsFunctions {
    api: any;
    plugin: ThePlugin;
    app: App;
    webData: WebData;
    plugins: Plugin_2[];
    constructor(plugin: ThePlugin) {
        this.plugin = plugin;
        this.app = this.plugin.app;
        this.plugins = this.app.plugins.plugins;
        globalThis.loong = this;
    }
    unload() {
        delete globalThis.loong;
    }
    getTFile(path: string): TAbstractFile {
        return getTAbstractFileByPathOrName(path);
    }
    getLFolder(path: string): LFolder {
        return new LFolder(path, this.plugin);
    }
    getLFile(path: string): LFile {
        return new LFile(path, this.plugin);
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
    pages(query: string): LFile[] {
        let api = this.plugin.getAuxiliaryPluginsAPI("dataview");
        if (api)
            return api
                .pages(query)
                .map((p: { file: { path: string } }) => this.getLFile(p.file.path));
        else return;
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
}

class LFile {
    app: App;
    plugin: ThePlugin;
    path: string;
    tfile: TFile;
    dfile: any;
    content: string;
    headers: Headers;
    frontmatter: FrontMatterCache;
    metadataCache: CachedMetadata;
    constructor(path: string, plugin: ThePlugin) {
        this.plugin = plugin;
        this.app = plugin.app;
        this.path = path;
        this.update();
    }
    async update() {
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
        this.updateMetadataCache();
        this.headers = new Headers(this);
    }
    updateMetadataCache() {
        this.metadataCache = this.app.metadataCache.getFileCache(this.tfile);
        this.frontmatter = this.metadataCache?.frontmatter;
        return this.metadataCache;
    }
    open(leaf?: WorkspaceLeaf) {
        if (leaf) leaf.openFile(this.tfile);
        else this.app.workspace.getMostRecentLeaf().openFile(this.tfile);
    }
    getHeadingContent(input: Heading | string | number, withOwnHeading = false) {
        return this.headers.getContent(input, withOwnHeading);
    }
    async updateFrontmatter(frontmatter: FrontMatterCache) {
        await app.fileManager.processFrontMatter(this.tfile, (f) => {
            let f_ = Object.assign({}, this.frontmatter, frontmatter);
            Object.entries(f_).forEach(([k, v]) => (f[k] = v));
        });
        this.updateMetadataCache();
        return this.frontmatter;
    }
    async rename(callback: (name: string) => string): Promise<void>;
    async rename(callback: (name: string, folder: string) => [string, string]): Promise<void>;
    async rename(callback: Function): Promise<void> {
        if (callback.length == 1) {
            let newName = callback(this.tfile.name);
            await this.app.fileManager.renameFile(
                this.tfile,
                `${this.tfile.parent.path}/${newName}`
            );
        } else if (callback.length == 2) {
            let [newName, newFolder] = callback(this.tfile.path, this.path);
            newFolder = this.tfile.parent.parent.path.replace(this.path, newFolder);
            await this.app.fileManager.renameFile(this.tfile, `${newFolder}/${newName}`);
        }
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

class LFolder {
    plugin: ThePlugin;
    path: string;
    app: App;
    tfolder: TFolder;
    tfiles: TFile[];
    dfiles: any[];
    direct_tfiles: TFile[];
    constructor(path: string, plugin: ThePlugin) {
        this.path = path;
        this.plugin = plugin;
        this.app = plugin.app;
        this.update();
    }
    update() {
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
        let api = this.plugin.getAuxiliaryPluginsAPI("dataview");
        if (api) this.dfiles = api.pages(`"${this.path}"`);
    }
    async batchRename(callback: (name: string) => string): Promise<void>;
    async batchRename(callback: (name: string, folder: string) => [string, string]): Promise<void>;
    async batchRename(callback: Function): Promise<void> {
        for (const tfile of this.tfiles) {
            if (callback.length == 1) {
                let newName = callback(tfile.name);
                await this.app.fileManager.renameFile(tfile, `${tfile.parent.path}/${newName}`);
            } else if (callback.length == 2) {
                let [newName, newFolder] = callback(tfile.path, this.path);
                newFolder = tfile.parent.parent.path.replace(this.path, newFolder);
                await this.app.fileManager.renameFile(tfile, `${newFolder}/${newName}`);
            }
        }
        new Notice("批量重命名完成", 2000);
    }
    async batchUpdateMetadataCache(k: string | number, v: any) {
        for (const tfile of this.tfiles) {
            await app.fileManager.processFrontMatter(tfile, (f) => {
                f[k] = v;
            });
        }
    }
    async batchModify(callback: (file: TFile) => void | Promise<void>): Promise<void> {
        for (const tfile of this.tfiles) {
            await callback(tfile);
        }
        new Notice("批量修改完成", 2000);
    }
}
