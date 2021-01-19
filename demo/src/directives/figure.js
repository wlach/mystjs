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
const figure = {
    figure: {
        token: 'figure',
        numbered: state_1.TargetKind.figure,
        autoNumber: true,
        getArguments: (info) => {
            const args = { src: info.trim() };
            return { args, content: '' };
        },
        getOptions: (data) => {
            const { name } = data, rest = __rest(data, ["name"]);
            utils_1.unusedOptionsWarning('figure', rest);
            return { name };
        },
        renderer: (args, opts, target) => {
            const { src } = args;
            const { id, number } = target !== null && target !== void 0 ? target : {};
            return [
                'figure', { id, class: 'numbered' },
                ['img', { src }],
                ['figcaption', { number }, 0],
            ];
        },
    },
};
exports.default = figure;
//# sourceMappingURL=figure.js.map