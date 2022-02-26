import rehypeFormat from 'rehype-format';
export const formatHtml = function formatHtml(opt) {
    if (!opt)
        return () => undefined;
    return rehypeFormat(typeof opt === 'boolean' ? {} : opt);
};
//# sourceMappingURL=unified.js.map