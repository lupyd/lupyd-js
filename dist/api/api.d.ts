import { CreatePostDetails, CreatePostWithFiles, Vote } from "../protos/post";
import { UpdateUserInfo } from "../protos/user";
import { GetPostsData } from "./post";
export interface DecodedToken {
    uname: string | undefined;
    perms: number | undefined;
    iss: string;
    aud: string[];
    iat: number;
    exp: number;
    jtl: string;
    client_id: string;
    sub: string;
}
export declare function usernameExistsInToken(token: string): boolean;
export declare function getPayloadFromAccessToken(token: string): DecodedToken;
export declare class ApiService {
    private getToken;
    private readonly baseUrl;
    private readonly apiCdnUrl;
    constructor(baseUrl: string, apiCdnUrl: string, getToken: () => Promise<string>);
    getPost(id: string): Promise<import("../protos/post").FullPost | undefined>;
    getPosts(getPostDetails: GetPostsData): Promise<import("../protos/post").FullPost[]>;
    putVote(vote: Vote): Promise<void>;
    putVotes(votes: Vote[]): Promise<void>;
    createPost(createPostDetails: CreatePostDetails): Promise<import("../protos/post").FullPost | undefined>;
    createPostWithFiles(createPostDetails: CreatePostWithFiles, files: string[], progressCallback?: (totalBytes: number, bytesSent: number) => void): Promise<import("../protos/post").FullPost | undefined>;
    reportPost(id: Uint8Array, text: string): Promise<void>;
    deletePost(id: Uint8Array): Promise<void>;
    getTrendingHashtags(): Promise<import("../protos/post").PostHashtags>;
    getNotifications(): Promise<void>;
    getUsers(username: string): Promise<import("../protos/user").User[]>;
    getUser(username: string): Promise<import("../protos/user").User | undefined>;
    getUsersByUsername(usernames: string[]): Promise<import("../protos/user").User[]>;
    updateUser(info: UpdateUserInfo): Promise<void>;
    updateUserProfilePicture(blob: Blob): Promise<void>;
    deleteUserProfilePicture(): Promise<void>;
}
