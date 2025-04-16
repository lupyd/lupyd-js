"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.deleteChat = exports.getLastMessagesForEachUser = exports.getChats = exports.createUserChat = void 0;
const default_1 = require("../chats/default");
const constants_1 = require("../constants");
const auth_1 = require("../firebase/auth");
const element_1 = require("../firebase/element");
const chats_1 = require("../protos/chats");
const createUserChat = async (other) => {
    const username = await auth_1.AuthHandler.getUsername();
    const token = await auth_1.AuthHandler.getToken();
    if (!username || !token) {
        throw new Error("User not signed in");
    }
    const response = await fetch(constants_1.CREATE_USER_CHAT_FUNC_URL, {
        method: "POST",
        headers: {
            "content-type": "application/protobuf; proto=lupyd.chats.ChatSession",
            authorization: `Bearer ${token}`,
        },
        body: chats_1.ChatSession.encode(chats_1.ChatSession.create({ user1: username, user2: other })).finish(),
    });
    if (response.status != 200) {
        throw new Error(`${constants_1.CREATE_USER_CHAT_FUNC_URL} [${response.status}] ${await response.text()}`);
    }
    else {
        console.log(await response.text());
    }
};
exports.createUserChat = createUserChat;
const getChats = async () => {
    try {
        const username = await auth_1.AuthHandler.getUsername();
        const token = await auth_1.AuthHandler.getToken();
        if (!username || !token) {
            throw new Error("User not signed in");
        }
        const url = `${constants_1.API_URL}/chats`;
        const response = await fetch(url, {
            headers: {
                authorization: `Bearer ${token}`,
            },
        });
        if (response.status != 200) {
            throw new Error(`${url} [${response.status}] ${await response.text()}`);
        }
        const sessions = chats_1.ChatSessions.decode(new Uint8Array(await response.arrayBuffer())).sessions;
        for (const session of sessions) {
            if (session.user1 !== username) {
                session.user2 = session.user1;
                session.user1 = username;
            }
        }
        return sessions;
    }
    catch (err) {
        console.error(err);
    }
    return [];
};
exports.getChats = getChats;
const getLastMessagesForEachUser = async () => {
    try {
        const username = await auth_1.AuthHandler.getUsername();
        if (!username) {
            throw new Error("User not signed in");
        }
        const { getDatabase, ref, get } = await Promise.resolve().then(() => require("firebase/database"));
        const db = getDatabase((0, element_1.fbElement)().app);
        const snapshot = await get(ref(db, `lastMsgs/${username}`));
        const promises = [];
        snapshot.forEach((e) => {
            const other = e.key;
            const value = e.val();
            const myLastMessage = {
                id: value["id"],
                ts: (0, default_1.getTimestampFromMsgKeys)(value["id"]),
                msg: value["msg"],
                by: value["by"] === true ? username : other,
            };
            const promise = get(ref(db, `lastMsgs/${other}/${username}`)).then((snap) => {
                const otherLastMessage = {
                    id: snap.child("id").val(),
                    msg: snap.child("msg").val(),
                    by: snap.child("by").val() === true ? other : username,
                    ts: (0, default_1.getTimestampFromMsgKeys)(snap.child("id").val()),
                };
                return {
                    lastMessageSeenByMe: myLastMessage,
                    lastMessageSeenByOther: otherLastMessage,
                    other,
                };
            });
            promises.push(promise);
        });
        const messages = await Promise.all(promises);
        return messages;
    }
    catch (err) {
        console.error(err);
        throw err;
    }
};
exports.getLastMessagesForEachUser = getLastMessagesForEachUser;
// export const doRTDBRestQuery = async (
//   ref: string,
//   keys: Record<string, string>,
// ) => {
//   const app = fbElement().app;
//   const dbUrl = app.options.databaseURL;
//   const token = await AuthHandler.getToken();
//   let url = `${dbUrl}/${ref}.json?auth=${token}`;
//   for (const [k, v] of Object.entries(keys)) {
//     url = `${url}&${k}=${v}`;
//   }
//   const response = await fetch(url);
//   return response.text();
// };
const deleteChat = async (other) => {
    const { getDatabase, ref, remove } = await Promise.resolve().then(() => require("firebase/database"));
    const username = await auth_1.AuthHandler.getUsername();
    if (username) {
        await remove(ref(getDatabase((0, element_1.fbElement)().app), `chats/${username}/${other}`));
    }
    else {
        throw new Error("User is not signed in");
    }
};
exports.deleteChat = deleteChat;
