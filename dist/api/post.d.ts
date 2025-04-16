import { CreatePostDetails, CreatePostWithFiles, FullPost, Vote } from "../protos/post";
export declare const getPost: (id: string) => Promise<FullPost>;
export declare enum FetchType {
    Latest = 0,
    Users = 1,
    Replies = 2,
    Edits = 3,
    Search = 4
}
export interface GetPostsData {
    allowedPostTypes?: number;
    fetchType: FetchType;
    fetchTypeFields?: any;
    start?: string;
    end?: string;
}
export declare const getPosts: (getPostDetails: GetPostsData) => Promise<FullPost[]>;
export declare const putVote: (vote: Vote) => Promise<void>;
export declare const putVotes: (votes: Vote[]) => Promise<void>;
export declare const createPost: (createPostDetails: CreatePostDetails) => Promise<FullPost>;
export declare const createPostWithFiles: (createPostDetails: CreatePostWithFiles, files: string[], progressCallback?: (totalBytes: number, bytesSent: number) => void) => Promise<FullPost>;
export declare const reportPost: (id: Uint8Array, text: string) => Promise<void>;
export declare const deletePost: (id: Uint8Array) => Promise<void>;
