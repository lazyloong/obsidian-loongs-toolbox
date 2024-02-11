import uiltsFunctions from "./src/uiltsFunction";
import { PageMetadata, Literal, DataObject } from "obsidian-dataview";
import moment from "moment";

interface DFile extends DataObject {
    file?: PageMetadata;
}

// Empty declaration to allow for css imports
declare module "*.css" {}
declare global {
    var loong: uiltsFunctions;
    var moment: moment;
}
