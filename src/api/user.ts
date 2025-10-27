import { UserProtos } from "..";
import { isValidUsername } from "../bin/utils";
import { throwStatusError } from "../error";
import { UpdateUserInfo, User, Users } from "../protos/user";
import { usernameExistsInToken } from "./api";

export const getUsers = async (
  apiUrl: string,
  username: string,
  token?: string,
) => {
  const users: User[] = [];
  if (username.length <= 1) {
    console.error(new Error("Invalid Username"));
    return users;
  }

  const response = await fetch(`${apiUrl}/user/${username}*`, {
    headers: token ? { Authorization: `Bearer ${token}` } : undefined,
  });
  if (response.status === 200) {
    const body = await response.arrayBuffer();
    return Users.decode(new Uint8Array(body)).users;
  }

  throwStatusError(response.status, await response.text());
};

export const getUser = async (
  apiUrl: string,
  username: string,
  token?: string,
) => {
  if (!isValidUsername(username)) {
    console.error(new Error("Invalid Username"));
  }

  const response = await fetch(`${apiUrl}/user/${username}`, {
    headers: token ? { Authorization: `Bearer ${token}` } : undefined,
  });
  if (response.status === 200) {
    const body = await response.arrayBuffer();
    return User.decode(new Uint8Array(body));
  }

  throwStatusError(response.status, await response.text());
};

export const getUsersByUsername = async (
  apiUrl: string,
  usernames: string[],
  token?: string,
) => {
  const users: User[] = [];
  if (usernames.some((e) => !isValidUsername(e))) {
    console.error(new Error("Invalid Username"));
    return users;
  }

  const response = await fetch(
    `${apiUrl}/user?users=${encodeURIComponent(usernames.join(","))}`,
    {
      headers: token ? { Authorization: `Bearer ${token}` } : undefined,
    },
  );
  if (response.status === 200) {
    const body = await response.arrayBuffer();
    return Users.decode(new Uint8Array(body)).users;
  }
  throwStatusError(response.status, await response.text());
};

export const updateUser = async (
  apiUrl: string,
  info: UpdateUserInfo,
  token?: string,
) => {
  if (!token || !usernameExistsInToken(token)) {
    throw new Error(`User is not fully signed in`);
  }

  const response = await fetch(`${apiUrl}/user`, {
    method: "PUT",
    body: new Uint8Array(UpdateUserInfo.encode(info).finish()),
    headers: {
      "content-type": "application/protobuf; proto=lupyd.user.UpdateUserInfo",
      authorization: `Bearer ${token}`,
    },
  });

  if (response.status === 200) {
    return;
  }
  throwStatusError(response.status, await response.text());
};

export const updateUserProfilePicture = async (
  apiCdnUrl: string,
  blob: Blob,
  token?: string,
) => {
  if (!token || !usernameExistsInToken(token)) {
    throw new Error(`User is not fully signed in`);
  }

  const response = await fetch(`${apiCdnUrl}/user`, {
    method: "PUT",
    body: blob,
    headers: {
      authorization: `Bearer ${token}`,
    },
  });
  if (response.status === 200) {
    return;
  }
  throwStatusError(response.status, await response.text());
};

export const deleteUserProfilePicture = async (
  apiCdnUrl: string,
  token?: string,
) => {
  if (!token || !usernameExistsInToken(token)) {
    throw new Error(`User is not fully signed in`);
  }

  const response = await fetch(`${apiCdnUrl}/user`, {
    method: "DELETE",
    headers: {
      authorization: `Bearer ${token}`,
    },
  });
  if (response.status === 200) {
    return;
  }
  throwStatusError(response.status, await response.text());
};

enum Relation {
  follow,
  unfollow,
  block,
  unblock,
}

export const relationToString = (r: Relation) => {
  switch (r) {
    case Relation.follow:
      return "follow";
    case Relation.unfollow:
      return "unfollow";
    case Relation.block:
      return "block";
    case Relation.unblock:
      return "unblock";
  }
};

export class UserRelationsState {
  private followedUsers: Set<string>;
  private blockedUsers: Set<string>;
  private readonly apiUrl: string;
  getToken: () => Promise<string>;
  onUpdate: (followedUsers: string[], blockedUsers: string[]) => void;

  constructor(
    onUpdate: (followed: string[], blocked: string[]) => void,
    apiUrl: string,
    getToken: () => Promise<string>,
  ) {
    this.onUpdate = onUpdate;
    this.followedUsers = new Set();
    this.blockedUsers = new Set();
    this.apiUrl = apiUrl;
    this.getToken = getToken;
  }

  async refresh() {
    const relations = await getUserRelations(
      this.apiUrl,
      await this.getToken(),
    );
    this.fromRelations(relations);
    this.callUpdate();
  }

  private fromRelations(relations: UserProtos.Relations) {
    this.followedUsers.clear();
    this.blockedUsers.clear();

    for (const relation of relations.relations) {
      if (relation.relation) {
        this.followedUsers.add(relation.uname);
      } else {
        this.blockedUsers.add(relation.uname);
      }
    }
  }

  private callUpdate() {
    this.onUpdate([...this.followedUsers], [...this.blockedUsers]);
  }

  async blockUser(username: string) {
    await updateUserRelation(
      this.apiUrl,
      username,
      Relation.block,
      await this.getToken(),
    );

    this.followedUsers.delete(username);
    this.blockedUsers.add(username);

    this.callUpdate();
  }

  async unblockUser(username: string) {
    await updateUserRelation(
      this.apiUrl,
      username,
      Relation.unblock,
      await this.getToken(),
    );

    this.blockedUsers.delete(username);
    this.callUpdate();
  }

  async followUser(username: string) {
    await updateUserRelation(
      this.apiUrl,
      username,
      Relation.follow,
      await this.getToken(),
    );

    this.followedUsers.add(username);
    this.blockedUsers.delete(username);
    this.callUpdate();
  }

  async unfollowUser(username: string) {
    await updateUserRelation(
      this.apiUrl,
      username,
      Relation.unblock,
      await this.getToken(),
    );

    this.followedUsers.delete(username);
    this.callUpdate();
  }
}

export async function getUserRelations(apiUrl: string, token?: string) {
  if (!token || !usernameExistsInToken(token)) {
    throw new Error("User haven't completed their sign in setup");
  }

  const response = await fetch(`${apiUrl}/relations`, {
    headers: {
      authorization: `Bearer ${token}`,
    },
  });

  if (response.status == 200) {
    return UserProtos.Relations.decode(
      new Uint8Array(await response.arrayBuffer()),
    );
  }

  throwStatusError(response.status, await response.text());
}

export async function updateUserRelation(
  apiUrl: string,
  username: string,
  relation: Relation,
  token: string,
) {
  if (!token || !usernameExistsInToken(token)) {
    throw new Error("User haven't completed their sign in setup");
  }

  const response = await fetch(
    `${apiUrl}/relation?uname=${username}&relation=${relationToString(relation)}`,
    {
      method: "PUT",
      headers: { authorization: `Bearer ${token}` },
    },
  );

  if (response.status !== 200) {
    return;
  }

  throwStatusError(response.status, await response.text());
}
