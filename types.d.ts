import uiltsFunctions from "./src/uiltsFunction";
import moment from "moment";

// Empty declaration to allow for css imports
declare module "*.css" {}
declare global {
    var loong: uiltsFunctions;
    var moment: moment;
}
