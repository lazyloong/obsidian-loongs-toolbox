import {
    App,
    CachedMetadata,
    Command,
    FrontMatterCache,
    HeadingCache,
    Plugin_2,
    TAbstractFile,
    TFile,
    WorkspaceLeaf,
} from "obsidian";
import ThePlugin from "./main";

export default class uiltsFunctions {
    api: any;
    plugin: ThePlugin;
    app: App;
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
        return this.app.vault.getAbstractFileByPath(path);
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
        this.tfile = app.vault.getAbstractFileByPath(this.path) as TFile;
        let api = this.plugin.getAuxiliaryPluginsAPI("dataview");
        if (api) this.dfile = api.page(this.path);
        if (!this.tfile) {
            this.path = this.dfile
                ? this.dfile.file.path
                : app.vault.getFiles().find((f) => f.basename === this.path).path;
            this.tfile = app.vault.getAbstractFileByPath(this.path) as TFile;
        }
        this.content = await this.app.vault.readRaw(this.path);
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
