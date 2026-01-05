import { isValidUsername } from "../bin/utils";
import { throwStatusError } from "../error";
import { CreatePostDetails, CreatePostWithFiles, Vote } from "../protos/post";
import { FullUser, UpdateUserInfo } from "../protos/user";
import {
  createPost,
  createPostWithFiles,
  deletePost,
  getNotifications,
  getPost,
  getPosts,
  GetPostsData,
  getSavedPosts,
  getTrendingHashtags,
  putVotes,
  reportPost,
  savePost,
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

  private readonly apiUrl: string;
  private readonly apiCdnUrl: string;

  constructor(
    apiUrl: string,
    apiCdnUrl: string,
    getToken: () => Promise<string>,
  ) {
    this.apiUrl = apiUrl;
    this.getToken = getToken;
    this.apiCdnUrl = apiCdnUrl;
  }
  async getPost(id: string) {
    return getPost(this.apiUrl, id, await undefinedOnfail(this.getToken()));
  }
  async getPosts(getPostDetails: GetPostsData) {
    return getPosts(
      this.apiUrl,
      getPostDetails,
      await undefinedOnfail(this.getToken()),
    );
  }
  putVote(vote: Vote) {
    return this.putVotes([vote]);
  }
  async putVotes(votes: Vote[]) {
    const token = await this.getToken();
    return putVotes(this.apiUrl, votes, token);
  }
  async createPost(createPostDetails: CreatePostDetails) {
    const token = await this.getToken();
    return createPost(this.apiUrl, createPostDetails, token);
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
    return reportPost(this.apiUrl, id, text, token);
  }
  async deletePost(id: Uint8Array) {
    const token = await this.getToken();
    return deletePost(this.apiUrl, id, token);
  }
  async getTrendingHashtags() {
    return getTrendingHashtags(this.apiUrl);
  }
  async getNotifications() {
    return getNotifications(this.apiUrl, await this.getToken());
  }

  async getUsers(username: string) {
    return getUsers(
      this.apiUrl,
      username,
      await undefinedOnfail(this.getToken()),
    );
  }
  async getUser(username: string) {
    return getUser(
      this.apiUrl,
      username,
      await undefinedOnfail(this.getToken()),
    );
  }
  async getUsersByUsername(usernames: string[]) {
    return getUsersByUsername(
      this.apiUrl,
      usernames,
      await undefinedOnfail(this.getToken()),
    );
  }
  async updateUser(info: UpdateUserInfo) {
    return updateUser(this.apiUrl, info, await this.getToken());
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

  async deleteUser() {
    const token = await this.getToken();

    if (!usernameExistsInToken(token)) {
      throw Error("User is not signed in full");
    }

    const response = await fetch(`${this.apiUrl}/user`, {
      method: "DELETE",
      headers: {
        authorization: `Bearer ${token}`,
      },
    });

    if (response.status == 200) {
      return;
    }

    throwStatusError(response.status, await response.text());
  }

  async assignUsername(username: string, bio: Uint8Array, settings: number) {
    if (!isValidUsername(username)) {
      throw new Error("Not a valid username");
    }

    const token = await this.getToken();

    if (usernameExistsInToken(token)) {
      throw Error("Username already assigned");
    }

    const response = await fetch(`${this.apiUrl}/user`, {
      method: "POST",
      headers: {
        authorization: `Bearer ${await this.getToken()}`,
      },
      body: new Uint8Array(
        FullUser.encode(
          FullUser.create({ uname: username, settings, bio }),
        ).finish(),
      ),
    });

    if (response.status == 200 || response.status == 201) {
      return;
    }

    throwStatusError(response.status, await response.text());
  }

  async uploadFile(
    filename: string,
    mimeType: string,
    blob: BodyInit,
    contentLength: number | undefined = undefined,
  ) {
    const token = await this.getToken();
    if (!usernameExistsInToken(token)) {
      throw Error(`User is not authenticated`);
    }

    const headers: Record<string, string> = {
      "content-type": mimeType,
      authorization: `Bearer ${token}`,
    };

    if (contentLength) {
      headers["content-length"] = contentLength.toString();
    }

    const response = await fetch(
      `${this.apiCdnUrl}/file/${encodeURIComponent(filename)}`,
      {
        method: "PUT",
        headers: headers,
        body: blob,
        //@ts-ignore
        duplex: "half",
      },
    );

    if (response.ok) {
      const key = await response.text();
      return key;
    }

    throwStatusError(response.status, await response.text());
  }

  async savePost(postId: string) {
    return savePost(this.apiUrl, await this.getToken(), postId);
  }

  async getSavedPosts() {
    return getSavedPosts(this.apiUrl, await this.getToken());
  }
}
