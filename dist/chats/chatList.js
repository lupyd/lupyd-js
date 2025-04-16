"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.ChatList = void 0;
const vanjs_core_1 = require("vanjs-core");
const vanjs_ui_1 = require("vanjs-ui");
const auth_1 = require("../firebase/auth");
const chat_1 = require("../api/chat");
const userPage_1 = require("../routes/userPage");
const navigator_1 = require("../routes/navigator");
const utils_1 = require("../bin/utils");
const { strong, div, ul, li, a, h2, small, b } = vanjs_core_1.default.tags;
const ChatList = () => {
    const userState = auth_1.AuthHandler.currentUser();
    return div({ class: "chat-list" }, h2("Chats"), () => {
        const user = userState.val;
        if (user) {
            return (0, vanjs_ui_1.Await)({
                value: (0, chat_1.getLastMessagesForEachUser)(),
                Error(err) {
                    console.error(err);
                    return div({ class: "error" }, "Something went wrong");
                },
            }, (chats) => {
                return ul({ class: "no-pad no-list-style" }, ...chats.map((e) => li(ChatTile(e))));
            });
        }
        else {
            return div("You must be signed in");
        }
    });
};
exports.ChatList = ChatList;
function ChatTile(msg) {
    const other = msg.other;
    const latestMessage = msg.lastMessageSeenByMe.id >= msg.lastMessageSeenByOther.id
        ? msg.lastMessageSeenByMe
        : msg.lastMessageSeenByOther;
    return div({ class: "row p4" }, (0, userPage_1.UserProfileElement)(other), div({ style: "width: 100%", class: "p4" }, div({ class: "row spread" }, a({
        class: "no-text-decoration",
        href: `/chat/${other}`,
        onclick(event) {
            event.preventDefault();
            navigator_1.routeNavigator.pushRoute(`/chat/${other}`, {
                lastMessage: latestMessage,
            });
        },
    }, b(other)), small((0, utils_1.dateToRelativeString)(latestMessage.ts))), div(latestMessage == msg.lastMessageSeenByMe
        ? small(latestMessage.msg)
        : strong(latestMessage.msg))));
}
