export interface UserData {
    follows: string[];
    dissappearingMessages: number;
}
export declare const getFollowedUsersState: () => import("vanjs-core").State<string[]>;
export declare const getDissaperaingMessagesState: () => import("vanjs-core").State<number>;
export declare const getUserData: () => Promise<{
    follows: string[];
    dissapearingMessages: number;
}>;
export declare const followUsers: (users: Array<string>) => Promise<void>;
export declare const unfollowUsers: (users: Array<string>) => Promise<void>;
export declare function fetchUserDoc(): Promise<{
    follows: string[];
    dissapearingMessages: number;
}>;
export declare function updateUserDocFollows(usersAffected: Array<string>, removeThem: boolean): Promise<{
    follows: string[];
    dissapearingMessages: number;
}>;
