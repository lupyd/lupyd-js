import { UserProtos } from "..";
import { getAuthHandler } from "../auth/auth";
import { isValidUsername } from "../bin/utils";
import { UpdateUserInfo, User, Users } from "../protos/user";
import { API_CDN_URL, API_URL } from "./../constants";

export const getUsers = async (username: string) => {
  const users: User[] = [];
  if (username.length <= 1) {
    console.error(new Error("Invalid Username"));
    return users;
  }

  const token = await getAuthHandler()?.getToken();
  const response = await fetch(`${API_URL}/user/${username}*`, {
    headers: token !== null ? { Authorization: `Bearer ${token}` } : undefined,
  });
  if (response.status === 200) {
    const body = await response.arrayBuffer();
    return Users.decode(new Uint8Array(body)).users;
  }

  return users;
};

export const getUser = async (username: string) => {
  if (!isValidUsername(username)) {
    console.error(new Error("Invalid Username"));
  }

  const token = await getAuthHandler()?.getToken();
  const response = await fetch(`${API_URL}/user/${username}`, {
    headers: token !== null ? { Authorization: `Bearer ${token}` } : undefined,
  });
  if (response.status === 200) {
    const body = await response.arrayBuffer();
    return User.decode(new Uint8Array(body));
  }
};

export const getUsersByUsername = async (usernames: string[]) => {
  const users: User[] = [];
  if (usernames.some((e) => !isValidUsername(e))) {
    console.error(new Error("Invalid Username"));
    return users;
  }

  const token = await getAuthHandler()?.getToken();
  const response = await fetch(
    `${API_URL}/user?users=${encodeURIComponent(usernames.join(","))}`,
    {
      headers:
        token !== null ? { Authorization: `Bearer ${token}` } : undefined,
    },
  );
  if (response.status === 200) {
    const body = await response.arrayBuffer();
    return Users.decode(new Uint8Array(body)).users;
  }

  return users;
};

export const updateUser = async (info: UpdateUserInfo) => {
  const token = await getAuthHandler()?.getToken();
  if (!token) {
    throw new Error(`User is not fully signed in`);
  }

  const response = await fetch(`${API_URL}/user`, {
    method: "PUT",
    body: UpdateUserInfo.encode(info).finish(),
    headers: {
      "content-type": "application/protobuf; proto=lupyd.user.UpdateUserInfo",
      authorization: `Bearer ${token}`,
    },
  });

  if (response.status !== 200) {
    console.error(
      `Failed to update user ${response.status} ${await response.text()}`,
    );
  }
};

export const updateUserProfilePicture = async (blob: Blob) => {
  const token = await getAuthHandler()?.getToken();

  if (!token) {
    throw new Error(`User is not fully signed in`);
  }

  const response = await fetch(`${API_CDN_URL}/user`, {
    method: "PUT",
    body: blob,
    headers: {
      authorization: `Bearer ${token}`,
    },
  });
  if (response.status !== 200) {
    console.error(
      `Failed to update user profile ${response.status} ${await response.text()}`,
    );
  }
};

export const deleteUserProfilePicture = async () => {
  const token = await getAuthHandler()?.getToken();

  if (!token) {
    throw new Error(`User is not fully signed in`);
  }

  const response = await fetch(`${API_CDN_URL}/user`, {
    method: "DELETE",
    headers: {
      authorization: `Bearer ${token}`,
    },
  });
  if (response.status !== 200) {
    console.error(
      `Failed to update user profile ${response.status} ${await response.text()}`,
    );
  }
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

  onUpdate: (followedUsers: string[], blockedUsers: string[]) => void;

  constructor(onUpdate: (followed: string[], blocked: string[]) => {}) {
    this.onUpdate = onUpdate;
    this.followedUsers = new Set();
    this.blockedUsers = new Set();
  }

  async refresh() {
    const relations = await getUserRelations();
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
    await updateUserRelation(username, Relation.block);

    this.followedUsers.delete(username);
    this.blockedUsers.add(username);

    this.callUpdate();
  }

  async unblockUser(username: string) {
    await updateUserRelation(username, Relation.unblock);

    this.blockedUsers.delete(username);
    this.callUpdate();
  }

  async followUser(username: string) {
    await updateUserRelation(username, Relation.follow);

    this.followedUsers.add(username);
    this.blockedUsers.delete(username);
    this.callUpdate();
  }

  async unfollowUser(username: string) {
    await updateUserRelation(username, Relation.unblock);

    this.followedUsers.delete(username);
    this.callUpdate();
  }
}

export async function getUserRelations() {
  const token = await getAuthHandler()?.getToken();
  const response = await fetch(`${API_URL}/relations`, {
    headers: {
      authorization: `Bearer ${token}`,
    },
  });

  if (response.status != 200) {
    throw new Error(
      `received invalid status ${response.status}, text: ${await response.text()}`,
    );
  }

  return UserProtos.Relations.decode(
    new Uint8Array(await response.arrayBuffer()),
  );
}

export async function updateUserRelation(username: string, relation: Relation) {
  const token = await getAuthHandler()?.getToken();

  const response = await fetch(
    `${API_URL}/relation?user=${username}&relation=${relationToString(relation)}`,
    {
      method: "PUT",
      headers: { authorization: `Bearer ${token}` },
    },
  );

  if (response.status !== 200) {
    throw new Error(await response.text());
  }
}
