import yaml from 'js-yaml';
export function getFrontmatter(tree, remove = true) {
    const possibleYaml = tree.children[0];
    if ((possibleYaml === null || possibleYaml === void 0 ? void 0 : possibleYaml.type) !== 'code' || (possibleYaml === null || possibleYaml === void 0 ? void 0 : possibleYaml.lang) !== 'yaml')
        return undefined;
    const data = yaml.load(possibleYaml.value);
    if (remove)
        tree.children.splice(0, 1);
    return data;
}
//# sourceMappingURL=actions.js.map