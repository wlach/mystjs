"use strict";
var __rest = (this && this.__rest) || function (s, e) {
    var t = {};
    for (var p in s) if (Object.prototype.hasOwnProperty.call(s, p) && e.indexOf(p) < 0)
        t[p] = s[p];
    if (s != null && typeof Object.getOwnPropertySymbols === "function")
        for (var i = 0, p = Object.getOwnPropertySymbols(s); i < p.length; i++) {
            if (e.indexOf(p[i]) < 0 && Object.prototype.propertyIsEnumerable.call(s, p[i]))
                t[p[i]] = s[p[i]];
        }
    return t;
};
Object.defineProperty(exports, "__esModule", { value: true });
const state_1 = require("../state");
const utils_1 = require("./utils");
const math = {
    math: {
        token: 'math',
        numbered: state_1.TargetKind.equation,
        skipParsing: true,
        getArguments: () => ({ args: {}, content: '' }),
        getOptions: data => {
            // See https://github.com/sphinx-doc/sphinx/issues/8476
            const { name, label } = data, rest = __rest(data, ["name", "label"]);
            utils_1.unusedOptionsWarning('math', rest);
            return { name: name || label };
        },
        renderer: (args, opts, target) => {
            const { id, number } = target !== null && target !== void 0 ? target : {};
            return [
                'div',
                {
                    class: target ? ['math', 'numbered'] : 'math',
                    id,
                    number
                },
                0
            ];
        }
    }
};
exports.default = math;
//# sourceMappingURL=math.js.map