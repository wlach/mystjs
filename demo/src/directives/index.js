"use strict";
var __importDefault = (this && this.__importDefault) || function (mod) {
    return (mod && mod.__esModule) ? mod : { "default": mod };
};
Object.defineProperty(exports, "__esModule", { value: true });
exports.plugin = exports.directives = void 0;
const admonition_1 = __importDefault(require("./admonition"));
const figure_1 = __importDefault(require("./figure"));
const math_1 = __importDefault(require("./math"));
exports.directives = Object.assign(Object.assign(Object.assign({}, admonition_1.default), figure_1.default), math_1.default);
var plugin_1 = require("./plugin");
Object.defineProperty(exports, "plugin", { enumerable: true, get: function () { return plugin_1.plugin; } });
//# sourceMappingURL=index.js.map