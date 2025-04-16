"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.sendMessageToUsersAndGroup = exports.sendMessageToGroup = exports.sendMessageToUser = exports.getDateFromString = exports.randomMessages = exports.MessageType = void 0;
const database_1 = require("firebase/database");
const constants_1 = require("../constants");
const element_1 = require("../firebase/element");
const firebaseUrls_1 = require("../firebase/firebaseUrls");
const multifile_1 = require("./multifile");
const server_1 = require("./server");
const utils_1 = require("./utils");
var MessageType;
(function (MessageType) {
    MessageType[MessageType["none"] = 0] = "none";
    MessageType[MessageType["img"] = 1] = "img";
    MessageType[MessageType["imgs"] = 2] = "imgs";
    MessageType[MessageType["vid"] = 3] = "vid";
    MessageType[MessageType["file"] = 4] = "file";
    MessageType[MessageType["link"] = 5] = "link";
    MessageType[MessageType["call"] = 6] = "call";
    MessageType[MessageType["vcall"] = 7] = "vcall";
})(MessageType || (exports.MessageType = MessageType = {}));
const randomMessages = (length) => utils_1.random.generateArray(length, (_, r) => {
    const now = new Date();
    return {
        id: utils_1.Utils.numberToString(now.setSeconds(now.getSeconds() - length + _)),
        txt: r.nextString(255),
        by: r.nextString(16),
    };
});
exports.randomMessages = randomMessages;
const getDateFromString = (id) => {
    const millis = utils_1.Utils.stringToNumber(id);
    return new Date(millis);
};
exports.getDateFromString = getDateFromString;
const makeMessageReady = async (message) => {
    // const username = await _Auth.username();
    // if (!username) {
    //     throw "Must be Verified";
    // }
    const data = {};
    if (message.txt.length) {
        data.m = message.txt;
    }
    if (message.files && message.type != undefined && message.type != MessageType.none) {
        let body;
        let link;
        const snackBarDispose = utils_1.Utils.showSnackBar("Uploading files.... might take a while", 10000);
        try {
            if (message.files.length > 1) {
                const [buffer, _] = await multifile_1.MultiFiles.getBodyFromFiles(message.files);
                link = _;
                body = new Blob([buffer]);
            }
            else {
                body = message.files[0];
                link = multifile_1.MultiFiles.getExtension(message.files[0]);
            }
            const response = await server_1.CDN.uploadFile(body, constants_1.MESSAGE_STORAGE, link);
            if (response.ok) {
                utils_1.Utils.showSnackBar(`Uploaded successfully, Sending message...`);
                data.l = await response.text();
            }
            else {
                throw await response.text();
            }
            return data;
        }
        finally {
            snackBarDispose();
        }
    }
};
const sendMessageToUser = async (to, message) => {
    const databaseImport = (0, firebaseUrls_1.firebaseImport)("database");
    const username = false;
    if (!username)
        throw "no username";
    // if (username) {
    // const data: any = {
    //     m: message.txt,
    // }
    // if (message.files && message.type != undefined && message.type != MessageType.none) {
    //     let body: Blob;
    //     let headers: undefined | any;
    //     const snackBarDispose = Utils.showSnackBar("Uploading files.... might take a while", 10000);
    //     if (message.files.length > 1) {
    //         const buffer = await MultiFiles.getBodyFromFiles(message.files);
    //         body = new Blob([buffer[0]]);
    //         headers = buffer[1];
    //     } else {
    //         body = message.files[0];
    //     }
    //     const response = await CDN.uploadFile(body, MESSAGE_STORAGE, headers);
    //     snackBarDispose();
    //     if (response.ok) {
    //         Utils.showSnackBar(`Uploaded successfully, Sending message...`);
    //         data.l = message.type + await response.text();
    //     } else {
    //         throw await response.text();
    //     }
    // }
    const data = await makeMessageReady(message);
    const id = utils_1.Utils.numberToString(Date.now());
    const { ref, set, getDatabase } = await databaseImport;
    const _ref = ref(getDatabase(), `users/${to}/${username}/${id}`);
    await set(_ref, data);
    const msg = {
        id,
        txt: data.m,
        by: username,
        link: data.l?.slice(1),
        type: message.type,
    };
    return msg;
    // } else {
    //     Utils.showSnackBar("You have to be signed in to send messages");
    // }
};
exports.sendMessageToUser = sendMessageToUser;
const sendMessageToGroup = async (grpId, message) => {
    const databaseImport = (0, element_1.getDatabaseModule)();
    const username = false;
    if (!username)
        throw "no username";
    const data = await makeMessageReady(message);
    data.by = username;
    const id = utils_1.Utils.numberToString(Date.now() * 1000 + utils_1.random.nextInt(0, 999));
    const { ref, set, getDatabase } = await databaseImport;
    const _ref = ref(getDatabase(), `_grp/${grpId}/chat/${id.slice(0, 3)}/${id.slice(3)}`);
    await set(_ref, data);
    const msg = {
        id,
        txt: data.m,
        by: username,
        link: data.l?.slice(1),
        type: message.type,
    };
    return msg;
};
exports.sendMessageToGroup = sendMessageToGroup;
const sendMessageToUsersAndGroup = async (users, grps, message) => {
    const username = false;
    if (!username)
        throw "no username";
    const msg = await makeMessageReady(message);
    const grpMsg = structuredClone(msg);
    grpMsg.by = username;
    const routeMap = {};
    const msgId = utils_1.Utils.numberToString(Date.now());
    users.forEach(e => routeMap[`users/${e}/${username}/${msgId}`] = msg);
    const gmsgId = utils_1.Utils.numberToString(Date.now() * 1000 + utils_1.random.nextInt(0, 999));
    grps.forEach(e => routeMap[`_grp/${e}/chat/${gmsgId.slice(0, 3)}/${gmsgId.slice(3)}`] = grpMsg);
    await (0, database_1.update)((0, database_1.ref)((0, database_1.getDatabase)()), routeMap);
};
exports.sendMessageToUsersAndGroup = sendMessageToUsersAndGroup;
