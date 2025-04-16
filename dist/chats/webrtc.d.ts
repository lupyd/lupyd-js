import { Unsubscribe } from "firebase/auth";
export declare class CallSession {
    peer: RTCPeerConnection;
    localStream: MediaStream | null;
    remoteAudioElement: HTMLAudioElement | null;
    onIceCandidate: (candidate: RTCIceCandidate) => void;
    constructor(config: RTCConfiguration, onIceCandidate: (candidate: RTCIceCandidate) => void, onDisrupt?: (event: string, error: any) => void);
    startCall(): Promise<RTCSessionDescriptionInit>;
    acceptCall(description: RTCSessionDescription): Promise<RTCSessionDescriptionInit>;
    setRemoteDescription(desc: RTCSessionDescription): Promise<void>;
    addIceCandidate(candidate: RTCIceCandidateInit): Promise<void>;
    close(): void;
}
export declare enum CallState {
    Ringing = 0,
    OnCall = 1,
    Ended = 2,
    None = 3
}
export declare const stringifyCallState: (state: CallState) => "none" | "ringing" | "oncall" | "ended";
export declare class CallRTDBSession {
    caller: string;
    callee: string;
    me: string;
    id: string;
    session: CallSession;
    unsubscribe: Unsubscribe | null;
    rootRef: string;
    private _state;
    constructor(caller: string, callee: string, callId: string, me: string);
    get state(): CallState;
    onDisrupt(eventName: string, error: any): void;
    newCallSession(config: RTCConfiguration): void;
    startCall(): Promise<void>;
    acceptCall(): Promise<void>;
    sendMessage(msg: any): Promise<void>;
    close(): Promise<void>;
}
