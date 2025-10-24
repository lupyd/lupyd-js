import { CreatePostDetails, CreatePostWithFiles, FullPost, Vote } from "../protos/post";
import { PostProtos } from "..";
import { Notifications } from "../protos/notification";
export declare const getPost: (apiUrl: string, id: string) => Promise<FullPost | undefined>;
export declare enum FetchType {
    Latest = 0,
    Users = 1,
    Replies = 2,
    Edits = 3,
    Search = 4,
    Hashtag = 5
}
export interface GetPostsData {
    allowedPostTypes?: number;
    fetchType: FetchType;
    fetchTypeFields?: any;
    start?: string;
    end?: string;
    offset?: number;
}
export declare const getPosts: (getPostDetails: GetPostsData) => Promise<FullPost[]>;
export declare const putVote: (vote: Vote) => Promise<void>;
export declare const putVotes: (votes: Vote[]) => Promise<void>;
export declare const createPost: (createPostDetails: CreatePostDetails) => Promise<FullPost | undefined>;
export declare const createPostWithFiles: (createPostDetails: CreatePostWithFiles, files: string[], progressCallback?: (totalBytes: number, bytesSent: number) => void) => Promise<FullPost | undefined>;
export declare const reportPost: (id: Uint8Array, text: string) => Promise<void>;
export declare const deletePost: (id: Uint8Array) => Promise<void>;
export declare const getTrendingHashtags: () => Promise<PostProtos.PostHashtags>;
export declare const getNotifications: () => Promise<Notifications>;
