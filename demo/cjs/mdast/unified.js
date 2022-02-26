"use strict";
var __importDefault = (this && this.__importDefault) || function (mod) {
    return (mod && mod.__esModule) ? mod : { "default": mod };
};
Object.defineProperty(exports, "__esModule", { value: true });
exports.formatHtml = void 0;
const rehype_format_1 = __importDefault(require("rehype-format"));
const formatHtml = function formatHtml(opt) {
    if (!opt)
        return () => undefined;
    return (0, rehype_format_1.default)(typeof opt === 'boolean' ? {} : opt);
};
exports.formatHtml = formatHtml;
//# sourceMappingURL=unified.js.map