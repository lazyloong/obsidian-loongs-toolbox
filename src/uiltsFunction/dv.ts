import { DataviewApi, DataArray } from "obsidian-dataview";
import { DataviewInlineApi } from "obsidian-dataview/lib/api/inline-api";
import { SListItem } from "obsidian-dataview/lib/data-model/serialized/markdown";
import { DFile } from "./fileTools";

export default class DV {
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
    taskList(
        tasks: DataArray<SListItem>,
        groupByFile: boolean,
        container: HTMLElement,
        sort = (t: DFile) => t.file.name
    ) {
        if (groupByFile)
            tasks
                .groupBy((p) => p.path)
                .sort((p) => sort(this.dv.page(p.key)))
                .forEach((p) => {
                    this.api.taskList(
                        p.rows,
                        false,
                        container,
                        this.dv.component,
                        this.dv.currentFilePath
                    );
                });
        return this.api.taskList(
            tasks,
            groupByFile,
            container,
            this.dv.component,
            this.dv.currentFilePath
        );
    }
}
