"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.debounce = debounce;
function debounce(callback, duration) {
    let timeoutId;
    return (...args) => {
        if (timeoutId) {
            clearTimeout(timeoutId);
        }
        timeoutId = setTimeout(() => {
            callback(...args);
        }, duration);
    };
}
