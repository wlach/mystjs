"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.blocksPlugin = void 0;
const utils_1 = require("markdown-it/lib/common/utils");
const state_1 = require("./state");
// % A comment
const COMMENT_PATTERN = /^%\s(.*)$/;
// (my_id)=
const TARGET_PATTERN = /^\(([a-zA-Z0-9|@<>*./_\-+:]{1,100})\)=\s*$/;
// +++ {"meta": "data"}
const BLOCK_BREAK_PATTERN = /^\+\+\+\s?(\{.*\})?$/;
function checkTarget(state, startLine, str, silent) {
    var _a;
    const match = TARGET_PATTERN.exec(str);
    if (match == null)
        return false;
    if (silent)
        return true;
    state.line = startLine + 1;
    const token = state.push('myst_target', '', 0);
    const id = (_a = match === null || match === void 0 ? void 0 : match[1]) !== null && _a !== void 0 ? _a : '';
    token.attrSet('id', id);
    token.map = [startLine, state.line];
    state_1.newTarget(state, id, state_1.TargetKind.ref);
    return true;
}
function checkComment(state, startLine, str, silent) {
    var _a;
    const match = COMMENT_PATTERN.exec(str);
    if (match == null)
        return false;
    if (silent)
        return true;
    state.line = startLine + 1;
    const token = state.push('myst_comment', '', 0);
    const comment = (_a = match === null || match === void 0 ? void 0 : match[1]) !== null && _a !== void 0 ? _a : '';
    token.attrSet('comment', comment);
    token.map = [startLine, state.line];
    return true;
}
function checkBlockBreak(state, startLine, str, silent) {
    var _a;
    const match = BLOCK_BREAK_PATTERN.exec(str);
    if (match == null)
        return false;
    if (silent)
        return true;
    state.line = startLine + 1;
    const token = state.push('myst_block_break', '', 0);
    const metadataString = (_a = match === null || match === void 0 ? void 0 : match[1]) !== null && _a !== void 0 ? _a : '{}';
    let metadata = {};
    try {
        metadata = JSON.parse(metadataString);
    }
    catch (error) {
        console.warn('Could not parse metadata for block break: ', metadataString);
    }
    token.meta = Object.assign(Object.assign({}, token.meta), { metadata });
    token.map = [startLine, state.line];
    return true;
}
const blockPlugins = [checkTarget, checkComment, checkBlockBreak];
function blocks(state, startLine, endLine, silent) {
    const pos = state.bMarks[startLine] + state.tShift[startLine];
    const maximum = state.eMarks[startLine];
    // if it's indented more than 3 spaces, it should be a code block
    if (state.sCount[startLine] - state.blkIndent >= 4)
        return false;
    const str = state.src.slice(pos, maximum);
    return blockPlugins.reduce((complete, plugin) => (complete || plugin(state, startLine, str, silent)), false);
}
const renderTarget = (tokens, idx, opts, env) => {
    var _a, _b;
    const ref = (_a = tokens[idx].attrGet('id')) !== null && _a !== void 0 ? _a : '';
    const id = (_b = env.targets[ref]) === null || _b === void 0 ? void 0 : _b.id;
    // TODO: This should be better as part of the next element, and then hide this
    return (`<span id="${id}"></span>\n`);
};
const renderComment = (tokens, idx) => {
    var _a;
    const comment = (_a = tokens[idx].attrGet('comment')) !== null && _a !== void 0 ? _a : '';
    return (`<!-- ${utils_1.escapeHtml(comment)} -->\n`);
};
const renderBlockBreak = (tokens, idx) => {
    const { metadata } = tokens[idx].meta;
    console.log('Not sure what to do with metadata for block break:', metadata);
    return ('<!-- Block Break -->\n');
};
const addBlockTitles = (state) => {
    var _a;
    const { tokens } = state;
    const env = state_1.getStateEnv(state);
    for (let index = 0; index < tokens.length; index += 1) {
        const prev = tokens[index - 1];
        const token = tokens[index];
        const next = tokens[index + 1];
        if ((prev === null || prev === void 0 ? void 0 : prev.type) === 'myst_target' && token.type === 'heading_open') {
            const id = (_a = prev.attrGet('id')) !== null && _a !== void 0 ? _a : '';
            // TODO: Should likely have this actually be the rendered content?
            env.targets[id].title = utils_1.escapeHtml(next.content);
        }
    }
    return true;
};
const updateLinkHrefs = (state) => {
    const { tokens } = state;
    const env = state_1.getStateEnv(state);
    for (let index = 0; index < tokens.length; index += 1) {
        const token = tokens[index];
        if (token.type === 'inline' && token.children) {
            token.children.forEach((t) => {
                var _a, _b;
                if (t.type === 'link_open') {
                    const target = env.targets[(_a = t.attrGet('href')) !== null && _a !== void 0 ? _a : ''];
                    if (target) {
                        t.attrSet('title', (_b = target.title) !== null && _b !== void 0 ? _b : '');
                        t.attrSet('href', `#${target.id}`);
                    }
                }
            });
        }
    }
    return true;
};
function blocksPlugin(md) {
    md.block.ruler.before('hr', 'myst_blocks', blocks, { alt: ['paragraph', 'reference', 'blockquote', 'list', 'footnote_def'] });
    md.core.ruler.after('block', 'add_block_titles', addBlockTitles);
    md.core.ruler.after('inline', 'update_link_hrefs', updateLinkHrefs);
    md.renderer.rules.myst_target = renderTarget;
    md.renderer.rules.myst_comment = renderComment;
    md.renderer.rules.myst_block_break = renderBlockBreak;
}
exports.blocksPlugin = blocksPlugin;
//# sourceMappingURL=blocks.js.map