export interface UserData {
    follows: string[];
    savedPosts: string[];
    dissappearingMessages: number;
}
export declare class UsersFollowState {
    localUserFollows: Array<string>;
    localUserSavedPosts: Array<string>;
    onChange: (_: UsersFollowState) => void;
    constructor(callback?: (state: UsersFollowState) => void);
    setOnChangeCallback(callback: (state: UsersFollowState) => void): void;
    followUser(username: string): Promise<void>;
    unfollowUser(username: string): Promise<void>;
    savePost(postId: string): Promise<void>;
    unsavePost(postId: string): Promise<void>;
    doesFollowUser(username: string): boolean;
    isSavedPost(postId: string): boolean;
}
export declare const getFollowedUsersState: () => UsersFollowState;
export declare const getUserData: () => Promise<{
    follows: string[];
    dissapearingMessages: number;
    savedPosts: string[];
}>;
export declare function fetchUserDoc(): Promise<{
    follows: string[];
    dissapearingMessages: number;
    savedPosts: string[];
}>;
export declare function updateUserDocFollows(usersAffected: Array<string>, removeThem: boolean): Promise<{
    follows: string[];
    dissapearingMessages: number;
    savedPosts: string[];
}>;
export declare function updateUserDocSavedPosts(postsAffected: Array<string>, removeThem: boolean): Promise<{
    follows: string[];
    dissapearingMessages: number;
    savedPosts: string[];
}>;
