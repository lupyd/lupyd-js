"use strict";
var __createBinding = (this && this.__createBinding) || (Object.create ? (function(o, m, k, k2) {
    if (k2 === undefined) k2 = k;
    var desc = Object.getOwnPropertyDescriptor(m, k);
    if (!desc || ("get" in desc ? !m.__esModule : desc.writable || desc.configurable)) {
      desc = { enumerable: true, get: function() { return m[k]; } };
    }
    Object.defineProperty(o, k2, desc);
}) : (function(o, m, k, k2) {
    if (k2 === undefined) k2 = k;
    o[k2] = m[k];
}));
var __setModuleDefault = (this && this.__setModuleDefault) || (Object.create ? (function(o, v) {
    Object.defineProperty(o, "default", { enumerable: true, value: v });
}) : function(o, v) {
    o["default"] = v;
});
var __importStar = (this && this.__importStar) || (function () {
    var ownKeys = function(o) {
        ownKeys = Object.getOwnPropertyNames || function (o) {
            var ar = [];
            for (var k in o) if (Object.prototype.hasOwnProperty.call(o, k)) ar[ar.length] = k;
            return ar;
        };
        return ownKeys(o);
    };
    return function (mod) {
        if (mod && mod.__esModule) return mod;
        var result = {};
        if (mod != null) for (var k = ownKeys(mod), i = 0; i < k.length; i++) if (k[i] !== "default") __createBinding(result, mod, k[i]);
        __setModuleDefault(result, mod);
        return result;
    };
})();
Object.defineProperty(exports, "__esModule", { value: true });
exports.CallRTDBSession = exports.stringifyCallState = exports.CallState = exports.CallSession = void 0;
const element_1 = require("../firebase/element");
const default_1 = require("./default");
const call_1 = require("../api/call");
const constraints = {
    video: false,
    audio: true,
};
class CallSession {
    peer;
    localStream = null;
    remoteAudioElement = null;
    onIceCandidate;
    constructor(config, onIceCandidate, onDisrupt = (event, error) => { }) {
        this.peer = new RTCPeerConnection(config);
        this.onIceCandidate = onIceCandidate;
        this.peer.addEventListener("iceconnectionstatechange", (_) => {
            const state = this.peer.iceConnectionState;
            console.log(`Ice Connection State Change `, state);
            switch (state) {
                case "disconnected":
                case "failed":
                case "closed":
                    onDisrupt("iceconnectionstatechange", state);
                    break;
                // case "checking":
                // case "completed":
                // case "connected":
                // case "new":
                default:
            }
        });
        this.peer.addEventListener("icecandidateerror", (error) => {
            console.log(`Ice Candidate Error `, error);
            onDisrupt("icecandidateerror", error);
        });
        this.peer.addEventListener("signalingstatechange", (_) => {
            const state = this.peer.signalingState;
            console.log(`Signaling State changed `, state);
            switch (state) {
                case "closed":
                    onDisrupt("signalingstatechange", "closed");
                    break;
                // case "have-local-offer":
                // case "have-local-pranswer":
                // case "have-remote-offer":
                // case "have-remote-pranswer":
                // case "stable":
                default:
            }
        });
        this.peer.addEventListener("connectionstatechange", (_) => {
            const state = this.peer.connectionState;
            console.log(`Connection State Changed `, state);
            switch (state) {
                case "failed":
                case "disconnected":
                case "closed":
                    onDisrupt("connectionstatechange", state);
                    break;
                // case "connected":
                // case "connecting":
                // case "new":
                default:
            }
        });
        this.peer.addEventListener("negotiationneeded", (_) => {
            console.warn(`Negotiation Needed `);
        });
        this.peer.addEventListener("icegatheringstatechange", (_) => {
            const state = this.peer.iceGatheringState;
            console.log(`Ice Gathering State Changed `, state);
        });
        this.peer.addEventListener("icecandidate", (event) => {
            if (event.candidate) {
                this.onIceCandidate(event.candidate);
            }
        });
        // this.peer.addEventListener("datachannel", (event) => {});
        this.peer.addEventListener("track", (event) => {
            if (event.streams.length != 0) {
                if (!this.remoteAudioElement) {
                    this.remoteAudioElement = new Audio();
                }
                this.remoteAudioElement.srcObject = event.streams[0];
                this.remoteAudioElement.play();
            }
        });
    }
    async startCall() {
        this.localStream = await navigator.mediaDevices.getUserMedia(constraints);
        this.localStream
            .getTracks()
            .forEach((track) => this.peer.addTrack(track, this.localStream));
        const localDesc = await this.peer.createOffer();
        await this.peer.setLocalDescription(localDesc);
        return localDesc;
    }
    async acceptCall(description) {
        this.localStream = await navigator.mediaDevices.getUserMedia(constraints);
        this.localStream
            .getTracks()
            .forEach((track) => this.peer.addTrack(track, this.localStream));
        await this.setRemoteDescription(description);
        const localDesc = await this.peer.createAnswer();
        await this.peer.setLocalDescription(localDesc);
        return localDesc;
    }
    setRemoteDescription(desc) {
        return this.peer.setRemoteDescription(desc);
    }
    addIceCandidate(candidate) {
        return this.peer.addIceCandidate(candidate);
    }
    close() {
        this.peer.close();
        this.remoteAudioElement?.pause();
    }
}
exports.CallSession = CallSession;
const CONFIG = {
    iceServers: [
        {
            urls: "stun:stun.l.google.com:19302",
        },
    ],
};
var CallState;
(function (CallState) {
    CallState[CallState["Ringing"] = 0] = "Ringing";
    CallState[CallState["OnCall"] = 1] = "OnCall";
    CallState[CallState["Ended"] = 2] = "Ended";
    CallState[CallState["None"] = 3] = "None";
})(CallState || (exports.CallState = CallState = {}));
const stringifyCallState = (state) => {
    switch (state) {
        case CallState.Ringing:
            return "ringing";
        case CallState.OnCall:
            return "oncall";
        case CallState.Ended:
            return "ended";
        case CallState.None:
            return "none";
    }
};
exports.stringifyCallState = stringifyCallState;
class CallRTDBSession {
    caller;
    callee;
    me;
    id;
    session;
    unsubscribe = null;
    rootRef;
    _state = CallState.None;
    constructor(caller, callee, callId, me) {
        this.caller = caller;
        this.callee = callee;
        this.rootRef = `calls/${callId}/${this.caller}/${this.callee}`;
        this.id = callId;
        this.me = me;
        this.session = new CallSession(CONFIG, (ice) => this.sendMessage({ ice: ice.toJSON() }));
    }
    get state() {
        return this._state;
    }
    onDisrupt(eventName, error) {
        console.error(`Call Ended with ${eventName}`, error);
        this.close();
    }
    newCallSession(config) {
        this.session.close();
        this.session = new CallSession(config, (ice) => this.sendMessage({ ice: ice.toJSON() }), (ev, er) => this.onDisrupt(ev, er));
    }
    async startCall() {
        const { getDatabase, ref, onChildAdded } = await Promise.resolve().then(() => __importStar(require("firebase/database")));
        const config = await (0, call_1.getWebrtcConfig)();
        this.newCallSession(config);
        const desc = await this.session.startCall();
        const db = getDatabase((0, element_1.fbElement)().app);
        this.sendMessage({ offer: desc });
        if (this.unsubscribe) {
            this.unsubscribe();
        }
        this.unsubscribe = onChildAdded(ref(db, this.rootRef), async (snapshot) => {
            if (snapshot.child("by").val() !== this.callee) {
                return;
            }
            if (snapshot.hasChild("offer")) {
                const offer = snapshot.child("offer").val();
                const answer = await this.session.acceptCall(offer);
                this.sendMessage({ answer: answer });
                this._state = CallState.OnCall;
            }
            else if (snapshot.hasChild("answer")) {
                const answer = snapshot.child("answer").val();
                await this.session.setRemoteDescription(answer);
                this._state = CallState.OnCall;
            }
            else if (snapshot.hasChild("ice")) {
                await this.session.addIceCandidate(new RTCIceCandidate(snapshot.child("ice").val()));
            }
            else {
                console.warn("Unhandled Call Message ", snapshot.toJSON());
            }
        });
    }
    async acceptCall() {
        const { getDatabase, ref, onChildAdded } = await Promise.resolve().then(() => __importStar(require("firebase/database")));
        const config = await (0, call_1.getWebrtcConfig)();
        this.newCallSession(config);
        const db = getDatabase((0, element_1.fbElement)().app);
        if (this.unsubscribe) {
            this.unsubscribe();
        }
        this.unsubscribe = onChildAdded(ref(db, this.rootRef), async (snapshot) => {
            if (snapshot.child("by").val() !== this.caller) {
                return;
            }
            if (snapshot.hasChild("offer")) {
                const offer = snapshot.child("offer").val();
                const answer = await this.session.acceptCall(offer);
                this.sendMessage({ answer: answer });
                this._state = CallState.OnCall;
            }
            else if (snapshot.hasChild("answer")) {
                const answerSdp = snapshot.child("answer").val();
                await this.session.setRemoteDescription(answerSdp);
                this._state = CallState.OnCall;
            }
            else if (snapshot.hasChild("ice")) {
                await this.session.addIceCandidate(new RTCIceCandidate(snapshot.child("ice").val()));
            }
            else {
                console.warn("Unhandled Call Message ", snapshot.toJSON());
            }
        });
    }
    async sendMessage(msg) {
        const id = (0, default_1.generateMessageId)().replaceAll("/", "");
        const payload = {
            by: this.me,
            ...msg,
        };
        const { set, getDatabase, ref } = await Promise.resolve().then(() => __importStar(require("firebase/database")));
        await set(ref(getDatabase((0, element_1.fbElement)().app), `${this.rootRef}/${id}`), payload);
        console.log({ payload, id });
    }
    async close() {
        if ([CallState.None, CallState.Ended].some((e) => e == this._state)) {
            return;
        }
        const { getDatabase, ref, remove } = await Promise.resolve().then(() => __importStar(require("firebase/database")));
        if (this.unsubscribe)
            this.unsubscribe();
        this.session.close();
        const db = getDatabase((0, element_1.fbElement)().app);
        await remove(ref(db, this.rootRef));
        this._state = CallState.Ended;
    }
}
exports.CallRTDBSession = CallRTDBSession;
