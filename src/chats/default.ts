import { DataSnapshot, Query, Unsubscribe } from "firebase/database";
import { fbElement } from "../firebase/element";
import { CrockfordBase32 } from "../bin/base32";
import { createUserChat } from "../api/chat";

export interface ChatMessage {
  id: string;
  ts: Date;
  msg: string;
  by: string;
}

const SPLIT_MSG_ID_INDEX_AT = 4;
export const generateMessageId = (ts = Date.now()) => {
  const buffer = new Uint8Array(10);
  new DataView(buffer.buffer).setBigUint64(0, BigInt(ts), false);
  const result = CrockfordBase32.encode(buffer.subarray(2)); // first two bytes won't be used any time soon
  return `${result.slice(0, SPLIT_MSG_ID_INDEX_AT)}/${result.slice(SPLIT_MSG_ID_INDEX_AT)}`;
};
export const getTimestampFromMsgKeys = (id: string) => {
  const buffer = new Uint8Array(8);
  buffer.set(CrockfordBase32.decode(id).subarray(0, 6), 2);
  return new Date(Number(new DataView(buffer.buffer).getBigUint64(0, false)));
};

export class ChatSession {
  sender: string;
  receiver: string;
  unsubscribe?: Unsubscribe;
  lastMsg: ChatMessage;

  get senderRef() {
    return `chats/${this.sender}/${this.receiver}/umsgs`; // unencrypted messages
  }

  get receiverRef() {
    return `chats/${this.receiver}/${this.sender}/umsgs`; // unencrypted messages
  }

  constructor(
    sender: string,
    receiver: string,
    onMsgCallback: (msg: ChatMessage) => void,
    onError: (error: any) => void,
    onLoaded: () => void,
    lastMessage?: ChatMessage,
  ) {
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

    const onSnapshot = (snapshot: DataSnapshot, from: string) => {
      snapshot.forEach((child) => {
        const msgId = snapshot.ref.key! + child.key!;
        const msg = child.val();
        const data = {
          msg,
          by: from,
          ts: getTimestampFromMsgKeys(msgId),
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

    import("firebase/database")
      .then(
        async ({
          getDatabase,
          onChildAdded,
          ref,
          onChildChanged,
          startAt,
          query,
          orderByKey,
          limitToLast,
          get,
        }) => {
          const db = getDatabase(fbElement().app);

          if (!lastMessage) {
            const message = await get(
              ref(db, `lastMsgs/${sender}/${receiver}`),
            );
            if (!message.exists()) {
              await createUserChat(receiver);
              // throw new Error("Chat is not allowed");
            } else {
              this.lastMsg = {
                id: message.child("id").val(),
                by: message.child("by").val() === true ? sender : receiver,
                msg: message.child("msg").val(),
                ts: getTimestampFromMsgKeys(message.child("id").val()),
              };
            }
          }

          const lastChild = await get(
            query(ref(db, this.receiverRef), orderByKey(), limitToLast(1)),
          );
          if (lastChild.exists()) {
            lastChild.forEach((child) => {
              onSnapshot(child, receiver);
            });
          }

          let q: Query = ref(db, this.receiverRef);
          let sQ: Query = ref(db, this.senderRef);

          if (this.lastMsg && this.lastMsg.id.length > 0) {
            const startAtKey = this.lastMsg.id.slice(0, SPLIT_MSG_ID_INDEX_AT);
            console.log("Starting at ", startAtKey);
            q = query(q, orderByKey(), startAt(startAtKey));
            sQ = query(sQ, orderByKey(), startAt(startAtKey));
          }

          await get(sQ).then((snapshot) =>
            snapshot.forEach((e) => {
              console.log({ get: e.toJSON() });
              onSnapshot(e, sender);
            }),
          );
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
        },
      )
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
            const messages = await this.getPreviousChunk(
              oldestMessage.slice(0, SPLIT_MSG_ID_INDEX_AT),
              1,
            );
            for (const message of messages) {
              onMsgCallback(message);
              if (message.id < oldestMessage || oldestMessage.length == 0) {
                oldestMessage = message.id;
              }
            }
            if (messages.length == 0) {
              break;
            }
          } else {
            break;
          }
        }
        onLoaded();
      });
  }

  async sendMessage(text: string): Promise<ChatMessage> {
    const ts = new Date();
    const msgId = generateMessageId(Number(ts));
    const { set, ref, getDatabase } = await import("firebase/database");
    const db = getDatabase(fbElement().app);
    await set(ref(db, `${this.senderRef}/${msgId}`), text);
    const id = msgId.replace("/", "");
    this.updateLastMsg(id, text, this.sender);
    return { id, msg: text, by: this.sender, ts };
  }

  async updateMessage(id: string, text: string): Promise<ChatMessage> {
    const { set, ref, getDatabase } = await import("firebase/database");
    const db = getDatabase(fbElement().app);
    const msgId = `${id.slice(0, SPLIT_MSG_ID_INDEX_AT)}/${id.slice(SPLIT_MSG_ID_INDEX_AT)}`;
    await set(ref(db, `${this.senderRef}/${msgId}`), text);
    this.updateLastMsg(id, text, this.sender);
    const ts = getTimestampFromMsgKeys(id);
    return { id, msg: text, by: this.sender, ts };
  }

  async updateLastMsg(id: string, msg: string, by: string) {
    if (this.lastMsg && this.lastMsg.id >= id) {
      return;
    }
    try {
      const newMsg = {
        id,
        msg,
        by: by,
        ts: getTimestampFromMsgKeys(id),
      };
      const { set, ref, getDatabase } = await import("firebase/database");
      const db = getDatabase(fbElement().app);
      await set(ref(db, `lastMsgs/${this.sender}/${this.receiver}`), {
        id: id,
        msg: msg,
        by: by == this.sender,
      });

      this.lastMsg = newMsg;
    } catch (err) {
      console.error(err);
    }
  }

  async getPreviousChunk(lastRootMsgId: string, limit: number = 1) {
    const { get, query, ref, getDatabase, endBefore, limitToLast, orderByKey } =
      await import("firebase/database");
    const db = getDatabase(fbElement().app);
    if (lastRootMsgId.length > SPLIT_MSG_ID_INDEX_AT) {
      lastRootMsgId = lastRootMsgId.slice(0, SPLIT_MSG_ID_INDEX_AT);
    }

    const senderSnapshot = await get(
      query(
        ref(db, this.senderRef),
        orderByKey(),
        endBefore(lastRootMsgId),
        limitToLast(limit),
      ),
    );
    const receiverSnapshot = await get(
      query(
        ref(db, this.receiverRef),
        orderByKey(),
        endBefore(lastRootMsgId),
        limitToLast(limit),
      ),
    );
    const messages: ChatMessage[] = [];
    if (senderSnapshot.exists()) {
      senderSnapshot.forEach((snapshot) => {
        snapshot.forEach((child) => {
          const msgId = snapshot.ref.key! + child.key!;
          const msg = child.val();
          messages.push({
            msg,
            by: this.sender,
            ts: getTimestampFromMsgKeys(msgId),
            id: msgId,
          });
        });
      });
    }
    if (receiverSnapshot.exists()) {
      receiverSnapshot.forEach((snapshot) => {
        snapshot.forEach((child) => {
          const msgId = snapshot.ref.key! + child.key!;
          const msg = child.val();
          messages.push({
            msg,
            by: this.receiver,
            ts: getTimestampFromMsgKeys(msgId),
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
