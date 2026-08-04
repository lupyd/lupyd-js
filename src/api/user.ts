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

export enum Relation {
  follow,
  unfollow,
  block,
  unblock,
  accept,
  unaccept,
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
    case Relation.accept:
      return "accept";
    case Relation.unaccept:
      return "unaccept";
  }
};

export const RELATION_FLAGS = {
  FOLLOWS: 1,
  BLOCKED: 2,
  ACCEPTED: 4,
} as const;

export class UserRelationsState {
  private followedUsers: Set<string>;
  private blockedUsers: Set<string>;
  private acceptedUsers: Set<string>;
  private userStates: Map<string, number>;
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
    this.acceptedUsers = new Set();
    this.userStates = new Map();
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
    this.acceptedUsers.clear();
    this.userStates.clear();

    for (const relation of relations.relations) {
      let relVal: number;
      if (typeof relation.relation === "boolean") {
        relVal = relation.relation ? RELATION_FLAGS.FOLLOWS : RELATION_FLAGS.BLOCKED;
      } else {
        relVal = Number(relation.relation);
      }

      this.userStates.set(relation.uname, relVal);

      if ((relVal & RELATION_FLAGS.FOLLOWS) !== 0) {
        this.followedUsers.add(relation.uname);
      }
      if ((relVal & RELATION_FLAGS.BLOCKED) !== 0) {
        this.blockedUsers.add(relation.uname);
      }
      if ((relVal & RELATION_FLAGS.ACCEPTED) !== 0) {
        this.acceptedUsers.add(relation.uname);
      }
    }
  }

  private callUpdate() {
    this.onUpdate([...this.followedUsers], [...this.blockedUsers]);
  }

  getAllStates() {
    return {
      followed: [...this.followedUsers],
      blocked: [...this.blockedUsers],
      accepted: [...this.acceptedUsers],
      followedUsers: [...this.followedUsers],
      blockedUsers: [...this.blockedUsers],
      acceptedUsers: [...this.acceptedUsers],
      userStates: new Map(this.userStates),
    };
  }

  getAcceptedUsers(): string[] {
    return [...this.acceptedUsers];
  }

  getUserState(username: string): number {
    return this.userStates.get(username) ?? 0;
  }

  async blockUser(username: string) {
    await updateUserRelation(
      this.apiUrl,
      username,
      Relation.block,
      await this.getToken(),
    );

    const current = this.userStates.get(username) ?? 0;
    const updated = current | RELATION_FLAGS.BLOCKED;
    this.userStates.set(username, updated);
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

    const current = this.userStates.get(username) ?? 0;
    const updated = current & ~RELATION_FLAGS.BLOCKED;
    if (updated === 0) {
      this.userStates.delete(username);
    } else {
      this.userStates.set(username, updated);
    }
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

    const current = this.userStates.get(username) ?? 0;
    const updated = current | RELATION_FLAGS.FOLLOWS;
    this.userStates.set(username, updated);
    this.followedUsers.add(username);
    this.callUpdate();
  }

  async unfollowUser(username: string) {
    await updateUserRelation(
      this.apiUrl,
      username,
      Relation.unfollow,
      await this.getToken(),
    );

    const current = this.userStates.get(username) ?? 0;
    const updated = current & ~RELATION_FLAGS.FOLLOWS;
    if (updated === 0) {
      this.userStates.delete(username);
    } else {
      this.userStates.set(username, updated);
    }
    this.followedUsers.delete(username);
    this.callUpdate();
  }

  async acceptUser(username: string) {
    await updateUserRelation(
      this.apiUrl,
      username,
      Relation.accept,
      await this.getToken(),
    );

    const current = this.userStates.get(username) ?? 0;
    const updated = current | RELATION_FLAGS.ACCEPTED;
    this.userStates.set(username, updated);
    this.acceptedUsers.add(username);
    this.callUpdate();
  }

  async unacceptUser(username: string) {
    await updateUserRelation(
      this.apiUrl,
      username,
      Relation.unaccept,
      await this.getToken(),
    );

    const current = this.userStates.get(username) ?? 0;
    const updated = current & ~RELATION_FLAGS.ACCEPTED;
    if (updated === 0) {
      this.userStates.delete(username);
    } else {
      this.userStates.set(username, updated);
    }
    this.acceptedUsers.delete(username);
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

  if (response.status == 200) {
    return;
  }

  throwStatusError(response.status, await response.text());
}
