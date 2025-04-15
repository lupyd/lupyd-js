import { getDatabase, ref, update } from "firebase/database";
import { MESSAGE_STORAGE } from "../constants";
import { getDatabaseModule } from "../firebase/element";
import { firebaseImport } from "../firebase/firebaseUrls";
import { MultiFiles } from "./multifile";
import { CDN } from "./server";
import { Utils, random } from "./utils";

export enum MessageType {
    none,
    img,
    imgs,
    vid,
    file,
    link,
    call,
    vcall
}

export interface MessageOptions {
    id: string,
    txt: string,
    by: string,
    link?: string,
    type?: MessageType,
}

export const randomMessages = (length: number): MessageOptions[] => random.generateArray(length, (_, r) => {
    const now = new Date()
    return {
        id: Utils.numberToString(now.setSeconds(now.getSeconds() - length + _)),
        txt: r.nextString(255),
        by: r.nextString(16),
    }
})


export const getDateFromString = (id: string) => {
    const millis = Utils.stringToNumber(id);

    return new Date(millis);
}

export type MessageSubmitOptions = MessageOptions & {
    files: File[]
}

const makeMessageReady = async (message: MessageSubmitOptions) => {
    // const username = await _Auth.username();
    // if (!username) {
    //     throw "Must be Verified";
    // }
    const data: any = {}
    if (message.txt.length) {
        data.m = message.txt
    }
    if (message.files && message.type != undefined && message.type != MessageType.none) {
        let body: Blob;
        let link: string;


        const snackBarDispose = Utils.showSnackBar("Uploading files.... might take a while", 10000);
        try {


            if (message.files.length > 1) {
                const [buffer, _] = await MultiFiles.getBodyFromFiles(message.files);
                link = _;
                body = new Blob([buffer]);
            } else {
                body = message.files[0];
                link = MultiFiles.getExtension(message.files[0]);
            }
            const response = await CDN.uploadFile(body, MESSAGE_STORAGE, link);
            if (response.ok) {
                Utils.showSnackBar(`Uploaded successfully, Sending message...`);
                data.l = await response.text();
            } else {
                throw await response.text();
            }
            return data;
        } finally {
            snackBarDispose();
        }
    }
}

export const sendMessageToUser = async (to: string, message: MessageSubmitOptions) => {
    const databaseImport = firebaseImport("database");
    const username = false
    if (!username) throw "no username";
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
    const id = Utils.numberToString(Date.now());

    const { ref, set, getDatabase } = await databaseImport;
    const _ref = ref(getDatabase(), `users/${to}/${username}/${id}`);
    await set(_ref, data)
    const msg: MessageOptions = {
        id,
        txt: data.m,
        by: username,
        link: data.l?.slice(1),
        type: message.type,
    }

    return msg;
    // } else {
    //     Utils.showSnackBar("You have to be signed in to send messages");
    // }
}

export const sendMessageToGroup = async (grpId: string, message: MessageSubmitOptions) => {

    const databaseImport = getDatabaseModule()

    const username = false
    if (!username) throw "no username";

    const data = await makeMessageReady(message);
    data.by = username;

    const id = Utils.numberToString(Date.now() * 1000 + random.nextInt(0, 999));

    const { ref, set, getDatabase } = await databaseImport;

    const _ref = ref(getDatabase(), `_grp/${grpId}/chat/${id.slice(0, 3)}/${id.slice(3)}`);

    await set(_ref, data);

    const msg: MessageOptions = {
        id,
        txt: data.m,
        by: username,
        link: data.l?.slice(1),
        type: message.type,
    }

    return msg;

}

export const sendMessageToUsersAndGroup = async (users: string[], grps: string[], message: MessageSubmitOptions) => {
    const username = false
    if (!username) throw "no username";

    const msg = await makeMessageReady(message);
    const grpMsg = structuredClone(msg);
    grpMsg.by = username;

    const routeMap: any = {};

    const msgId = Utils.numberToString(Date.now());
    users.forEach(e => routeMap[`users/${e}/${username}/${msgId}`] = msg);

    const gmsgId = Utils.numberToString(Date.now() * 1000 + random.nextInt(0, 999));
    grps.forEach(e => routeMap[`_grp/${e}/chat/${gmsgId.slice(0, 3)}/${gmsgId.slice(3)}`] = grpMsg);

    await update(ref(getDatabase()), routeMap);

}