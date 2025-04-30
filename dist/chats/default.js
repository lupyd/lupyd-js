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
exports.ChatSession = exports.getTimestampFromMsgKeys = exports.generateMessageId = void 0;
const element_1 = require("../firebase/element");
const base32_1 = require("../bin/base32");
const chat_1 = require("../api/chat");
const SPLIT_MSG_ID_INDEX_AT = 4;
const generateMessageId = (ts = Date.now()) => {
    const buffer = new Uint8Array(10);
    new DataView(buffer.buffer).setBigUint64(0, BigInt(ts), false);
    const result = base32_1.CrockfordBase32.encode(buffer.subarray(2)); // first two bytes won't be used any time soon
    return `${result.slice(0, SPLIT_MSG_ID_INDEX_AT)}/${result.slice(SPLIT_MSG_ID_INDEX_AT)}`;
};
exports.generateMessageId = generateMessageId;
const getTimestampFromMsgKeys = (id) => {
    const buffer = new Uint8Array(8);
    buffer.set(base32_1.CrockfordBase32.decode(id).subarray(0, 6), 2);
    return new Date(Number(new DataView(buffer.buffer).getBigUint64(0, false)));
};
exports.getTimestampFromMsgKeys = getTimestampFromMsgKeys;
class ChatSession {
    sender;
    receiver;
    unsubscribe;
    lastMsg;
    get senderRef() {
        return `chats/${this.sender}/${this.receiver}/umsgs`; // unencrypted messages
    }
    get receiverRef() {
        return `chats/${this.receiver}/${this.sender}/umsgs`; // unencrypted messages
    }
    constructor(sender, receiver, onMsgCallback, onError, onLoaded, lastMessage) {
        this.sender = sender;
        this.receiver = receiver;
        this.lastMsg = lastMessage ?? {
            id: "",
            by: sender,
            msg: "",
            ts: new Date(0),
        };
        let numberOfMsgsFetched = 0;
        let oldestMessage = "";
        const onSnapshot = (snapshot, from) => {
            snapshot.forEach((child) => {
                const msgId = snapshot.ref.key + child.key;
                const msg = child.val();
                const data = {
                    msg,
                    by: from,
                    ts: (0, exports.getTimestampFromMsgKeys)(msgId),
                    id: msgId,
                };
                console.log(data);
                onMsgCallback(data);
                this.updateLastMsg(msgId, msg, from);
                numberOfMsgsFetched += 1;
                if (msgId < oldestMessage || oldestMessage.length === 0) {
                    oldestMessage = msgId;
                }
            });
        };
        Promise.resolve().then(() => __importStar(require("firebase/database"))).then(async ({ getDatabase, onChildAdded, ref, onChildChanged, startAt, query, orderByKey, limitToLast, get, }) => {
            const db = getDatabase((0, element_1.fbElement)().app);
            if (!lastMessage) {
                const message = await get(ref(db, `lastMsgs/${sender}/${receiver}`));
                if (!message.exists()) {
                    await (0, chat_1.createUserChat)(receiver);
                    // throw new Error("Chat is not allowed");
                }
                else {
                    this.lastMsg = {
                        id: message.child("id").val(),
                        by: message.child("by").val() === true ? sender : receiver,
                        msg: message.child("msg").val(),
                        ts: (0, exports.getTimestampFromMsgKeys)(message.child("id").val()),
                    };
                }
            }
            const lastChild = await get(query(ref(db, this.receiverRef), orderByKey(), limitToLast(1)));
            if (lastChild.exists()) {
                lastChild.forEach((child) => {
                    onSnapshot(child, receiver);
                });
            }
            let q = ref(db, this.receiverRef);
            let sQ = ref(db, this.senderRef);
            if (this.lastMsg && this.lastMsg.id.length > 0) {
                const startAtKey = this.lastMsg.id.slice(0, SPLIT_MSG_ID_INDEX_AT);
                console.log("Starting at ", startAtKey);
                q = query(q, orderByKey(), startAt(startAtKey));
                sQ = query(sQ, orderByKey(), startAt(startAtKey));
            }
            await get(sQ).then((snapshot) => snapshot.forEach((e) => {
                console.log({ get: e.toJSON() });
                onSnapshot(e, sender);
            }));
            const unsubAdded = onChildAdded(q, (snapshot, previousChild) => {
                console.log({ previousChild, added: snapshot.toJSON() });
                onSnapshot(snapshot, receiver);
            });
            const unsubChanged = onChildChanged(q, (snapshot, previousChild) => {
                console.log({ previousChild, changed: snapshot.toJSON() });
                onSnapshot(snapshot, receiver);
            });
            this.unsubscribe = () => {
                unsubAdded();
                unsubChanged();
            };
        })
            .catch((err) => onError(err))
            .finally(async () => {
            while (true) {
                console.log({
                    numberOfMsgsFetched,
                    oldestMessage,
                });
                if (numberOfMsgsFetched > 100) {
                    break;
                }
                if (oldestMessage.length > SPLIT_MSG_ID_INDEX_AT) {
                    const messages = await this.getPreviousChunk(oldestMessage.slice(0, SPLIT_MSG_ID_INDEX_AT), 1);
                    for (const message of messages) {
                        onMsgCallback(message);
                        if (message.id < oldestMessage || oldestMessage.length == 0) {
                            oldestMessage = message.id;
                        }
                    }
                    if (messages.length == 0) {
                        break;
                    }
                }
                else {
                    break;
                }
            }
            onLoaded();
        });
    }
    async sendMessage(text) {
        const ts = new Date();
        const msgId = (0, exports.generateMessageId)(Number(ts));
        const { set, ref, getDatabase } = await Promise.resolve().then(() => __importStar(require("firebase/database")));
        const db = getDatabase((0, element_1.fbElement)().app);
        await set(ref(db, `${this.senderRef}/${msgId}`), text);
        const id = msgId.replace("/", "");
        this.updateLastMsg(id, text, this.sender);
        return { id, msg: text, by: this.sender, ts };
    }
    async updateMessage(id, text) {
        const { set, ref, getDatabase } = await Promise.resolve().then(() => __importStar(require("firebase/database")));
        const db = getDatabase((0, element_1.fbElement)().app);
        const msgId = `${id.slice(0, SPLIT_MSG_ID_INDEX_AT)}/${id.slice(SPLIT_MSG_ID_INDEX_AT)}`;
        await set(ref(db, `${this.senderRef}/${msgId}`), text);
        this.updateLastMsg(id, text, this.sender);
        const ts = (0, exports.getTimestampFromMsgKeys)(id);
        return { id, msg: text, by: this.sender, ts };
    }
    async updateLastMsg(id, msg, by) {
        if (this.lastMsg && this.lastMsg.id >= id) {
            return;
        }
        try {
            const newMsg = {
                id,
                msg,
                by: by,
                ts: (0, exports.getTimestampFromMsgKeys)(id),
            };
            const { set, ref, getDatabase } = await Promise.resolve().then(() => __importStar(require("firebase/database")));
            const db = getDatabase((0, element_1.fbElement)().app);
            await set(ref(db, `lastMsgs/${this.sender}/${this.receiver}`), {
                id: id,
                msg: msg,
                by: by == this.sender,
            });
            this.lastMsg = newMsg;
        }
        catch (err) {
            console.error(err);
        }
    }
    async getPreviousChunk(lastRootMsgId, limit = 1) {
        const { get, query, ref, getDatabase, endBefore, limitToLast, orderByKey } = await Promise.resolve().then(() => __importStar(require("firebase/database")));
        const db = getDatabase((0, element_1.fbElement)().app);
        if (lastRootMsgId.length > SPLIT_MSG_ID_INDEX_AT) {
            lastRootMsgId = lastRootMsgId.slice(0, SPLIT_MSG_ID_INDEX_AT);
        }
        const senderSnapshot = await get(query(ref(db, this.senderRef), orderByKey(), endBefore(lastRootMsgId), limitToLast(limit)));
        const receiverSnapshot = await get(query(ref(db, this.receiverRef), orderByKey(), endBefore(lastRootMsgId), limitToLast(limit)));
        const messages = [];
        if (senderSnapshot.exists()) {
            senderSnapshot.forEach((snapshot) => {
                snapshot.forEach((child) => {
                    const msgId = snapshot.ref.key + child.key;
                    const msg = child.val();
                    messages.push({
                        msg,
                        by: this.sender,
                        ts: (0, exports.getTimestampFromMsgKeys)(msgId),
                        id: msgId,
                    });
                });
            });
        }
        if (receiverSnapshot.exists()) {
            receiverSnapshot.forEach((snapshot) => {
                snapshot.forEach((child) => {
                    const msgId = snapshot.ref.key + child.key;
                    const msg = child.val();
                    messages.push({
                        msg,
                        by: this.receiver,
                        ts: (0, exports.getTimestampFromMsgKeys)(msgId),
                        id: msgId,
                    });
                });
            });
        }
        return messages;
    }
    close() {
        if (this.unsubscribe) {
            this.unsubscribe();
            this.unsubscribe = undefined;
        }
    }
}
exports.ChatSession = ChatSession;
