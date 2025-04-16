import { UpdateUserInfo, User } from "../protos/user";
export declare const getUsers: (username: string) => Promise<User[]>;
export declare const getUser: (username: string) => Promise<User>;
export declare const getUsersByUsername: (usernames: string[]) => Promise<User[]>;
export declare const updateUser: (info: UpdateUserInfo) => Promise<void>;
export declare const updateUserProfilePicture: (blob: Blob) => Promise<void>;
export declare const deleteUserProfilePicture: () => Promise<void>;
