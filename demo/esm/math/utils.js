import { toHTML } from '../utils';
export const renderMath = (math, block, target) => {
    const { id, number } = target !== null && target !== void 0 ? target : {};
    const [html] = toHTML([
        block ? 'div' : 'span',
        {
            class: target ? ['math', 'numbered'] : 'math',
            id,
            number,
            children: block ? `\\[\n${math}\n\\]` : `\\(${math}\\)`,
        },
    ], { inline: true });
    return block ? `${html}\n` : html;
};
//# sourceMappingURL=utils.js.map