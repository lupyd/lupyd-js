"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.CallCard = void 0;
const vanjs_core_1 = require("vanjs-core");
const webrtc_1 = require("./webrtc");
const userPage_1 = require("../routes/userPage");
const time_1 = require("../customElements/time");
const utils_1 = require("../bin/utils");
const { div, b, button, h1 } = vanjs_core_1.default.tags;
class CallCard extends HTMLElement {
    caller;
    callee;
    me;
    state;
    micOn;
    audio;
    onEndCall;
    constructor(caller, callee, me, state = vanjs_core_1.default.state(webrtc_1.CallState.None), micOn = vanjs_core_1.default.state(false), onEndCall = () => { }) {
        super();
        this.caller = caller;
        this.callee = callee;
        this.me = me;
        this.state = state;
        this.audio = new Audio();
        this.micOn = micOn;
        this.onEndCall = onEndCall;
    }
    connectedCallback() {
        this.render();
    }
    disconnectedCallback() {
        this.audio.pause();
    }
    render() {
        const other = this.caller === this.me ? this.callee : this.caller;
        const el = div({ class: () => `call-card ${(0, webrtc_1.stringifyCallState)(this.state.val)}` }, h1("Voice Call"), div({ class: "row" }, (0, userPage_1.UserProfileElement)(other), b(other)), () => {
            const callState = this.state.val;
            switch (callState) {
                case webrtc_1.CallState.Ringing:
                    this.audio.src =
                        "/assets/lofi-relax-chillhood-by-lofium-123327.m4a";
                    this.audio.loop = true;
                    this.audio.play();
                    return div("Ringing...");
                case webrtc_1.CallState.OnCall:
                    this.audio.pause();
                    const callStartedAt = new Date().getUTCSeconds();
                    const counter = new time_1.IntervalElement(1000, (el) => {
                        const secondsPassed = new Date().getUTCSeconds() - callStartedAt;
                        el.innerText = `${secondsPassed}s`;
                    });
                    return div(counter);
                case webrtc_1.CallState.Ended:
                    return div({ class: "ended" });
                case webrtc_1.CallState.None:
                    return div({ class: "none" });
            }
        }, div({ class: "row" }, button({
            class: "theme-button",
            onclick: () => {
                this.onEndCall();
            },
        }, (0, utils_1.UiIcon)("phone-off")), button({
            class: "theme-button",
            onclick: () => {
                this.micOn.val = !this.micOn.val;
            },
        }, () => (this.micOn.val ? (0, utils_1.UiIcon)("mic-off") : (0, utils_1.UiIcon)("mic")))));
        this.replaceChildren(el);
    }
}
exports.CallCard = CallCard;
customElements.define("call-card", CallCard);
