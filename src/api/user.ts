import { isValidUsername } from "../bin/utils";
import { AuthHandler } from "../firebase/auth";
import { UpdateUserInfo, User, Users } from "../protos/user";
import { API_CDN_URL, API_URL } from "./../constants";

export const getUsers = async (username: string) => {
  const users: User[] = [];
  if (!isValidUsername(username)) {
    console.error(new Error("Invalid Username"));
    return users;
  }

  const token = await AuthHandler.getToken();
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

  const token = await AuthHandler.getToken();
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

  const token = await AuthHandler.getToken();
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
  const token = await AuthHandler.getToken();
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
  const token = await AuthHandler.getToken();

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
  const token = await AuthHandler.getToken();

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
