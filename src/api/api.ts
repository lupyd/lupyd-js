import { CreatePostDetails, CreatePostWithFiles, Vote } from "../protos/post";
import { UpdateUserInfo } from "../protos/user";
import {
  createPost,
  createPostWithFiles,
  deletePost,
  getNotifications,
  getPost,
  getPosts,
  GetPostsData,
  getTrendingHashtags,
  putVotes,
  reportPost,
} from "./post";
import {
  deleteUserProfilePicture,
  getUser,
  getUsers,
  getUsersByUsername,
  updateUser,
  updateUserProfilePicture,
} from "./user";

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

export function usernameExistsInToken(token: string) {
  try {
    const decodedToken = getPayloadFromAccessToken(token);
    return "uname" in decodedToken && typeof decodedToken.uname == "string";
  } catch (err) {
    console.error(err);
    return false;
  }
}

export function getPayloadFromAccessToken(token: string): DecodedToken {
  const [_header, payload, _signature] = token.split(".");
  return JSON.parse(atob(payload)) as DecodedToken;
}

async function undefinedOnfail<T>(p: Promise<T>): Promise<T | undefined> {
  try {
    const val = await p;
    return val;
  } catch (err) {
    return undefined;
  }
}

export class ApiService {
  private getToken: () => Promise<string> = () => {
    throw new Error("getToken is not given");
  };

  private readonly baseUrl: string;
  private readonly apiCdnUrl: string;

  constructor(
    baseUrl: string,
    apiCdnUrl: string,
    getToken: () => Promise<string>,
  ) {
    this.baseUrl = baseUrl;
    this.getToken = getToken;
    this.apiCdnUrl = apiCdnUrl;
  }
  async getPost(id: string) {
    return getPost(this.baseUrl, id, await undefinedOnfail(this.getToken()));
  }
  async getPosts(getPostDetails: GetPostsData) {
    return getPosts(
      this.baseUrl,
      getPostDetails,
      await undefinedOnfail(this.getToken()),
    );
  }
  putVote(vote: Vote) {
    return this.putVotes([vote]);
  }
  async putVotes(votes: Vote[]) {
    const token = await this.getToken();
    return putVotes(this.baseUrl, votes, token);
  }
  async createPost(createPostDetails: CreatePostDetails) {
    const token = await this.getToken();
    return createPost(this.baseUrl, createPostDetails, token);
  }
  async createPostWithFiles(
    createPostDetails: CreatePostWithFiles,
    files: string[],
    progressCallback?: (totalBytes: number, bytesSent: number) => void,
  ) {
    const token = await this.getToken();
    return createPostWithFiles(
      this.apiCdnUrl,
      createPostDetails,
      files,
      progressCallback,
      token,
    );
  }
  async reportPost(id: Uint8Array, text: string) {
    const token = await this.getToken();
    return reportPost(this.baseUrl, id, text, token);
  }
  async deletePost(id: Uint8Array) {
    const token = await this.getToken();
    return deletePost(this.baseUrl, id, token);
  }
  async getTrendingHashtags() {
    return getTrendingHashtags(this.baseUrl);
  }
  async getNotifications() {
    getNotifications(this.baseUrl, await this.getToken());
  }

  async getUsers(username: string) {
    return getUsers(
      this.baseUrl,
      username,
      await undefinedOnfail(this.getToken()),
    );
  }
  async getUser(username: string) {
    return getUser(
      this.baseUrl,
      username,
      await undefinedOnfail(this.getToken()),
    );
  }
  async getUsersByUsername(usernames: string[]) {
    return getUsersByUsername(
      this.baseUrl,
      usernames,
      await undefinedOnfail(this.getToken()),
    );
  }
  async updateUser(info: UpdateUserInfo) {
    return updateUser(this.baseUrl, info, await this.getToken());
  }
  async updateUserProfilePicture(blob: Blob) {
    return updateUserProfilePicture(
      this.apiCdnUrl,
      blob,
      await this.getToken(),
    );
  }
  async deleteUserProfilePicture() {
    return deleteUserProfilePicture(this.apiCdnUrl, await this.getToken());
  }
}
