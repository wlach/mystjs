"use strict";
var __importDefault = (this && this.__importDefault) || function (mod) {
    return (mod && mod.__esModule) ? mod : { "default": mod };
};
Object.defineProperty(exports, "__esModule", { value: true });
exports.defaultOpts = exports.defaultPlugins = void 0;
const markdown_it_1 = __importDefault(require("markdown-it"));
const roles_1 = require("./roles");
const directives_1 = require("./directives");
const blocks_1 = require("./blocks");
const math_1 = require("./math");
const default_1 = __importDefault(require("./directives/default"));
const default_2 = __importDefault(require("./roles/default"));
exports.defaultPlugins = { directives: default_1.default, roles: default_2.default, math: true };
exports.defaultOpts = { html: false };
function MyST(plugins = exports.defaultPlugins, opts = exports.defaultOpts) {
    const tokenizer = markdown_it_1.default('commonmark', opts);
    if (plugins.math)
        tokenizer.use(math_1.mathPlugin);
    tokenizer.use(blocks_1.blocksPlugin);
    tokenizer.use(directives_1.directivesPlugin(plugins.directives));
    tokenizer.use(roles_1.rolePlugin(plugins.roles));
    return tokenizer;
}
exports.default = MyST;
//# sourceMappingURL=index.js.map