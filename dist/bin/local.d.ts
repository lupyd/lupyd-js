import { FriendStatus } from "../models/friendRequest";
import { _User } from "../models/userModel";
import { MessageOptions } from "./messaging";
export declare class MessageStorage {
    private id;
    private get store();
    constructor(storeId: string);
    put(msg: MessageOptions): Promise<string>;
    getLast(limit?: number, from?: string): Promise<MessageOptions[]>;
    delete(): Promise<unknown>;
}
export declare namespace PrivateGroup {
}
export declare namespace GroupCache {
}
export declare namespace UserCache {
    const get: (id: string) => Promise<_User | undefined>;
    const set: (_user: _User, full?: boolean) => Promise<any>;
    const updateStatusAndLast: (id: string, status?: FriendStatus, last?: number) => Promise<any>;
    const pendingRequests: () => Promise<void>;
    const knownUsers: () => Promise<_User[]>;
    const syncDataBase: () => Promise<void>;
}
export declare namespace VotesStorage {
    const get: (id: string) => Promise<boolean>;
    const put: (vote: Vote) => Promise<string>;
    const remove: (id: string) => Promise<unknown>;
}
export declare namespace Prefs {
    const put: (key: string, value: any) => Promise<unknown>;
    const get: (key: string) => Promise<any>;
}
export declare namespace local {
    const deleteFriend: (id: string, follows?: boolean) => void;
    const syncDataBase: () => Promise<void>;
}
export interface Vote {
    id: string;
    v: boolean;
}
