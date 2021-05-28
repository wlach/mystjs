"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
const types_1 = require("./types");
const QUICK_PARAMETERS = /^:([a-zA-Z0-9\-_]+):(.*)$/;
function stripParams(content) {
    const data = {};
    let stopParams = false;
    const modified = content.split('\n').reduce((lines, line) => {
        const match = line.match(QUICK_PARAMETERS);
        if (stopParams || !match) {
            stopParams = true;
            return [...lines, line];
        }
        const [, key, value] = match;
        if (data[key] !== undefined) {
            console.warn(`There are multiple keys defined for ${key}: ${data[key]} and ${value.trim()}`);
        }
        data[key] = value.trim();
        return lines;
    }, []);
    return { data, modified: modified.join('\n') };
}
function stripYaml(content) {
    const data = {};
    return { data, modified: content };
}
function addDirectiveOptions(directive, parent, tokens, index, isFence = false) {
    const [open, token, close] = tokens.slice(index - 1, index + 2);
    const useToken = isFence ? parent : token;
    const { content } = useToken;
    const firstLine = content.split('\n')[0].trim();
    const isYaml = firstLine === '---';
    const isQuickParams = QUICK_PARAMETERS.test(firstLine);
    if (!isYaml && !isQuickParams) {
        const opts = directive.getOptions({});
        // eslint-disable-next-line no-param-reassign
        parent.meta = Object.assign(Object.assign({}, parent.meta), { opts });
        return;
    }
    const strip = isYaml ? stripYaml : stripParams;
    const { data, modified } = strip(useToken.content);
    const opts = directive.getOptions(data);
    // eslint-disable-next-line no-param-reassign
    parent.meta = Object.assign(Object.assign({}, parent.meta), { opts });
    useToken.content = modified;
    // Here we will stop the tags from rendering if there is no content that is not metadata
    // This stops empty paragraph tags from rendering.
    const noContent = modified.length === 0;
    if (!isFence && open && noContent)
        open.hidden = true;
    useToken.hidden = noContent;
    if (!isFence && close && noContent)
        close.hidden = true;
}
const parseOptions = (directives) => state => {
    var _a, _b;
    const { tokens } = state;
    let parent = false;
    let directive = false;
    let gotOptions = false;
    for (let index = 0; index < tokens.length; index += 1) {
        const token = tokens[index];
        if (token.type === types_1.DirectiveTokens.open) {
            directive = directives[(_a = token.attrGet('kind')) !== null && _a !== void 0 ? _a : ''];
            parent = token;
            gotOptions = false;
        }
        if (token.type === types_1.DirectiveTokens.close) {
            if (parent) {
                // Ensure there is metadata always defined for containers
                const meta = Object.assign({ opts: {} }, parent.meta);
                parent.meta = meta;
                token.meta = meta;
            }
            parent = false;
        }
        if (token.type === types_1.DirectiveTokens.fence) {
            addDirectiveOptions(directives[(_b = token.attrGet('kind')) !== null && _b !== void 0 ? _b : ''], token, tokens, index, true);
        }
        if (parent && !gotOptions && token.type === 'inline') {
            addDirectiveOptions(directive, parent, tokens, index);
            gotOptions = true;
        }
    }
    return true;
};
exports.default = parseOptions;
//# sourceMappingURL=options.js.map