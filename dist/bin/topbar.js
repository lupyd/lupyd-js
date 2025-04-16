"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.loadingBar = void 0;
var loadingBar;
(function (loadingBar) {
    const bar = document.getElementById("progress-bar");
    let timeout;
    loadingBar.load = () => {
        if (timeout) {
            clearTimeout(timeout);
            timeout = undefined;
        }
        bar.className = "load";
        setTimeout(() => {
            if (bar.className == "load") {
                loadingBar.finish();
            }
        }, 2048);
    };
    loadingBar.finish = () => {
        if (timeout) {
            clearTimeout(timeout);
            timeout = undefined;
        }
        bar.className = "finish";
        timeout = setTimeout(() => bar.removeAttribute("class"), 516);
    };
})(loadingBar || (exports.loadingBar = loadingBar = {}));
