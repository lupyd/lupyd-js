import van from "vanjs-core";
import { Await } from "vanjs-ui";
import { AuthHandler } from "../firebase/auth";
import { getLastMessagesForEachUser, LastChatMessagePair } from "../api/chat";
import { UserProfileElement } from "../routes/userPage";
import { routeNavigator } from "../routes/navigator";
import { dateToRelativeString } from "../bin/utils";

const { strong, div, ul, li, a, h2, small, b } = van.tags;

export const ChatList = () => {
  const userState = AuthHandler.currentUser();

  return div({ class: "chat-list" }, h2("Chats"), () => {
    const user = userState.val;

    if (user) {
      return Await(
        {
          value: getLastMessagesForEachUser(),
          Error(err) {
            console.error(err);
            return div({ class: "error" }, "Something went wrong");
          },
        },
        (chats) => {
          return ul(
            { class: "no-pad no-list-style" },
            ...chats.map((e) => li(ChatTile(e))),
          );
        },
      );
    } else {
      return div("You must be signed in");
    }
  });
};

function ChatTile(msg: LastChatMessagePair) {
  const other = msg.other;
  const latestMessage =
    msg.lastMessageSeenByMe.id >= msg.lastMessageSeenByOther.id
      ? msg.lastMessageSeenByMe
      : msg.lastMessageSeenByOther;
  return div(
    { class: "row p4" },
    UserProfileElement(other),
    div(
      { style: "width: 100%", class: "p4" },
      div(
        { class: "row spread" },
        a(
          {
            class: "no-text-decoration",
            href: `/chat/${other}`,
            onclick(event: Event) {
              event.preventDefault();
              routeNavigator.pushRoute(`/chat/${other}`, {
                lastMessage: latestMessage,
              });
            },
          },
          b(other),
        ),
        small(dateToRelativeString(latestMessage.ts)),
      ),
      div(
        latestMessage == msg.lastMessageSeenByMe
          ? small(latestMessage.msg)
          : strong(latestMessage.msg),
      ),
    ),
  );
}
