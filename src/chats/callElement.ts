import van, { State } from "vanjs-core";
import { CallState, stringifyCallState } from "./webrtc";
import { UserProfileElement } from "../routes/userPage";

import { IntervalElement } from "../customElements/time";
import { UiIcon } from "../bin/utils";

const { div, b, button, h1 } = van.tags;

export class CallCard extends HTMLElement {
  caller: string;
  callee: string;
  me: string;
  state: State<CallState>;
  micOn: State<boolean>;
  audio: HTMLAudioElement;
  onEndCall: () => void;

  constructor(
    caller: string,
    callee: string,
    me: string,
    state = van.state(CallState.None),
    micOn = van.state(false),
    onEndCall = () => {},
  ) {
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
    const el = div(
      { class: () => `call-card ${stringifyCallState(this.state.val)}` },
      h1("Voice Call"),
      div({ class: "row" }, UserProfileElement(other), b(other)),
      () => {
        const callState = this.state.val;
        switch (callState) {
          case CallState.Ringing:
            this.audio.src =
              "/assets/lofi-relax-chillhood-by-lofium-123327.m4a";
            this.audio.loop = true;
            this.audio.play();
            return div("Ringing...");
          case CallState.OnCall:
            this.audio.pause();
            const callStartedAt = new Date().getUTCSeconds();
            const counter = new IntervalElement(1000, (el) => {
              const secondsPassed = new Date().getUTCSeconds() - callStartedAt;
              el.innerText = `${secondsPassed}s`;
            });

            return div(counter);
          case CallState.Ended:
            return div({ class: "ended" });
          case CallState.None:
            return div({ class: "none" });
        }
      },

      div(
        { class: "row" },
        button(
          {
            class: "theme-button",
            onclick: () => {
              this.onEndCall();
            },
          },
          UiIcon("phone-off"),
        ),
        button(
          {
            class: "theme-button",
            onclick: () => {
              this.micOn.val = !this.micOn.val;
            },
          },
          () => (this.micOn.val ? UiIcon("mic-off") : UiIcon("mic")),
        ),
      ),
    );
    this.replaceChildren(el);
  }
}

customElements.define("call-card", CallCard);
