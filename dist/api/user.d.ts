import { UserProtos } from "..";
import { UpdateUserInfo } from "../protos/user";
export declare const getUsers: (apiUrl: string, username: string, token?: string) => Promise<UserProtos.User[]>;
export declare const getUser: (apiUrl: string, username: string, token?: string) => Promise<UserProtos.User>;
export declare const getUsersByUsername: (apiUrl: string, usernames: string[], token?: string) => Promise<UserProtos.User[]>;
export declare const updateUser: (apiUrl: string, info: UpdateUserInfo, token?: string) => Promise<void>;
export declare const updateUserProfilePicture: (apiCdnUrl: string, blob: Blob, token?: string) => Promise<void>;
export declare const deleteUserProfilePicture: (apiCdnUrl: string, token?: string) => Promise<void>;
export declare enum Relation {
    follow = 0,
    unfollow = 1,
    block = 2,
    unblock = 3,
    accept = 4,
    unaccept = 5
}
export declare const relationToString: (r: Relation) => "follow" | "unfollow" | "block" | "unblock" | "accept" | "unaccept";
export declare const RELATION_FLAGS: {
    readonly FOLLOWS: 1;
    readonly BLOCKED: 2;
    readonly ACCEPTED: 4;
};
export declare class UserRelationsState {
    private followedUsers;
    private blockedUsers;
    private acceptedUsers;
    private userStates;
    private readonly apiUrl;
    getToken: () => Promise<string>;
    onUpdate: (followedUsers: string[], blockedUsers: string[]) => void;
    constructor(onUpdate: (followed: string[], blocked: string[]) => void, apiUrl: string, getToken: () => Promise<string>);
    refresh(): Promise<void>;
    private fromRelations;
    private callUpdate;
    getAllStates(): {
        followed: string[];
        blocked: string[];
        accepted: string[];
        followedUsers: string[];
        blockedUsers: string[];
        acceptedUsers: string[];
        userStates: Map<string, number>;
    };
    getAcceptedUsers(): string[];
    getUserState(username: string): number;
    blockUser(username: string): Promise<void>;
    unblockUser(username: string): Promise<void>;
    followUser(username: string): Promise<void>;
    unfollowUser(username: string): Promise<void>;
    acceptUser(username: string): Promise<void>;
    unacceptUser(username: string): Promise<void>;
}
export declare function getUserRelations(apiUrl: string, token?: string): Promise<UserProtos.Relations>;
export declare function updateUserRelation(apiUrl: string, username: string, relation: Relation, token: string): Promise<void>;
