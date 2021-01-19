"use strict";
var __importDefault = (this && this.__importDefault) || function (mod) {
    return (mod && mod.__esModule) ? mod : { "default": mod };
};
Object.defineProperty(exports, "__esModule", { value: true });
const admonition_1 = __importDefault(require("./admonition"));
const figure_1 = __importDefault(require("./figure"));
const math_1 = __importDefault(require("./math"));
const directives = Object.assign(Object.assign(Object.assign({}, admonition_1.default), figure_1.default), math_1.default);
exports.default = directives;
//# sourceMappingURL=default.js.map