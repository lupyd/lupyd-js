import { API_URL, API_CDN_URL } from "../constants";
import {
  CreatePostDetails,
  CreatePostWithFiles,
  FullPost,
  FullPosts,
  PostBodies,
  PostReport,
  Vote,
  Votes,
} from "../protos/post";
import {
  fetchWithProgress,
  isValidUsername,
  ulidStringify,
  Utils,
} from "../bin/utils";
import { PostProtos } from "..";
import { Notifications } from "../protos/notification";
import { getAuthHandler } from "../auth/auth";

export enum FetchType {
  Latest,
  Users,
  Replies,
  Edits,
  Search,
  Hashtag,
}

export interface GetPostsData {
  allowedPostTypes?: number;
  fetchType: FetchType;
  fetchTypeFields?: any;
  start?: string;
  end?: string;
  offset?: number;
}

export interface AuthHandler {
  getToken(): Promise<string | undefined>;
  getUsername(): Promise<string | null>;
}

export interface ApiConfig {
  apiUrl: string;
  apiCdnUrl: string;
}

export class PostService {
  private authHandler: AuthHandler;
  private config: ApiConfig;
  private votesRequestBatcher: VotesRequestBatcher;

  constructor(authHandler: AuthHandler, config: ApiConfig) {
    this.authHandler = authHandler;
    this.config = config;
    this.votesRequestBatcher = new VotesRequestBatcher(this);
  }

  async getPost(id: string): Promise<FullPost | undefined> {
    const url = `${this.config.apiUrl}/post/${id}`;
    const response = await fetch(url);

    if (response.status === 200) {
      return FullPost.decode(new Uint8Array(await response.arrayBuffer()));
    } else {
      console.error(`${url} [${response.status}] ${await response.text()}`);
      return undefined;
    }
  }

  private parseGetPostsData(details: GetPostsData): URLSearchParams {
    const searchParams = new URLSearchParams();
    searchParams.append("type", (details.allowedPostTypes ?? 0).toString());
    
    if (details.start) {
      searchParams.append("start", details.start);
    }

    if (details.end) {
      searchParams.append("end", details.end);
    }

    if (details.offset) {
      searchParams.append("offset", details.offset.toString());
    }

    switch (details.fetchType) {
      case FetchType.Latest: {
        break;
      }
      case FetchType.Users: {
        if (
          Array.isArray(details.fetchTypeFields) &&
          details.fetchTypeFields.every((e) => typeof e === "string")
        ) {
          searchParams.append("users", details.fetchTypeFields.join(","));
        } else if (
          typeof details.fetchTypeFields === "string" &&
          isValidUsername(details.fetchTypeFields)
        ) {
          searchParams.append("users", details.fetchTypeFields);
        } else {
          throw new Error("Invalid FetchType.Users");
        }
        break;
      }
      case FetchType.Replies: {
        if (typeof details.fetchTypeFields === "string") {
          searchParams.append("replies", details.fetchTypeFields);
        } else if (
          Array.isArray(details.fetchTypeFields) &&
          details.fetchTypeFields.every((e) => typeof e === "string")
        ) {
          searchParams.append("replies", details.fetchTypeFields.join(","));
        } else {
          throw new Error("Invalid FetchType.Replies");
        }
        break;
      }
      case FetchType.Edits: {
        if (typeof details.fetchTypeFields === "string") {
          searchParams.append("edits", details.fetchTypeFields);
        } else if (
          Array.isArray(details.fetchTypeFields) &&
          details.fetchTypeFields.every((e) => typeof e === "string")
        ) {
          searchParams.append("edits", details.fetchTypeFields.join(","));
        } else {
          throw new Error("Invalid FetchType.Edits");
        }
        break;
      }
      case FetchType.Search: {
        if (typeof details.fetchTypeFields === "string") {
          searchParams.append("search", details.fetchTypeFields);
        } else {
          throw new Error("Invalid FetchType.Search");
        }
        break;
      }
      case FetchType.Hashtag: {
        if (typeof details.fetchTypeFields === "string") {
          searchParams.append("hashtag", details.fetchTypeFields);
        } else {
          throw new Error("Invalid FetchType.Hashtag");
        }
        break;
      }
    }

    return searchParams;
  }

  async getPosts(getPostDetails: GetPostsData): Promise<FullPost[]> {
    try {
      const url = new URL(`${this.config.apiUrl}/post`, window.location.origin);
      this.parseGetPostsData(getPostDetails).forEach((value, key) =>
        url.searchParams.append(key, value),
      );
      
      const token = await this.authHandler.getToken();
      const response = await fetch(url, {
        headers: token ? { Authorization: `Bearer ${token}` } : undefined,
      });

      console.log({ url: url.toString() });
      if (response.status === 200) {
        const posts = FullPosts.decode(
          new Uint8Array(await response.arrayBuffer()),
        ).posts;
        return posts;
      } else {
        console.error(`${url} [${response.status}] ${await response.text()}`);
      }
    } catch (err) {
      console.error(err);
    }

    return [];
  }

  async putVote(vote: Vote): Promise<void> {
    return this.putVotes([vote]);
  }

  async putVotes(votes: Vote[]): Promise<void> {
    try {
      const url = `${this.config.apiUrl}/vote`;
      const token = await this.authHandler.getToken();
      if (!token) {
        throw new Error(`User not authenticated`);
      }
      
      const body = Votes.encode(Votes.create({ votes })).finish();
      const response = await fetch(url, {
        method: "PUT",
        body,
        headers: {
          authorization: `Bearer ${token}`,
        },
      });

      if (response.status === 200) {
        console.log(`Successfully voted`);
        const username = await this.authHandler.getUsername();
      } else {
        console.error(`${url} [${response.status}] ${await response.text()}`);
      }
    } catch (err) {
      console.error(err);
    }
  }

  async createPost(createPostDetails: CreatePostDetails): Promise<FullPost | undefined> {
    const url = `${this.config.apiUrl}/post`;
    const username = await this.authHandler.getUsername();
    const token = await this.authHandler.getToken();
    
    if (username === null || token === undefined) {
      throw new Error("User Not Authenticated");
    }
    
    console.log({ createPostDetails });
    const response = await fetch(url, {
      method: "POST",
      headers: { Authorization: `Bearer ${token}` },
      body: CreatePostDetails.encode(createPostDetails).finish(),
    });
    
    if (response.status === 200) {
      const id = new Uint8Array(await response.arrayBuffer());
      const post = FullPost.create({
        id,
        title: createPostDetails.title,
        body: createPostDetails.body
          ? PostBodies.encode(
              PostBodies.create({ bodies: [createPostDetails.body] }),
            ).finish()
          : new Uint8Array(),
        expiry: createPostDetails.expiry,
        replyingTo: createPostDetails.replyingTo,
        postType: createPostDetails.postType,
        isMemory: createPostDetails.isMemory,
        by: username,
      });

      return post;
    } else {
      console.error(`${url} [${response.status}] ${await response.text()}`);
      return undefined;
    }
  }

  private async makeCreatePostWithFilesBlob(
    details: CreatePostWithFiles,
    files: string[],
  ): Promise<Blob> {
    const detailsProto = CreatePostWithFiles.encode(details).finish();
    const contentLength =
      detailsProto.byteLength +
      8 +
      details.files.map((e) => Number(e.length)).reduce((a, b) => a + b);

    const blobParts: BlobPart[] = [];

    console.log({ contentLength });

    blobParts.push(
      Utils.bigintToBigEndian8Bytes(BigInt(detailsProto.byteLength)),
    );
    blobParts.push(detailsProto);

    for (const file of files) {
      const response = await fetch(file);

      if (response.body && response.status === 200) {
        const blob = await response.blob();
        blobParts.push(blob);
      } else {
        throw new Error("File or blob url is invalid");
      }
    }
    
    console.log({ blobParts });
    return new Blob(blobParts);
  }

  async createPostWithFiles(
    createPostDetails: CreatePostWithFiles,
    files: string[],
    progressCallback?: (totalBytes: number, bytesSent: number) => void,
  ): Promise<FullPost | undefined> {
    const url = `${this.config.apiCdnUrl}/post-full`;
    const token = await this.authHandler.getToken();
    
    if (token === undefined) {
      throw new Error("User Not Authenticated");
    }

    if (!progressCallback) {
      progressCallback = (total, sent) =>
        console.log(`${sent}/${total} progress: ${(sent * 100) / total}%`);
    }

    const body = await this.makeCreatePostWithFilesBlob(createPostDetails, files);
    const contentLength = body.size;
    console.log({ createPostDetails, files, contentLength });

    const response = await fetchWithProgress(
      url,
      "PUT",
      {
        Authorization: `Bearer ${token}`,
        "content-type": "application/octet-stream",
      },
      body,
      (sent, total) => progressCallback!(total, sent),
      (recv, total) => {},
    );

    if (response.status === 200) {
      return FullPost.decode(response.body);
    } else {
      console.error(
        `${url} [${response.status}] ${new TextDecoder().decode(response.body)}`,
      );
      return undefined;
    }
  }

  async reportPost(id: Uint8Array, text: string): Promise<void> {
    const body = PostReport.encode(
      PostReport.create({ postId: id, description: text }),
    ).finish();
    const url = `${this.config.apiUrl}/report`;
    const token = await this.authHandler.getToken();
    
    if (token === undefined) {
      throw new Error("User Not Authenticated");
    }
    
    const response = await fetch(url, {
      method: "POST",
      headers: { Authorization: `Bearer ${token}` },
      body,
    });

    if (response.status === 200) {
      console.log(`Successfully submitted report`);
    } else {
      console.error(`${url} [${response.status}] ${await response.text()}`);
    }
  }

  async deletePost(id: Uint8Array): Promise<void> {
    const username = await this.authHandler.getUsername();
    const token = await this.authHandler.getToken();
    
    if (!username || !token) {
      throw new Error("User is not signed in");
    }

    const url = `${this.config.apiUrl}/post/${ulidStringify(id)}`;

    const response = await fetch(url, {
      method: "DELETE",
      headers: {
        Authorization: `Bearer ${token}`,
      },
    });

    console.log(
      `DELETE ${url} status: ${response.status} ${await response.text()}`,
    );
  }

  async getTrendingHashtags(): Promise<PostProtos.PostHashtags> {
    const url = `${this.config.apiUrl}/hashtags`;
    const response = await fetch(url);
    
    if (response.status !== 200) {
      throw new Error(
        `unexpected status code: ${response.status}, body: ${await response.text()}`,
      );
    }
    
    return PostProtos.PostHashtags.decode(
      new Uint8Array(await response.arrayBuffer()),
    );
  }

  async getNotifications(): Promise<Notifications> {
    const url = `${this.config.apiUrl}/notifications`;
    const response = await fetch(url, {
      headers: {
        authorization: `Bearer ${await this.authHandler.getToken()}`,
      },
    });

    if (response.status === 200) {
      return Notifications.decode(new Uint8Array(await response.arrayBuffer()));
    } else {
      throw new Error(
        `Received unexpected status: ${response.status} ${await response.text()}`,
      );
    }
  }
}

export class VotesRequestBatcher {
  private queuedVotes: Vote[] = [];
  private intervalId: number;
  private postService: PostService;

  constructor(postService: PostService) {
    this.postService = postService;
    this.intervalId = setInterval(() => {
      this.flushVotes();
    }, 10_000) as any as number;
  }

  queueVote(vote: Vote): void {
    for (let i = 0; i < this.queuedVotes.length; i++) {
      if (this.queuedVotes[i].id === vote.id) {
        this.queuedVotes[i] = vote;
        return;
      }
    }
    this.queuedVotes.push(vote);
  }

  flushVotes(): void {
    const votes = this.queuedVotes;
    if (votes.length === 0) return;
    
    this.queuedVotes = [];
    this.postService.putVotes(votes)
      .then(() =>
        console.log(
          `Flushed votes ${votes.map((e) => `${ulidStringify(e.id)}:${e.val}`)}`,
        ),
      )
      .catch((err) => {
        console.error(err);
        votes.forEach((vote) => this.queueVote(vote));
      });
  }

  destroy(): void {
    clearInterval(this.intervalId);
    this.flushVotes();
  }
}

// Factory function to create PostService with default auth handler
export function createPostService(config?: Partial<ApiConfig>): PostService {
  const defaultConfig: ApiConfig = {
    apiUrl: API_URL,
    apiCdnUrl: API_CDN_URL,
  };

  const finalConfig = { ...defaultConfig, ...config };

  const authHandler: AuthHandler = {
    getToken: () => getAuthHandler()?.getToken() ?? Promise.resolve(undefined),
    // Fixed: Ensure we return Promise<string | null> not Promise<string | undefined>
    getUsername: async () => {
      const handler = getAuthHandler();
      // Convert undefined to null to match the expected return type
      return handler ? await handler.getUsername() : null;
    }
  };

  return new PostService(authHandler, finalConfig);
}

// Adapter class to maintain backward compatibility
export class PostServiceAdapter {
  private static instance: PostService;

  static getInstance(): PostService {
    if (!PostServiceAdapter.instance) {
      PostServiceAdapter.instance = createPostService();
    }
    return PostServiceAdapter.instance;
  }

  // Legacy function exports for backward compatibility
  static getPost = (id: string) => PostServiceAdapter.getInstance().getPost(id);
  static getPosts = (details: GetPostsData) => PostServiceAdapter.getInstance().getPosts(details);
  static putVote = (vote: Vote) => PostServiceAdapter.getInstance().putVote(vote);
  static putVotes = (votes: Vote[]) => PostServiceAdapter.getInstance().putVotes(votes);
  static createPost = (details: CreatePostDetails) => PostServiceAdapter.getInstance().createPost(details);
  static createPostWithFiles = (
    details: CreatePostWithFiles,
    files: string[],
    progressCallback?: (totalBytes: number, bytesSent: number) => void,
  ) => PostServiceAdapter.getInstance().createPostWithFiles(details, files, progressCallback);
  static reportPost = (id: Uint8Array, text: string) => PostServiceAdapter.getInstance().reportPost(id, text);
  static deletePost = (id: Uint8Array) => PostServiceAdapter.getInstance().deletePost(id);
  static getTrendingHashtags = () => PostServiceAdapter.getInstance().getTrendingHashtags();
  static getNotifications = () => PostServiceAdapter.getInstance().getNotifications();
}

// Export legacy functions for backward compatibility
export const getPost = PostServiceAdapter.getPost;
export const getPosts = PostServiceAdapter.getPosts;
export const putVote = PostServiceAdapter.putVote;
export const putVotes = PostServiceAdapter.putVotes;
export const createPost = PostServiceAdapter.createPost;
export const createPostWithFiles = PostServiceAdapter.createPostWithFiles;
export const reportPost = PostServiceAdapter.reportPost;
export const deletePost = PostServiceAdapter.deletePost;
export const getTrendingHashtags = PostServiceAdapter.getTrendingHashtags;
export const getNotifications = PostServiceAdapter.getNotifications;
