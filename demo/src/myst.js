"use strict";
var __createBinding = (this && this.__createBinding) || (Object.create ? (function(o, m, k, k2) {
    if (k2 === undefined) k2 = k;
    Object.defineProperty(o, k2, { enumerable: true, get: function() { return m[k]; } });
}) : (function(o, m, k, k2) {
    if (k2 === undefined) k2 = k;
    o[k2] = m[k];
}));
var __setModuleDefault = (this && this.__setModuleDefault) || (Object.create ? (function(o, v) {
    Object.defineProperty(o, "default", { enumerable: true, value: v });
}) : function(o, v) {
    o["default"] = v;
});
var __importStar = (this && this.__importStar) || function (mod) {
    if (mod && mod.__esModule) return mod;
    var result = {};
    if (mod != null) for (var k in mod) if (k !== "default" && Object.prototype.hasOwnProperty.call(mod, k)) __createBinding(result, mod, k);
    __setModuleDefault(result, mod);
    return result;
};
var __importDefault = (this && this.__importDefault) || function (mod) {
    return (mod && mod.__esModule) ? mod : { "default": mod };
};
Object.defineProperty(exports, "__esModule", { value: true });
exports.MyST = exports.defaultOptions = void 0;
const markdown_it_1 = __importDefault(require("markdown-it"));
const plugins = __importStar(require("./plugins"));
const directives_1 = require("./directives");
const roles_1 = require("./roles");
exports.defaultOptions = {
    directives: directives_1.directives,
    roles: roles_1.roles,
    math: true,
    markdownit: { html: false },
};
function MyST(opts = exports.defaultOptions) {
    const tokenizer = markdown_it_1.default('commonmark', opts.markdownit);
    if (opts.math)
        tokenizer.use(plugins.math);
    tokenizer.use(plugins.blocks);
    tokenizer.use(plugins.directives(directives_1.directives));
    tokenizer.use(plugins.roles(roles_1.roles));
    return tokenizer;
}
exports.MyST = MyST;
//# sourceMappingURL=myst.js.map