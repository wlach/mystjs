"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.unusedOptionsWarning = void 0;
const unusedOptionsWarning = (kind, opts) => {
    if (Object.keys(opts).length > 0) {
        console.warn(`Unknown ${kind} options`, opts);
    }
};
exports.unusedOptionsWarning = unusedOptionsWarning;
//# sourceMappingURL=utils.js.map