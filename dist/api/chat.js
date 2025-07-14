// export const createUserChat = async (other: string) => {
//   const username = await AuthHandler.getUsername();
//   const token = await AuthHandler.getToken();
//   if (!username || !token) {
//     throw new Error("User not signed in");
//   }
//   const response = await fetch(CREATE_USER_CHAT_FUNC_URL, {
//     method: "POST",
//     headers: {
//       "content-type": "application/protobuf; proto=lupyd.chats.ChatSession",
//       authorization: `Bearer ${token}`,
//     },
//     body: ChatSession.encode(
//       ChatSession.create({ user1: username, user2: other }),
//     ).finish(),
//   });
//   if (response.status != 200) {
//     throw new Error(
//       `${CREATE_USER_CHAT_FUNC_URL} [${response.status}] ${await response.text()}`,
//     );
//   } else {
//     console.log(await response.text());
//   }
// };
// export const getChats = async () => {
//   try {
//     const username = await AuthHandler.getUsername();
//     const token = await AuthHandler.getToken();
//     if (!username || !token) {
//       throw new Error("User not signed in");
//     }
//     const url = `${API_URL}/chats`;
//     const response = await fetch(url, {
//       headers: {
//         authorization: `Bearer ${token}`,
//       },
//     });
//     if (response.status != 200) {
//       throw new Error(`${url} [${response.status}] ${await response.text()}`);
//     }
//     const sessions = ChatSessions.decode(
//       new Uint8Array(await response.arrayBuffer()),
//     ).sessions;
//     for (const session of sessions) {
//       if (session.user1 !== username) {
//         session.user2 = session.user1;
//         session.user1 = username;
//       }
//     }
//     return sessions;
//   } catch (err) {
//     console.error(err);
//   }
//   return [];
// };
// export interface LastChatMessagePair {
//   lastMessageSeenByMe: ChatMessage;
//   lastMessageSeenByOther: ChatMessage;
//   other: string;
// }
// export const getLastMessagesForEachUser = async () => {
//   try {
//     const username = await AuthHandler.getUsername();
//     if (!username) {
//       throw new Error("User not signed in");
//     }
//     const { getDatabase, ref, get } = await import("firebase/database");
//     const db = getDatabase(fbElement().app);
//     const snapshot = await get(ref(db, `lastMsgs/${username}`));
//     const promises: Promise<LastChatMessagePair>[] = [];
//     snapshot.forEach((e) => {
//       const other = e.key;
//       const value = e.val();
//       const myLastMessage = {
//         id: value["id"] as string,
//         ts: getTimestampFromMsgKeys(value["id"]),
//         msg: value["msg"],
//         by: value["by"] === true ? username : other,
//       };
//       const promise = get(ref(db, `lastMsgs/${other}/${username}`)).then(
//         (snap) => {
//           const otherLastMessage = {
//             id: snap.child("id").val() as string,
//             msg: snap.child("msg").val() as string,
//             by: snap.child("by").val() === true ? other : username,
//             ts: getTimestampFromMsgKeys(snap.child("id").val()),
//           };
//           return {
//             lastMessageSeenByMe: myLastMessage,
//             lastMessageSeenByOther: otherLastMessage,
//             other,
//           };
//         },
//       );
//       promises.push(promise);
//     });
//     const messages = await Promise.all(promises);
//     return messages;
//   } catch (err) {
//     console.error(err);
//     throw err;
//   }
// };
// // export const doRTDBRestQuery = async (
// //   ref: string,
// //   keys: Record<string, string>,
// // ) => {
// //   const app = fbElement().app;
// //   const dbUrl = app.options.databaseURL;
// //   const token = await AuthHandler.getToken();
// //   let url = `${dbUrl}/${ref}.json?auth=${token}`;
// //   for (const [k, v] of Object.entries(keys)) {
// //     url = `${url}&${k}=${v}`;
// //   }
// //   const response = await fetch(url);
// //   return response.text();
// // };
// export const deleteChat = async (other: string) => {
//   const { getDatabase, ref, remove } = await import("firebase/database");
//   const username = await AuthHandler.getUsername();
//   if (username) {
//     await remove(
//       ref(getDatabase(fbElement().app), `chats/${username}/${other}`),
//     );
//   } else {
//     throw new Error("User is not signed in");
//   }
// };
