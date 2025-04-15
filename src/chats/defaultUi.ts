import van from "vanjs-core";
import { ChatMessage, ChatSession } from "./default";
import { AuthHandler } from "../firebase/auth";
import * as vanX from "vanjs-ext";
import { UserProfileElement } from "../routes/userPage";
import { Await } from "vanjs-ui";
import { generateUlid, UiIcon, ulidStringify, Utils } from "../bin/utils";
import { routeNavigator } from "../routes/navigator";
import { deleteChat } from "../api/chat";
import { CallRTDBSession, CallState } from "./webrtc";
import { getIcon } from "../bin/icons";
import { IntervalElement } from "../customElements/time";
import { CallCard } from "./callElement";

const { ul, li, b, input, button, div, small, a } = van.tags;

interface CallMessage {
  id: string;
  type: "open" | "close" | "answered" | "rejected" | "ended" | "oncall";
  payload: string;
}

const parseTextMessageToCallMessage = (msg: string) => {
  if (!msg.startsWith("call:")) {
    throw new Error("Invalid Call Message");
  }
  const [_call, id, type, payload] = msg.split(":");

  const types = ["open", "close", "answered", "rejected", "ended", "oncall"];

  if (types.includes(type)) {
    return {
      id,
      type,
      payload,
    } as CallMessage;
  }

  throw new Error(`Invalid Call Action Type ${msg} ${type}`);
};

const parseCallMessageToTextMessage = (msg: CallMessage) => {
  return `call:${msg.id}:${msg.type}:${msg.payload}`;
};

interface CallMessageHandler {
  onCancel: (callId: string, msgId: string) => void;
  onAnswer: (callId: string, msgId: string) => void;
  onReject: (callId: string, msgId: string) => void;
  onClosed: (callId: string, msgId: string) => void;
}

const messageElement = (
  msg: ChatMessage,
  sender: string,
  callMsgHandler?: CallMessageHandler,
) => {
  let content = div(msg.msg);
  if (msg.msg.startsWith("call:")) {
    const callMsg = parseTextMessageToCallMessage(msg.msg);
    switch (callMsg.type) {
      case "open":
        if (msg.by !== sender) {
          content = div(
            div(getIcon("phone"), "Outgoing Call ..."),
            div(
              { class: "row" },

              button(
                {
                  class: "theme-button",
                  onclick: () => {
                    if (callMsgHandler) {
                      callMsgHandler.onCancel(callMsg.id, msg.id);
                    }
                  },
                },
                "Cancel",
              ),
            ),
          );
        } else {
          content = div(
            div(getIcon("phone"), `Incoming Call ...`),
            div(
              { class: "row" },
              button(
                {
                  class: "theme-button",
                  onclick: () => {
                    if (callMsgHandler) {
                      callMsgHandler.onAnswer(callMsg.id, msg.id);
                    }
                  },
                },
                "Answer",
              ),
              button(
                {
                  class: "theme-button",
                  onclick: () => {
                    if (callMsgHandler) {
                      callMsgHandler.onReject(callMsg.id, msg.id);
                    }
                  },
                },
                "Reject",
              ),
            ),
          );
        }
        break;
      case "close":
        content = div(`Call Closed ${callMsg.payload}`);
        if (callMsgHandler) {
          callMsgHandler.onClosed(callMsg.id, msg.id);
        }
        break;
      case "rejected":
        content = div(`Call Rejected ${callMsg.payload}`);
        break;
      case "ended":
        content = div(`Call Ended ${callMsg.payload}`);
        break;
      case "answered":
        {
          const callStartedAt = new Date(callMsg.payload);
          const counter = new IntervalElement(1000, (el) => {
            const secondsPassed =
              new Date().getUTCSeconds() - callStartedAt.getUTCSeconds();
            el.innerText = `Answered ${secondsPassed}s`;
          });
          content = div(counter);
        }
        break;
      case "oncall":
        {
          const callStartedAt = new Date(callMsg.payload);
          const counter = new IntervalElement(1000, (el) => {
            const secondsPassed =
              new Date().getUTCSeconds() - callStartedAt.getUTCSeconds();
            el.innerText = `OnCall ${secondsPassed}s`;
          });
          content = div(counter);
        }
        break;
    }

    content.setAttribute("data-call-id", callMsg.id);
    content.setAttribute("data-call-type", callMsg.type);
    content.setAttribute("data-call-payload", callMsg.payload);
  }

  const el = div(
    {
      class: `chat-message ${sender == msg.by ? "sent" : "recv"}`,
    },
    content,
    div({ class: "chat-message-ts" }, small(msg.ts.toLocaleTimeString())),
  );

  el.setAttribute("data-by", msg.by);
  el.setAttribute("data-sender", sender);
  el.setAttribute("data-ts", msg.ts.toISOString());

  return el;
};

export class DefaultUiChatElement extends HTMLElement {
  private session: ChatSession | null = null;
  private msgs: ChatMessage[] = vanX.reactive([]);
  private _callSession: CallRTDBSession | null = null;

  sessionStartLastMessage: ChatMessage | undefined;
  isOnCall = van.state(false);
  msgIdOfCall = "";

  private callState = van.state(CallState.None);

  errorText = van.state("");
  loadedAllOldMessages = false;

  constructor(receiver: string, lastMessage: ChatMessage | undefined) {
    super();
    this.setAttribute("receiver", receiver);
    this.sessionStartLastMessage = lastMessage;
  }

  disconnectedCallback() {
    this.session?.close();
    this._callSession?.close();
    this._callSession = null;
    this.session = null;
    this.callState.val = CallState.None;
  }

  connectedCallback() {
    this.render();
  }

  get receiver() {
    return this.getAttribute("receiver");
  }

  get sender() {
    return this.getAttribute("sender");
  }

  onCallButtonClick() {
    if (this.isOnCall.val) {
      if (this.msgIdOfCall !== "") {
        this.updateMessage(
          this.msgIdOfCall,
          parseCallMessageToTextMessage({
            type: "close",
            payload: "",
            id: this._callSession!.id,
          }),
        );
      }
      this._callSession!.close();
      this._callSession = null;
      this.isOnCall.val = false;
      this.msgIdOfCall = "";
      return;
    }
    console.log(`Starting Call with ${this.receiver} from ${this.sender}`);
    const callId = ulidStringify(generateUlid());
    const callSession = new CallRTDBSession(
      this.sender!,
      this.receiver!,
      callId,
      this.sender!,
    );
    callSession.startCall();
    this._callSession = callSession;
    this.isOnCall.val = true;
    this.sendMessage(
      parseCallMessageToTextMessage({ id: callId, payload: "", type: "open" }),
    ).then((msg) => {
      this.msgIdOfCall = msg?.id ?? "";
    });
  }

  render() {
    const receiver = this.receiver!;
    const header = div(
      { class: "chat-element-header" },
      div(
        {
          class: "user-chat-header",
        },
        UserProfileElement(receiver),
        a(
          {
            class: "no-text-decoration",
            href: `/user/${receiver}`,
            onclick: (e: Event) => {
              e.preventDefault();
              routeNavigator.pushRoute(`/user/${receiver}`);
            },
          },
          b(receiver),
        ),
      ),

      button(
        {
          class: "theme-button no-button-decoration",
          onclick: () => this.onCallButtonClick(),
        },
        () => (!this.isOnCall.val ? UiIcon("phone") : UiIcon("phone-off")),
      ),

      button(
        {
          class: "theme-button no-button-decoration delete-chat-btn",
          onclick() {
            Utils.showDialog(
              div("Confirm Delete This Conversation?"),
              [
                {
                  text: "Yes, Delete",
                  onClick: () => {
                    deleteChat(receiver);
                    window.history.back();
                  },
                  class: "red-button",
                },
                {
                  text: "Cancel",
                  onClick() {},
                  class: "theme-button",
                },
              ],
              () => {},
            );
          },
        },
        UiIcon("trash2"),
      ),
    );
    const user = AuthHandler.currentUser();

    const el = ul({ class: "no-pad no-list-style" });
    const i = input({
      class: "theme-input msg-input-field",
      onkeydown: (e: KeyboardEvent) => {
        if (e.key == "Enter") {
          this.submitMessage();
        }
      },
    });

    const inputField = div(
      { class: "chat-input-field" },
      i,
      button(
        {
          class: "no-button-decoration",
          onclick: () => {
            this.submitMessage();
          },
        },
        UiIcon("send-horizontal"),
      ),
    );
    const page = div(() => {
      if (user.val != null) {
        return Await(
          {
            value: AuthHandler.getUsername(user.val),
            Loading() {
              return div({ class: "loader" });
            },
          },
          (value) => {
            if (value) {
              this.startSession();
              return div(el, () =>
                this.errorText.val.length > 0
                  ? div({ class: "error" }, this.errorText.val)
                  : div(),
              );
            } else {
              return div("User is not signed in");
            }
          },
        );
      }
      return div();
    });

    const callCard = new CallCard(
      this.sender!,
      this.receiver!,
      this.sender!,
      this.callState,
    );

    this.replaceChildren(header, callCard, page, inputField);
    this.classList.add("chat-element");
  }

  async startSession() {
    if (this.session) {
      return;
    }
    const username = await AuthHandler.getUsername();
    if (!username) {
      this.errorText.val = "User not signed in";
      return;
    }

    this.setAttribute("sender", username);
    const receiver = this.receiver;
    if (!receiver) {
      this.errorText.val = "Attribute not set 'receiver'";
      return;
    }

    this.session = new ChatSession(
      username,
      receiver,
      (msg) => this.addMessageElement(msg),
      (err) => {
        console.error(err);
        this.errorText.val = `${err}`;
      },
      () => {
        const list = this.querySelector("ul")!;
        list.addEventListener("scroll", (_) => {
          if (list.scrollTop === 0 && !this.loadedAllOldMessages) {
            let lastTimeMessagesLength = this.msgs.length;
            this.getOlderMessages().finally(() => {
              if (lastTimeMessagesLength === this.msgs.length) {
                this.loadedAllOldMessages = true;
              }
            });
          }
        });
      },
      this.sessionStartLastMessage,
    );
  }

  onAnswer(callId: string, msgId: string) {
    this._callSession = new CallRTDBSession(
      // msg.by,
      this.receiver!,
      this.sender!,
      callId,
      this.sender!,
    );
    this._callSession.acceptCall();
    this.isOnCall.val = true;
    this.msgIdOfCall = msgId;
    console.log(`Accepting Call ${callId} from msg: ${msgId}`);

    this.updateMessage(
      msgId,
      parseCallMessageToTextMessage({
        id: callId,
        type: "answered",
        payload: new Date().toISOString(),
      }),
    );
  }

  onReject(callId: string, msgId: string) {
    console.warn(`Rejected Call ${callId} from msg: ${msgId}`);
    if (this._callSession) {
      this._callSession!.close();
    } else {
      new CallRTDBSession(
        this.receiver!,
        this.sender!,
        callId,
        this.sender!,
      ).close();
    }
    this._callSession = null;
    this.msgIdOfCall = "";

    this.updateMessage(
      msgId,
      parseCallMessageToTextMessage({
        id: callId,
        type: "rejected",
        payload: new Date().toISOString(),
      }),
    );
  }

  onCancel(callId: string, msgId: string) {
    console.warn(`Cancelled Call ${callId} from msg: ${msgId}`);
    this.msgIdOfCall = "";
    if (this._callSession) {
      this._callSession!.close();
    } else {
      new CallRTDBSession(
        this.sender!,
        this.receiver!,
        callId,
        this.sender!,
      ).close();
    }
    this._callSession = null;

    this.updateMessage(
      msgId,
      parseCallMessageToTextMessage({
        id: callId,
        type: "ended",
        payload: new Date().toISOString(),
      }),
    );
  }

  onClosed(callId: string, msgId: string) {
    if (this.msgIdOfCall === msgId || this._callSession?.id === callId) {
      this.msgIdOfCall = "";
      this._callSession?.close();
      this._callSession = null;
      this.isOnCall.val = false;
    }
  }

  addMessageElement(msg: ChatMessage) {
    const list = this.querySelector("ul")!;
    if (msg.msg.startsWith("call:")) {
      this.callState.val = CallState.Ringing;
      return;
    }
    const child = li(messageElement(msg, this.receiver ?? ""));
    // const child = li(
    //   messageElement(msg, this.receiver ?? "", {
    //     onAnswer: (callId, msgId) => this.onAnswer(callId, msgId),
    //     onReject: (callId, msgId) => this.onReject(callId, msgId),
    //     onCancel: (callId, msgId) => this.onCancel(callId, msgId),
    //     onClosed: (callId, msgId) => this.onClosed(callId, msgId),
    //   }),
    // );
    child.setAttribute("data-msg-id", msg.id);

    if (this.msgs.length == 0 || this.msgs[this.msgs.length - 1].id < msg.id) {
      list.append(child);
      this.msgs.push(msg);
      setTimeout(() => child.scrollIntoView({ behavior: "smooth" }), 100);
    } else {
      let i = 0;
      for (; i < this.msgs.length; i++) {
        if (this.msgs[i].id > msg.id) {
          break;
        }
        if (this.msgs[i].id === msg.id) {
          this.msgs[i] = msg;
          const element = list.querySelector(`[data-msg-id="${msg.id}"]`);
          element?.replaceWith(child);
          return;
        }
      }

      const before = list.querySelector(`[data-msg-id="${this.msgs[i].id}"]`);
      list.insertBefore(child, before);
      this.msgs.splice(i, 0, msg);
    }
    let dateElement = list.querySelector(
      `[data-date="${msg.ts.toLocaleDateString()}"]`,
    );
    if (!dateElement) {
      dateElement = li({ class: "row-center" }, small(msg.ts.toDateString()));
      dateElement.setAttribute("data-date", msg.ts.toLocaleDateString());
      child.insertAdjacentElement("afterbegin", dateElement);
    }
  }

  async getOlderMessages() {
    if (this.msgs.length > 0 && this.session) {
      const oldestMessage = this.msgs[0];
      console.log(
        `Getting older messages than ${JSON.stringify(oldestMessage)}`,
      );
      const messages = await this.session.getPreviousChunk(oldestMessage.id, 1);
      for (const message of messages) {
        this.addMessageElement(message);
      }
    }
  }

  async sendMessage(msg: string) {
    if (msg.length == 0 || !this.session) {
      return;
    }
    const message = await this.session!.sendMessage(msg);
    this.addMessageElement(message);
    return message;
  }

  async updateMessage(id: string, msg: string) {
    if (!this.session) {
      return;
    }
    const message = await this.session?.updateMessage(id, msg);
    this.addMessageElement(message);
    return message;
  }

  submitMessage() {
    const i = this.querySelector(".msg-input-field") as HTMLInputElement;
    this.sendMessage(i.value);
    i.value = "";
  }
}

customElements.define("default-chat-element", DefaultUiChatElement);
