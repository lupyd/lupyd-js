import { BinaryReader, BinaryWriter } from "@bufbuild/protobuf/wire";
import { Elements } from "./lupyd-md";
export declare const protobufPackage = "lupyd.post";
export declare enum postType {
    NOT_DEFINED = 0,
    SAFE = 1,
    ANONYMOUS = 2,
    NSFW = 4,
    DANGEROUS = 8,
    UNRECOGNIZED = -1
}
export declare function postTypeFromJSON(object: any): postType;
export declare function postTypeToJSON(object: postType): string;
/** nullable boolean, because proto3 made some weird decisions */
export interface BoolValue {
    val: boolean;
}
export interface PostBody {
    plainText?: string | undefined;
    markdown?: string | undefined;
    elements?: Elements | undefined;
}
export interface PostBodies {
    /** Edits will be appended */
    bodies: PostBody[];
}
export interface FullPost {
    /** required */
    id: Uint8Array;
    title: string;
    by: string;
    /** Bit Enum so can't use regular protobuf Enum to represent it */
    postType: number;
    expiry: bigint;
    /** replying to the post id, becomes child of it, and will expire once the parent expires */
    replyingTo: Uint8Array;
    /** PostBodies but is stored as bytes in the lupyd database (postgres), so instead of reconstructing we just use byte representation and rely on protobuf parser on client and server side, not a good idea */
    body: Uint8Array;
    replies: bigint;
    upvotes: bigint;
    downvotes: bigint;
    /** to preserve your posts privately only to the user */
    isMemory: boolean;
    vote: BoolValue | undefined;
}
export interface CreatePostDetails {
    title: string;
    body: PostBody | undefined;
    expiry: bigint;
    postType: number;
    isMemory: boolean;
    replyingTo: Uint8Array;
    files: string[];
    /** body and files will be appended to previous post, everything else is ignored */
    editingFrom: Uint8Array;
}
export interface CreatePostWithFiles {
    /** required */
    fields: CreatePostDetails | undefined;
    files: File[];
}
export interface File {
    name: string;
    mimeType: string;
    length: bigint;
}
export interface GetPostsData {
    allowedPostTypes: number;
    by: string[];
    allPosts: boolean;
    cursor: Uint8Array;
    tags: string;
}
export interface FullPosts {
    posts: FullPost[];
}
export interface Votes {
    votes: Vote[];
}
export interface Vote {
    id: Uint8Array;
    val: BoolValue | undefined;
}
export interface PostIds {
    ids: Uint8Array[];
}
export interface CreateFileFields {
    expiry: bigint;
    by: string;
    files: string[];
}
export interface PollVote {
    postId: Uint8Array;
    optionId: number;
}
export interface PollOption {
    optionId: number;
    votes: bigint;
}
export interface PollResult {
    pollId: Uint8Array;
    values: number[];
}
export interface PollResults {
    results: PollResult[];
}
export interface CreatePollFields {
    postId: Uint8Array;
    numOfOpts: number;
}
export interface PollUserVote {
    pollId: Uint8Array;
    val: number;
}
export interface PollUserVotes {
    votes: PollUserVote[];
}
export interface PostReport {
    postId: Uint8Array;
    sevirity: number;
    description: string;
}
export interface PostHashtag {
    name: string;
    total: number;
}
export interface PostHashtags {
    hashtags: PostHashtag[];
}
export declare const BoolValue: MessageFns<BoolValue>;
export declare const PostBody: MessageFns<PostBody>;
export declare const PostBodies: MessageFns<PostBodies>;
export declare const FullPost: MessageFns<FullPost>;
export declare const CreatePostDetails: MessageFns<CreatePostDetails>;
export declare const CreatePostWithFiles: MessageFns<CreatePostWithFiles>;
export declare const File: MessageFns<File>;
export declare const GetPostsData: MessageFns<GetPostsData>;
export declare const FullPosts: MessageFns<FullPosts>;
export declare const Votes: MessageFns<Votes>;
export declare const Vote: MessageFns<Vote>;
export declare const PostIds: MessageFns<PostIds>;
export declare const CreateFileFields: MessageFns<CreateFileFields>;
export declare const PollVote: MessageFns<PollVote>;
export declare const PollOption: MessageFns<PollOption>;
export declare const PollResult: MessageFns<PollResult>;
export declare const PollResults: MessageFns<PollResults>;
export declare const CreatePollFields: MessageFns<CreatePollFields>;
export declare const PollUserVote: MessageFns<PollUserVote>;
export declare const PollUserVotes: MessageFns<PollUserVotes>;
export declare const PostReport: MessageFns<PostReport>;
export declare const PostHashtag: MessageFns<PostHashtag>;
export declare const PostHashtags: MessageFns<PostHashtags>;
type Builtin = Date | Function | Uint8Array | string | number | boolean | bigint | undefined;
export type DeepPartial<T> = T extends Builtin ? T : T extends globalThis.Array<infer U> ? globalThis.Array<DeepPartial<U>> : T extends ReadonlyArray<infer U> ? ReadonlyArray<DeepPartial<U>> : T extends {} ? {
    [K in keyof T]?: DeepPartial<T[K]>;
} : Partial<T>;
type KeysOfUnion<T> = T extends T ? keyof T : never;
export type Exact<P, I extends P> = P extends Builtin ? P : P & {
    [K in keyof P]: Exact<P[K], I[K]>;
} & {
    [K in Exclude<keyof I, KeysOfUnion<P>>]: never;
};
export interface MessageFns<T> {
    encode(message: T, writer?: BinaryWriter): BinaryWriter;
    decode(input: BinaryReader | Uint8Array, length?: number): T;
    fromJSON(object: any): T;
    toJSON(message: T): unknown;
    create<I extends Exact<DeepPartial<T>, I>>(base?: I): T;
    fromPartial<I extends Exact<DeepPartial<T>, I>>(object: I): T;
}
export {};
