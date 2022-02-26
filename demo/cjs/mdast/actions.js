"use strict";
var __importDefault = (this && this.__importDefault) || function (mod) {
    return (mod && mod.__esModule) ? mod : { "default": mod };
};
Object.defineProperty(exports, "__esModule", { value: true });
exports.getFrontmatter = void 0;
const js_yaml_1 = __importDefault(require("js-yaml"));
function getFrontmatter(tree, remove = true) {
    const possibleYaml = tree.children[0];
    if ((possibleYaml === null || possibleYaml === void 0 ? void 0 : possibleYaml.type) !== 'code' || (possibleYaml === null || possibleYaml === void 0 ? void 0 : possibleYaml.lang) !== 'yaml')
        return undefined;
    const data = js_yaml_1.default.load(possibleYaml.value);
    if (remove)
        tree.children.splice(0, 1);
    return data;
}
exports.getFrontmatter = getFrontmatter;
//# sourceMappingURL=actions.js.map