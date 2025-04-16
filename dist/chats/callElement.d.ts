import { State } from "vanjs-core";
import { CallState } from "./webrtc";
export declare class CallCard extends HTMLElement {
    caller: string;
    callee: string;
    me: string;
    state: State<CallState>;
    micOn: State<boolean>;
    audio: HTMLAudioElement;
    onEndCall: () => void;
    constructor(caller: string, callee: string, me: string, state?: State<CallState>, micOn?: State<boolean>, onEndCall?: () => void);
    connectedCallback(): void;
    disconnectedCallback(): void;
    render(): void;
}
