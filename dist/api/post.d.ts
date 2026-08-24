import { post as PostProtos, notification as NotificationProtos } from "@lupyd/protos";
declare const CreatePostDetails: PostProtos.MessageFns<PostProtos.CreatePostDetails>, CreatePostWithFiles: PostProtos.MessageFns<PostProtos.CreatePostWithFiles>, Vote: PostProtos.MessageFns<PostProtos.Vote>;
type CreatePostDetails = PostProtos.CreatePostDetails;
type CreatePostWithFiles = PostProtos.CreatePostWithFiles;
type Vote = PostProtos.Vote;
export declare const getPost: (apiUrl: string, id: string, token?: string) => Promise<PostProtos.FullPost>;
export declare enum FetchType {
    Latest = 0,
    Users = 1,
    Replies = 2,
    Edits = 3,
    Search = 4,
    Hashtag = 5,
    Ids = 6
}
export interface GetPostsData {
    allowedPostTypes?: number;
    fetchType: FetchType;
    fetchTypeFields?: any;
    start?: string;
    end?: string;
    offset?: number;
}
export declare const getPosts: (apiUrl: string, getPostDetails: GetPostsData, token?: string) => Promise<PostProtos.FullPost[]>;
export declare const putVotes: (apiUrl: string, votes: Vote[], token?: string) => Promise<void>;
export declare const createPost: (apiUrl: string, createPostDetails: CreatePostDetails, token?: string) => Promise<PostProtos.FullPost>;
export declare const createPostWithFiles: (apiCdnUrl: string, createPostDetails: CreatePostWithFiles, files: string[], progressCallback?: (totalBytes: number, bytesSent: number) => void, token?: string) => Promise<PostProtos.FullPost>;
export declare const reportPost: (apiUrl: string, id: Uint8Array, text: string, token?: string) => Promise<void>;
export declare const deletePost: (apiUrl: string, id: Uint8Array, token?: string) => Promise<void>;
export declare const getTrendingHashtags: (apiUrl: string) => Promise<PostProtos.PostHashtags>;
export declare const getNotifications: (apiUrl: string, token?: string) => Promise<NotificationProtos.Notifications>;
export declare const savePost: (apiUrl: string, token: string, postId: string) => Promise<void>;
export declare const getSavedPosts: (apiUrl: string, token: string) => Promise<string[]>;
export {};
