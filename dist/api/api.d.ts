import { CreatePostDetails, CreatePostWithFiles, Vote } from "../protos/post";
import { UpdateUserInfo } from "../protos/user";
import { GetPostsData } from "./post";
import { MultipartPart } from "./multipart";
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
    private readonly apiUrl;
    private readonly apiCdnUrl;
    constructor(apiUrl: string, apiCdnUrl: string, getToken: () => Promise<string>);
    getPost(id: string): Promise<import("../protos/post").FullPost>;
    getPosts(getPostDetails: GetPostsData): Promise<import("../protos/post").FullPost[]>;
    putVote(vote: Vote): Promise<void>;
    putVotes(votes: Vote[]): Promise<void>;
    createPost(createPostDetails: CreatePostDetails): Promise<import("../protos/post").FullPost>;
    createPostWithFiles(createPostDetails: CreatePostWithFiles, files: string[], progressCallback?: (totalBytes: number, bytesSent: number) => void): Promise<import("../protos/post").FullPost>;
    reportPost(id: Uint8Array, text: string): Promise<void>;
    deletePost(id: Uint8Array): Promise<void>;
    getTrendingHashtags(): Promise<import("../protos/post").PostHashtags>;
    getNotifications(): Promise<import("../protos/notification").Notifications>;
    getUsers(username: string): Promise<import("../protos/user").User[]>;
    getUser(username: string): Promise<import("../protos/user").User>;
    getUsersByUsername(usernames: string[]): Promise<import("../protos/user").User[]>;
    updateUser(info: UpdateUserInfo): Promise<void>;
    updateUserProfilePicture(blob: Blob): Promise<void>;
    deleteUserProfilePicture(): Promise<void>;
    deleteUser(): Promise<void>;
    assignUsername(username: string, bio: Uint8Array, settings: number): Promise<void>;
    uploadFile(filename: string, mimeType: string, blob: BodyInit, contentLength?: number | undefined): Promise<string>;
    savePost(postId: string): Promise<void>;
    getSavedPosts(): Promise<string[]>;
    createMultipartUpload(fileName: string, contentType: string, totalSize: number, key?: string): Promise<import("./multipart").MultipartCreateResponse>;
    uploadPart(key: string, uploadId: string, partNumber: number, body: BodyInit): Promise<MultipartPart>;
    completeMultipartUpload(key: string, uploadId: string, parts: MultipartPart[]): Promise<import("./multipart").MultipartCompleteResponse>;
    abortMultipartUpload(key: string, uploadId: string): Promise<import("./multipart").MultipartAbortResponse>;
    uploadFileMultipart(fileName: string, mimeType: string, data: Blob | Uint8Array, partSize?: number, progressCallback?: (totalBytes: number, bytesSent: number) => void): Promise<import("./multipart").MultipartCompleteResponse>;
}
