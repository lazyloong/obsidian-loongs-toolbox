import ThePlugin from "main";
import {
    App,
    TFile,
    FrontMatterCache,
    CachedMetadata,
    Notice,
    TFolder,
    WorkspaceLeaf,
    HeadingCache,
} from "obsidian";
import { DataviewInlineApi } from "obsidian-dataview/lib/api/inline-api";
import { DFile } from "./fileTools";
import { getTAbstractFileByPathOrName } from "uilts";
import { RenameArg } from "./fileTools";

export default class LFile {
    app: App;
    plugin: ThePlugin;
    path: string;
    tfile: TFile;
    dfile: DFile;
    content: string;
    headers: Headers;
    tagcontent: TagContent;
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
        this.tagcontent = new TagContent(this);
        return this;
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
    async rename(arg: RenameArg) {
        await loong.file.rename(this.tfile, arg);
    }
    async modify(content: string) {
        await loong.file.modify(this.tfile, content);
    }
    async delete() {
        await loong.file.delete(this.tfile);
    }
}

class Headers {
    headings: HeadingCache[];
    headingTree: HeadingTree | HeadingTree[];
    content: string;
    constructor(file: LFile) {
        this.content = file.content;
        this.headings = file.metadataCache?.headings;
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
        return this.content
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
        if (!nextHeading) range[1] = this.content.split("\n").length;
        else range[1] = nextHeading.position.start.line;
        return range;
    }
}

type HeadingTree = HeadingCache & {
    parent: HeadingTree | null;
    children: HeadingTree[];
};
type Heading = HeadingCache | HeadingTree;

class TagContent {
    content: string;
    tags: string[];
    yamlTags: string[];
    paragraphTags: string[];
    tagParagraphs: Record<string, string[]> = {};
    tagLines: Record<string, string[]> = {};
    constructor(public file: LFile) {
        this.content = this.file.content;
        this.init();
    }
    init() {
        const { tags, sections } = this.file.metadataCache;
        this.yamlTags =
            this.file.metadataCache?.frontmatter?.tag ||
            this.file.metadataCache?.frontmatter?.tags ||
            [];
        this.yamlTags = this.yamlTags.map((p) => "#" + p);
        this.paragraphTags = tags ? Array.from(new Set(tags.map((t) => t.tag))) : [];
        this.tags = this.yamlTags.concat(this.paragraphTags);
        if (!tags || !sections) return;
        tags.forEach((t) => {
            this.tagParagraphs[t.tag] = [];
            this.tagLines[t.tag] = [];
        });
        let paragraphs = this.file.metadataCache.sections.filter((s) => s.type === "paragraph");
        tags.forEach((t) => {
            this.tagLines[t.tag].push(this.content.split("\n")[t.position.start.line]);
            const paragraph = paragraphs.find(
                (p) =>
                    p.position.start.line <= t.position.start.line &&
                    t.position.end.line <= p.position.end.line
            );
            let { start, end } = paragraph.position;
            this.tagParagraphs[t.tag].push(this.content.slice(start.offset, end.offset));
        });
    }
    render(
        dv: DataviewInlineApi,
        withLines: boolean = true,
        container: HTMLElement = dv.container
    ) {
        const dv_ = loong.getDv(dv);
        let temp = withLines ? this.tagLines : this.tagParagraphs;
        let c = Object.entries(temp);
        let d = c.map(([k, v]) => {
            let div = container.createDiv();
            dv_.list(v, div);
            return [k.slice(1), div];
        });
        dv.table(["tag", "内容"], d);
    }
    hasTag(tag: string, type: "all" | "yaml" | "paragraph" = "all"): boolean {
        switch (type) {
            case "all":
                return this.tags.includes(tag);
            case "paragraph":
                return this.yamlTags.includes(tag);
            case "yaml":
                return this.paragraphTags.includes(tag);
        }
    }
}
