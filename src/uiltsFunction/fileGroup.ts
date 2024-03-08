import { TFile, Notice } from "obsidian";
import { RenameArg } from "./fileTools";

export default class FileGroup {
    constructor(public tfiles: TFile[]) {}
    async batchRename(arg: RenameArg): Promise<void> {
        for (const tfile of this.tfiles) await loong.file.rename(tfile, arg);
        new Notice("批量重命名完成", 2000);
    }
    async batchUpdateMetadataCache(k: string | number, v: any) {
        for (const tfile of this.tfiles)
            await app.fileManager.processFrontMatter(tfile, (f) => {
                f[k] = v;
            });
        new Notice("批量修改完成", 2000);
    }
    async batchDealWith(callback: (file: TFile) => void | Promise<void>): Promise<void> {
        for (const tfile of this.tfiles) await callback(tfile);
        new Notice("批量处理完成", 2000);
    }
}
