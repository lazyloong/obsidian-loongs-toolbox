import uiltsFunctions from "./src/uiltsFunction";
import { PageMetadata, Literal } from "obsidian-dataview";
import moment from "moment";

type DFile = Record<string, Literal> & {
    file: PageMetadata;
};

// Empty declaration to allow for css imports
declare module "*.css" {}
declare global {
    var loong: uiltsFunctions;
    var moment: moment;
}
