"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.getIcon = void 0;
const lucide_1 = require("lucide");
const defaultAttributes = {
    xmlns: "http://www.w3.org/2000/svg",
    width: 24,
    height: 24,
    viewBox: "0 0 24 24",
    fill: "currentColor",
    stroke: "currentColor",
    "stroke-width": 0,
    "stroke-linecap": "round",
    "stroke-linejoin": "round",
};
// export const ThumbsUpFilled: IconNode = [
//   "svg",
//   defaultAttributes,
//   [
//     [
//       "path",
//       {
//         d: "M1 21h4V9H1v12zm22-11c0-1.1-.9-2-2-2h-6.31l.95-4.57.03-.32c0-.41-.17-.79-.44-1.06L14.17 1 7.59 7.59C7.22 7.95 7 8.45 7 9v10c0 1.1.9 2 2 2h9c.83 0 1.54-.5 1.84-1.22l3.02-7.05c.09-.23.14-.47.14-.73v-2z",
//       },
//     ],
//   ],
// ];
// export const ThumbsDownFilled: IconNode = [
//   "svg",
//   defaultAttributes,
//   [
//     [
//       "path",
//       {
//         d: "M15 3H6c-.83 0-1.54.5-1.84 1.22l-3.02 7.05c-.09.23-.14.47-.14.73v2c0 1.1.9 2 2 2h6.31l-.95 4.57-.03.32c0 .41.17.79.44 1.06L9.83 23l6.59-6.59c.36-.36.58-.86.58-1.41V5c0-1.1-.9-2-2-2zm4 0v12h4V3h-4z",
//       },
//     ],
//   ],
// ];
// export const ThumbsUpOutlined: IconNode = [
//   "svg",
//   defaultAttributes,
//   [
//     [
//       "path",
//       {
//         d: "M9 21h9c.83 0 1.54-.5 1.84-1.22l3.02-7.05c.09-.23.14-.47.14-.73v-2c0-1.1-.9-2-2-2h-6.31l.95-4.57.03-.32c0-.41-.17-.79-.44-1.06L14.17 1 7.58 7.59C7.22 7.95 7 8.45 7 9v10c0 1.1.9 2 2 2zM9 9l4.34-4.34L12 10h9v2l-3 7H9V9zM1 9h4v12H1z",
//       },
//     ],
//   ],
// ];
// export const ThumbsDownOutlined: IconNode = [
//   "svg",
//   defaultAttributes,
//   [
//     [
//       "path",
//       {
//         d: "M15 3H6c-.83 0-1.54.5-1.84 1.22l-3.02 7.05c-.09.23-.14.47-.14.73v2c0 1.1.9 2 2 2h6.31l-.95 4.57-.03.32c0 .41.17.79.44 1.06L9.83 23l6.59-6.59c.36-.36.58-.86.58-1.41V5c0-1.1-.9-2-2-2zm0 12-4.34 4.34L12 14H3v-2l3-7h9v10zm4-12h4v12h-4z",
//       },
//     ],
//   ],
// ];
const ICONS = {
    eye: lucide_1.Eye,
    "eye-off": lucide_1.EyeOff,
    file: lucide_1.File,
    image: lucide_1.Image,
    link: lucide_1.Link,
    music: lucide_1.Music,
    menu: lucide_1.Menu,
    more_vertical: lucide_1.MoreVertical,
    moon: lucide_1.Moon,
    paperclip: lucide_1.Paperclip,
    "circle-x": lucide_1.CircleX,
    send: lucide_1.Send,
    search: lucide_1.Search,
    x: lucide_1.X,
    plus: lucide_1.Plus,
    reply: lucide_1.Reply,
    // "thumbs-up": ThumbsUpOutlined,
    // "thumbs-down": ThumbsDownOutlined,
    // "thumbs-up-filled": ThumbsUpFilled,
    // "thumbs-down-filled": ThumbsDownFilled,
    user: lucide_1.User,
    users: lucide_1.Users,
    video: lucide_1.Video,
    "ellipsis-vertical": lucide_1.EllipsisVertical,
    "chevron-down": lucide_1.ChevronDown,
    "chevron-right": lucide_1.ChevronRight,
    "chevron-left": lucide_1.ChevronLeft,
    sun: lucide_1.Sun,
    "message-circle-more": lucide_1.MessageCircleMore,
    "message-circle": lucide_1.MessageCircle,
    delete: lucide_1.Delete,
    trash2: lucide_1.Trash2,
    "send-horizontal": lucide_1.SendHorizonal,
    phone: lucide_1.Phone,
    "phone-off": lucide_1.PhoneOff,
    mic: lucide_1.Mic,
    "mic-off": lucide_1.MicOff,
    settings: lucide_1.Settings,
    "scroll-text": lucide_1.ScrollText,
    scale: lucide_1.Scale,
};
const getIcon = (name) => {
    const icon = ICONS[name];
    if (icon) {
        return (0, lucide_1.createElement)(icon);
    }
    else {
        console.error(`Can't find icon ${name}`);
    }
};
exports.getIcon = getIcon;
