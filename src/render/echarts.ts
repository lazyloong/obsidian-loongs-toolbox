import ThePlugin from "main";
import { DataArray } from "obsidian-dataview";
import { DataviewInlineApi } from "obsidian-dataview/lib/api/inline-api";
import { DFile } from "types";

export async function yearFileLine(
    year: number,
    files: DataArray<DFile>,
    dv: DataviewInlineApi,
    container: HTMLElement,
    plugin: ThePlugin
) {
    let api = plugin.getAuxiliaryPluginsAPI("obsidian-echarts");
    if (!api) return;
    let month_labels = Array(12)
        .fill(0)
        .map((_, i) => i + 1);
    let data = Array(12).fill(0);
    let f = files.filter((p) => p.date && p.date.year == year).groupBy((p) => p.date.month);
    for (let j of f) data[j.key - 1] = j.rows.length;

    const option = {
        tooltip: {
            trigger: "axis",
            axisPointer: {
                type: "shadow",
            },
        },
        backgroundColor: "#00000000",
        xAxis: {
            name: "月份",
            data: month_labels,
        },
        yAxis: { name: "数量" },
        series: [
            {
                type: "line",
                name: "评分",
                data: data,
                label: {
                    show: true, // 是否显示标签
                    color: "#ffffff",
                    position: "top", // 标签的位置在顶部
                    formatter: (params) => {
                        if (parseInt(params.name) - 1 > moment().month())
                            return `{no|${params.data}}`;
                        return params.data;
                    },
                    rich: {
                        no: {
                            color: "#64656d",
                        },
                    },
                },
            },
        ],
    };
    let chart = await api.render(option, container);
    let div = container.createDiv();
    chart.chart.on("click", (p) => {
        div.empty();
        monthFileLine(year, p.dataIndex, files, dv, div, plugin);
    });
    return chart;
}

export async function monthFileLine(
    year: number,
    month: number,
    files: DataArray<DFile>,
    dv: DataviewInlineApi,
    container: HTMLElement,
    plugin: ThePlugin
) {
    let api = plugin.getAuxiliaryPluginsAPI("obsidian-echarts");
    if (!api) return;
    let d = moment({ year, month }).daysInMonth();

    let month_labels = Array(d)
        .fill(0)
        .map((_, i) => i + 1);
    let data = Array(d).fill(0);
    let f = files
        .filter((p) => p.date && p.date.year == year && p.date.month == month + 1)
        .groupBy((p) => p.date.day);
    let group_files = [];
    for (let i of f) {
        data[i.key - 1] = i.rows.length;
        group_files[i.key - 1] = i.rows;
    }

    const option = {
        tooltip: {
            trigger: "axis",
            axisPointer: {
                type: "shadow",
            },
        },
        backgroundColor: "#00000000",
        xAxis: {
            name: "月份",
            data: month_labels,
        },
        yAxis: {
            name: "数量",
        },
        series: [
            {
                type: "line",
                name: "评分",
                data: data,
                label: {
                    show: true, // 是否显示标签
                    color: "#ffffff",
                    position: "top", // 标签的位置在顶部
                    formatter: (params) => {
                        if (parseInt(params.name) > moment().date()) return `{no|${params.data}}`;
                        return params.data;
                    },
                    rich: {
                        no: {
                            color: "#64656d",
                        },
                    },
                },
            },
        ],
    };
    let chart = await api.render(option, container);
    let fileDiv = container.createDiv();
    chart.chart.on("click", (p) => {
        fileDiv.empty();
        // @ts-ignore
        dv.paragraph(`${month + 1} 月 ${p.dataIndex + 1} 日`, { container: fileDiv });
        dv.api.list(
            group_files[p.dataIndex].map((p) => p.file.link),
            fileDiv,
            dv.component,
            dv.currentFilePath
        );
    });
    return chart;
}
