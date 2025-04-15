import {
  createElement,
  File,
  Music,
  Paperclip,
  CircleX,
  Eye,
  EyeOff,
  Send,
  Search,
  X,
  Image,
  Link,
  Menu,
  MoreVertical,
  Plus,
  Reply,
  User,
  Video,
  EllipsisVertical,
  ChevronDown,
  ChevronRight,
  ChevronLeft,
  IconNode,
  Sun,
  Moon,
  MessageCircleMore,
  MessageCircle,
  Delete,
  Trash2,
  SendHorizonal,
  Phone,
  PhoneOff,
  Mic,
  MicOff,
  Settings,
  Users,
  ScrollText,
  Scale,
} from "lucide";

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

export const ThumbsUpFilled: IconNode = [
  "svg",
  defaultAttributes,
  [
    [
      "path",
      {
        d: "M1 21h4V9H1v12zm22-11c0-1.1-.9-2-2-2h-6.31l.95-4.57.03-.32c0-.41-.17-.79-.44-1.06L14.17 1 7.59 7.59C7.22 7.95 7 8.45 7 9v10c0 1.1.9 2 2 2h9c.83 0 1.54-.5 1.84-1.22l3.02-7.05c.09-.23.14-.47.14-.73v-2z",
      },
    ],
  ],
];

export const ThumbsDownFilled: IconNode = [
  "svg",
  defaultAttributes,
  [
    [
      "path",
      {
        d: "M15 3H6c-.83 0-1.54.5-1.84 1.22l-3.02 7.05c-.09.23-.14.47-.14.73v2c0 1.1.9 2 2 2h6.31l-.95 4.57-.03.32c0 .41.17.79.44 1.06L9.83 23l6.59-6.59c.36-.36.58-.86.58-1.41V5c0-1.1-.9-2-2-2zm4 0v12h4V3h-4z",
      },
    ],
  ],
];

export const ThumbsUpOutlined: IconNode = [
  "svg",
  defaultAttributes,
  [
    [
      "path",
      {
        d: "M9 21h9c.83 0 1.54-.5 1.84-1.22l3.02-7.05c.09-.23.14-.47.14-.73v-2c0-1.1-.9-2-2-2h-6.31l.95-4.57.03-.32c0-.41-.17-.79-.44-1.06L14.17 1 7.58 7.59C7.22 7.95 7 8.45 7 9v10c0 1.1.9 2 2 2zM9 9l4.34-4.34L12 10h9v2l-3 7H9V9zM1 9h4v12H1z",
      },
    ],
  ],
];

export const ThumbsDownOutlined: IconNode = [
  "svg",
  defaultAttributes,
  [
    [
      "path",
      {
        d: "M15 3H6c-.83 0-1.54.5-1.84 1.22l-3.02 7.05c-.09.23-.14.47-.14.73v2c0 1.1.9 2 2 2h6.31l-.95 4.57-.03.32c0 .41.17.79.44 1.06L9.83 23l6.59-6.59c.36-.36.58-.86.58-1.41V5c0-1.1-.9-2-2-2zm0 12-4.34 4.34L12 14H3v-2l3-7h9v10zm4-12h4v12h-4z",
      },
    ],
  ],
];

const ICONS: Record<string, IconNode> = {
  eye: Eye,
  "eye-off": EyeOff,
  file: File,
  image: Image,
  link: Link,
  music: Music,
  menu: Menu,
  more_vertical: MoreVertical,
  moon: Moon,
  paperclip: Paperclip,
  "circle-x": CircleX,
  send: Send,
  search: Search,
  x: X,
  plus: Plus,
  reply: Reply,
  "thumbs-up": ThumbsUpOutlined,
  "thumbs-down": ThumbsDownOutlined,
  "thumbs-up-filled": ThumbsUpFilled,
  "thumbs-down-filled": ThumbsDownFilled,
  user: User,
  users: Users,
  video: Video,
  "ellipsis-vertical": EllipsisVertical,
  "chevron-down": ChevronDown,
  "chevron-right": ChevronRight,
  "chevron-left": ChevronLeft,
  sun: Sun,
  "message-circle-more": MessageCircleMore,
  "message-circle": MessageCircle,
  delete: Delete,
  trash2: Trash2,
  "send-horizontal": SendHorizonal,
  phone: Phone,
  "phone-off": PhoneOff,
  mic: Mic,
  "mic-off": MicOff,
  settings: Settings,
  "scroll-text": ScrollText,
  scale: Scale,
} as const;

export const getIcon = (name: string) => {
  const icon = ICONS[name] as IconNode | undefined;
  if (icon) {
    return createElement(icon);
  } else {
    console.error(`Can't find icon ${name}`);
  }
};
