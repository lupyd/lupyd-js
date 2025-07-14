// const constraints = {
//   video: false,
//   audio: true,
// } as const;

// export class CallSession {
//   peer: RTCPeerConnection;
//   localStream: MediaStream | null = null;
//   remoteAudioElement: HTMLAudioElement | null = null;
//   onIceCandidate: (candidate: RTCIceCandidate) => void;

//   constructor(
//     config: RTCConfiguration,
//     onIceCandidate: (candidate: RTCIceCandidate) => void,
//     onDisrupt = (event: string, error: any) => {},
//   ) {
//     this.peer = new RTCPeerConnection(config);
//     this.onIceCandidate = onIceCandidate;
//     this.peer.addEventListener("iceconnectionstatechange", (_) => {
//       const state = this.peer.iceConnectionState;
//       console.log(`Ice Connection State Change `, state);
//       switch (state) {
//         case "disconnected":
//         case "failed":
//         case "closed":
//           onDisrupt("iceconnectionstatechange", state);
//           break;
//         // case "checking":
//         // case "completed":
//         // case "connected":
//         // case "new":
//         default:
//       }
//     });
//     this.peer.addEventListener("icecandidateerror", (error) => {
//       console.log(`Ice Candidate Error `, error);
//       onDisrupt("icecandidateerror", error);
//     });
//     this.peer.addEventListener("signalingstatechange", (_) => {
//       const state = this.peer.signalingState;
//       console.log(`Signaling State changed `, state);
//       switch (state) {
//         case "closed":
//           onDisrupt("signalingstatechange", "closed");
//           break;
//         // case "have-local-offer":
//         // case "have-local-pranswer":
//         // case "have-remote-offer":
//         // case "have-remote-pranswer":
//         // case "stable":
//         default:
//       }
//     });
//     this.peer.addEventListener("connectionstatechange", (_) => {
//       const state = this.peer.connectionState;
//       console.log(`Connection State Changed `, state);
//       switch (state) {
//         case "failed":
//         case "disconnected":
//         case "closed":
//           onDisrupt("connectionstatechange", state);
//           break;
//         // case "connected":
//         // case "connecting":
//         // case "new":

//         default:
//       }
//     });
//     this.peer.addEventListener("negotiationneeded", (_) => {
//       console.warn(`Negotiation Needed `);
//     });
//     this.peer.addEventListener("icegatheringstatechange", (_) => {
//       const state = this.peer.iceGatheringState;
//       console.log(`Ice Gathering State Changed `, state);
//     });
//     this.peer.addEventListener("icecandidate", (event) => {
//       if (event.candidate) {
//         this.onIceCandidate(event.candidate);
//       }
//     });
//     // this.peer.addEventListener("datachannel", (event) => {});
//     this.peer.addEventListener("track", (event) => {
//       if (event.streams.length != 0) {
//         if (!this.remoteAudioElement) {
//           this.remoteAudioElement = new Audio();
//         }
//         this.remoteAudioElement.srcObject = event.streams[0];
//         this.remoteAudioElement.play();
//       }
//     });
//   }

//   async startCall() {
//     this.localStream = await navigator.mediaDevices.getUserMedia(constraints);
//     this.localStream
//       .getTracks()
//       .forEach((track) => this.peer.addTrack(track, this.localStream!));
//     const localDesc = await this.peer.createOffer();
//     await this.peer.setLocalDescription(localDesc);
//     return localDesc;
//   }

//   async acceptCall(description: RTCSessionDescription) {
//     this.localStream = await navigator.mediaDevices.getUserMedia(constraints);
//     this.localStream
//       .getTracks()
//       .forEach((track) => this.peer.addTrack(track, this.localStream!));
//     await this.setRemoteDescription(description);
//     const localDesc = await this.peer.createAnswer();
//     await this.peer.setLocalDescription(localDesc);
//     return localDesc;
//   }

//   setRemoteDescription(desc: RTCSessionDescription) {
//     return this.peer.setRemoteDescription(desc);
//   }

//   addIceCandidate(candidate: RTCIceCandidateInit) {
//     return this.peer.addIceCandidate(candidate);
//   }

//   close() {
//     this.peer.close();
//     this.remoteAudioElement?.pause();
//   }
// }

// const CONFIG: RTCConfiguration = {
//   iceServers: [
//     {
//       urls: "stun:stun.l.google.com:19302",
//     },
//   ],
// };

// export enum CallState {
//   Ringing,
//   OnCall,
//   Ended,
//   None,
// }

// export const stringifyCallState = (state: CallState) => {
//   switch (state) {
//     case CallState.Ringing:
//       return "ringing";
//     case CallState.OnCall:
//       return "oncall";
//     case CallState.Ended:
//       return "ended";
//     case CallState.None:
//       return "none";
//   }
// };

// export class CallRTDBSession {
//   caller: string;
//   callee: string;
//   me: string;
//   id: string;
//   session: CallSession;
//   unsubscribe: Unsubscribe | null = null;
//   rootRef: string;
//   private _state: CallState = CallState.None;

//   constructor(caller: string, callee: string, callId: string, me: string) {
//     this.caller = caller;
//     this.callee = callee;
//     this.rootRef = `calls/${callId}/${this.caller}/${this.callee}`;
//     this.id = callId;
//     this.me = me;
//     this.session = new CallSession(CONFIG, (ice) =>
//       this.sendMessage({ ice: ice.toJSON() }),
//     );
//   }

//   get state() {
//     return this._state;
//   }

//   onDisrupt(eventName: string, error: any) {
//     console.error(`Call Ended with ${eventName}`, error);
//     this.close();
//   }

//   newCallSession(config: RTCConfiguration) {
//     this.session.close();
//     this.session = new CallSession(
//       config,
//       (ice) => this.sendMessage({ ice: ice.toJSON() }),
//       (ev, er) => this.onDisrupt(ev, er),
//     );
//   }

//   async startCall() {
//     const { getDatabase, ref, onChildAdded } = await import(
//       "firebase/database"
//     );

//     const config = await getWebrtcConfig();
//     this.newCallSession(config);

//     const desc = await this.session.startCall();
//     const db = getDatabase(fbElement().app);
//     this.sendMessage({ offer: desc });
//     if (this.unsubscribe) {
//       this.unsubscribe();
//     }

//     this.unsubscribe = onChildAdded(ref(db, this.rootRef), async (snapshot) => {
//       if (snapshot.child("by").val() !== this.callee) {
//         return;
//       }
//       if (snapshot.hasChild("offer")) {
//         const offer = snapshot.child("offer").val();
//         const answer = await this.session.acceptCall(offer);
//         this.sendMessage({ answer: answer });
//         this._state = CallState.OnCall;
//       } else if (snapshot.hasChild("answer")) {
//         const answer = snapshot.child("answer").val();
//         await this.session.setRemoteDescription(answer);
//         this._state = CallState.OnCall;
//       } else if (snapshot.hasChild("ice")) {
//         await this.session.addIceCandidate(
//           new RTCIceCandidate(snapshot.child("ice").val()),
//         );
//       } else {
//         console.warn("Unhandled Call Message ", snapshot.toJSON());
//       }
//     });
//   }

//   async acceptCall() {
//     const { getDatabase, ref, onChildAdded } = await import(
//       "firebase/database"
//     );
//     const config = await getWebrtcConfig();
//     this.newCallSession(config);
//     const db = getDatabase(fbElement().app);

//     if (this.unsubscribe) {
//       this.unsubscribe();
//     }

//     this.unsubscribe = onChildAdded(ref(db, this.rootRef), async (snapshot) => {
//       if (snapshot.child("by").val() !== this.caller) {
//         return;
//       }
//       if (snapshot.hasChild("offer")) {
//         const offer = snapshot.child("offer").val();
//         const answer = await this.session.acceptCall(offer);
//         this.sendMessage({ answer: answer });
//         this._state = CallState.OnCall;
//       } else if (snapshot.hasChild("answer")) {
//         const answerSdp = snapshot.child("answer").val();
//         await this.session.setRemoteDescription(answerSdp);
//         this._state = CallState.OnCall;
//       } else if (snapshot.hasChild("ice")) {
//         await this.session.addIceCandidate(
//           new RTCIceCandidate(snapshot.child("ice").val()),
//         );
//       } else {
//         console.warn("Unhandled Call Message ", snapshot.toJSON());
//       }
//     });
//   }

//   async sendMessage(msg: any) {
//     const id = generateMessageId().replaceAll("/", "");
//     const payload = {
//       by: this.me,
//       ...msg,
//     };

//     const { set, getDatabase, ref } = await import("firebase/database");
//     await set(
//       ref(getDatabase(fbElement().app), `${this.rootRef}/${id}`),
//       payload,
//     );
//     console.log({ payload, id });
//   }

//   async close() {
//     if ([CallState.None, CallState.Ended].some((e) => e == this._state)) {
//       return;
//     }
//     const { getDatabase, ref, remove } = await import("firebase/database");
//     if (this.unsubscribe) this.unsubscribe();
//     this.session.close();
//     const db = getDatabase(fbElement().app);
//     await remove(ref(db, this.rootRef));
//     this._state = CallState.Ended;
//   }
// }
