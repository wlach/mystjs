"use strict";
var __importDefault = (this && this.__importDefault) || function (mod) {
    return (mod && mod.__esModule) ? mod : { "default": mod };
};
Object.defineProperty(exports, "__esModule", { value: true });
exports.plugin = exports.roles = void 0;
const html_1 = __importDefault(require("./html"));
const math_1 = __importDefault(require("./math"));
const references_1 = __importDefault(require("./references"));
const generic_1 = __importDefault(require("./generic"));
exports.roles = Object.assign(Object.assign(Object.assign(Object.assign({}, html_1.default), math_1.default), references_1.default), generic_1.default);
var plugin_1 = require("./plugin");
Object.defineProperty(exports, "plugin", { enumerable: true, get: function () { return plugin_1.plugin; } });
//# sourceMappingURL=index.js.map