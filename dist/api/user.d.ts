import { UserProtos } from "..";
import { UpdateUserInfo } from "../protos/user";
export declare const getUsers: (username: string) => Promise<UserProtos.User[]>;
export declare const getUser: (username: string) => Promise<UserProtos.User | undefined>;
export declare const getUsersByUsername: (usernames: string[]) => Promise<UserProtos.User[]>;
export declare const updateUser: (info: UpdateUserInfo) => Promise<void>;
export declare const updateUserProfilePicture: (blob: Blob) => Promise<void>;
export declare const deleteUserProfilePicture: () => Promise<void>;
declare enum Relation {
    follow = 0,
    unfollow = 1,
    block = 2,
    unblock = 3
}
export declare const relationToString: (r: Relation) => "follow" | "unfollow" | "block" | "unblock";
export declare class UserRelationsState {
    private followedUsers;
    private blockedUsers;
    onUpdate: (followedUsers: string[], blockedUsers: string[]) => void;
    constructor(onUpdate: (_: any, __: any) => {});
    refresh(): Promise<void>;
    private fromRelations;
    private callUpdate;
    blockUser(username: string): Promise<void>;
    unblockUser(username: string): Promise<void>;
    followUser(username: string): Promise<void>;
    unfollowUser(username: string): Promise<void>;
}
export declare function getUserRelations(): Promise<UserProtos.Relations>;
export declare function updateUserRelation(username: string, relation: Relation): Promise<void>;
export {};
