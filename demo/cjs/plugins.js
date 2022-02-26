"use strict";
var __importDefault = (this && this.__importDefault) || function (mod) {
    return (mod && mod.__esModule) ? mod : { "default": mod };
};
Object.defineProperty(exports, "__esModule", { value: true });
exports.convertFrontMatter = exports.mathPlugin = exports.mystBlockPlugin = exports.docutilsPlugin = exports.deflistPlugin = exports.tasklistPlugin = exports.footnotePlugin = exports.frontMatterPlugin = void 0;
var markdown_it_front_matter_1 = require("markdown-it-front-matter");
Object.defineProperty(exports, "frontMatterPlugin", { enumerable: true, get: function () { return __importDefault(markdown_it_front_matter_1).default; } });
var markdown_it_footnote_1 = require("markdown-it-footnote");
Object.defineProperty(exports, "footnotePlugin", { enumerable: true, get: function () { return __importDefault(markdown_it_footnote_1).default; } });
var markdown_it_task_lists_1 = require("markdown-it-task-lists");
Object.defineProperty(exports, "tasklistPlugin", { enumerable: true, get: function () { return __importDefault(markdown_it_task_lists_1).default; } });
var markdown_it_deflist_1 = require("markdown-it-deflist");
Object.defineProperty(exports, "deflistPlugin", { enumerable: true, get: function () { return __importDefault(markdown_it_deflist_1).default; } });
var markdown_it_docutils_1 = require("markdown-it-docutils");
Object.defineProperty(exports, "docutilsPlugin", { enumerable: true, get: function () { return markdown_it_docutils_1.docutilsPlugin; } });
var markdown_it_myst_extras_1 = require("markdown-it-myst-extras");
Object.defineProperty(exports, "mystBlockPlugin", { enumerable: true, get: function () { return markdown_it_myst_extras_1.mystBlockPlugin; } });
var math_1 = require("./math");
Object.defineProperty(exports, "mathPlugin", { enumerable: true, get: function () { return math_1.plugin; } });
/** Markdown-it plugin to convert the front-matter token to a renderable token, for previews */
function convertFrontMatter(md) {
    md.core.ruler.after('block', 'convert_front_matter', (state) => {
        if (state.tokens.length && state.tokens[0].type === 'front_matter') {
            const replace = new state.Token('fence', 'code', 0);
            replace.map = state.tokens[0].map;
            replace.info = 'yaml';
            replace.content = state.tokens[0].meta;
            state.tokens[0] = replace;
        }
        return true;
    });
}
exports.convertFrontMatter = convertFrontMatter;
//# sourceMappingURL=plugins.js.map