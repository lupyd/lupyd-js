export interface UserData {
    follows: string[];
    dissappearingMessages: number;
}
export declare class UsersFollowState {
    localUserFollows: Array<string>;
    onChange: (_: UsersFollowState) => void;
    constructor(callback?: (state: UsersFollowState) => void);
    setOnChangeCallback(callback: (state: UsersFollowState) => void): void;
    followUser(username: string): Promise<void>;
    unfollowUser(username: string): Promise<void>;
    doesFollowUser(username: string): boolean;
}
export declare const getFollowedUsersState: () => UsersFollowState;
export declare const getUserData: () => Promise<{
    follows: string[];
    dissapearingMessages: number;
}>;
export declare function fetchUserDoc(): Promise<{
    follows: string[];
    dissapearingMessages: number;
}>;
export declare function updateUserDocFollows(usersAffected: Array<string>, removeThem: boolean): Promise<{
    follows: string[];
    dissapearingMessages: number;
}>;
