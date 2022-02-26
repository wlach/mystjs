import { u } from 'unist-builder';
import { withoutTrailingNewline } from './utils';
/** MarkdownParseState tracks the context of a running token stream.
 *
 * Loosly based on prosemirror-markdown
 */
export class MarkdownParseState {
    constructor(handlers) {
        this.stack = [u('root', [])];
        this.handlers = getTokenHandlers(handlers);
    }
    top() {
        return this.stack[this.stack.length - 1];
    }
    addNode(node) {
        var _a;
        const top = this.top();
        if (this.stack.length && node && 'children' in top)
            (_a = top.children) === null || _a === void 0 ? void 0 : _a.push(node);
        return node;
    }
    addText(text, type = 'text', attrs) {
        var _a, _b;
        const top = this.top();
        const value = text;
        if (!value || !this.stack.length || !type || !('children' in top))
            return;
        const last = (_a = top.children) === null || _a === void 0 ? void 0 : _a[top.children.length - 1];
        if (type === 'text' && (last === null || last === void 0 ? void 0 : last.type) === type) {
            // The last node is also text, merge it with a space
            last.value += `${value}`;
            return last;
        }
        const node = Object.assign(Object.assign({ type }, attrs), { value });
        (_b = top.children) === null || _b === void 0 ? void 0 : _b.push(node);
        return node;
    }
    openNode(type, attrs, isLeaf = false) {
        const node = Object.assign({ type }, attrs);
        if (!isLeaf)
            node.children = [];
        this.stack.push(node);
    }
    closeNode() {
        const node = this.stack.pop();
        return this.addNode(node);
    }
    parseTokens(tokens) {
        tokens === null || tokens === void 0 ? void 0 : tokens.forEach((token, index) => {
            if (token.hidden)
                return;
            const handler = this.handlers[token.type];
            if (!handler)
                throw new Error('Token type `' + token.type + '` not supported by tokensToMyst parser');
            handler(this, token, tokens, index);
        });
    }
}
function attrs(spec, token, tokens, index) {
    var _a;
    const attrs = ((_a = spec.getAttrs) === null || _a === void 0 ? void 0 : _a.call(spec, token, tokens, index)) || spec.attrs || {};
    if ('type' in attrs)
        throw new Error('You can not have "type" as attrs.');
    if ('children' in attrs)
        throw new Error('You can not have "children" as attrs.');
    return attrs;
}
function noCloseToken(spec, type) {
    return (spec.noCloseToken ||
        type == 'code_inline' ||
        type == 'code_block' ||
        type == 'fence');
}
function getTokenHandlers(specHandlers) {
    const handlers = {};
    Object.entries(specHandlers).forEach(([type, spec]) => {
        const nodeType = spec.type;
        if (noCloseToken(spec, type)) {
            handlers[type] = (state, tok, tokens, i) => {
                if (spec.isText) {
                    state.addText(withoutTrailingNewline(tok.content), spec.type, attrs(spec, tok, tokens, i));
                    return;
                }
                state.openNode(nodeType, attrs(spec, tok, tokens, i), spec.isLeaf);
                state.addText(withoutTrailingNewline(tok.content));
                state.closeNode();
            };
        }
        else {
            handlers[type + '_open'] = (state, tok, tokens, i) => state.openNode(nodeType, attrs(spec, tok, tokens, i));
            handlers[type + '_close'] = (state) => state.closeNode();
        }
    });
    handlers.text = (state, tok) => state.addText(tok.content);
    handlers.inline = (state, tok) => state.parseTokens(tok.children);
    handlers.softbreak = handlers.softbreak || ((state) => state.addText('\n'));
    return handlers;
}
//# sourceMappingURL=fromMarkdown.js.map