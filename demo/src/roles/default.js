"use strict";
var __importDefault = (this && this.__importDefault) || function (mod) {
    return (mod && mod.__esModule) ? mod : { "default": mod };
};
Object.defineProperty(exports, "__esModule", { value: true });
const html_1 = __importDefault(require("./html"));
const math_1 = __importDefault(require("./math"));
const references_1 = __importDefault(require("./references"));
const generic_1 = __importDefault(require("./generic"));
const roles = Object.assign(Object.assign(Object.assign(Object.assign({}, html_1.default), math_1.default), references_1.default), generic_1.default);
exports.default = roles;
//# sourceMappingURL=default.js.map