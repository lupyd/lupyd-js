import { isValidUsername } from "../bin/utils";
import { AuthHandler } from "../firebase/auth";
import van from "vanjs-core";
import { fbElement, LupydFirebaseElement } from "../firebase/element";
import { FIRESTORE_BASE_URL } from "../constants";

const DEFAULT_DISAPPEARING_MESSAGES = 60 * 24 * 7; // minutes

export interface UserData {
  follows: string[];
  dissappearingMessages: number;
}

let localUserFollows = van.state([] as Array<string>);
let localDissappearingMessages = van.state(DEFAULT_DISAPPEARING_MESSAGES); // minutes

export const getFollowedUsersState = () => localUserFollows;
export const getDissaperaingMessagesState = () => localDissappearingMessages;

export const getUserData = async () => {
  const username = await AuthHandler.getUsername();
  if (!username) {
    throw new Error("User is not authenticated");
  }

  const userData = await fetchUserDoc();
  if (userData) {
    localUserFollows.val = [...userData.follows];
  }

  return userData;
};

export const followUsers = async (users: Array<string>) => {
  const data = await updateUserDocFollows(users, false);
  if (data) {
    localUserFollows.val = [...data.follows];
  }
};

export const unfollowUsers = async (users: Array<string>) => {
  const data = await updateUserDocFollows(users, true);
  if (data) {
    localUserFollows.val = [...data.follows];
  }
};

export async function fetchUserDoc() {
  const username = await AuthHandler.getUsername();
  const token = await AuthHandler.getToken();
  const projectId = fbElement()!.app.options.projectId;
  if (!username || !token || !projectId) {
    return undefined;
  }

  const url = `${FIRESTORE_BASE_URL}/projects/${projectId}/databases/(default)/documents/users/${username}`;

  const response = await fetch(url);
  if (response.status !== 200) {
    console.error(
      `Failed to fetch document ${response.status} ${await response.text()}`,
    );
    return;
  }

  return parseUserData(await response.json());
}

export async function updateUserDocFollows(
  usersAffected: Array<string>,
  removeThem: boolean,
) {
  if (usersAffected.length === 0) {
    return;
  }
  const username = await AuthHandler.getUsername();
  const token = await AuthHandler.getToken();
  const projectId = fbElement()!.app.options.projectId;
  if (!username || !token || !projectId) {
    return undefined;
  }

  const resource = `projects/${projectId}/databases/(default)/documents/users/${username}`;

  const userFields = {} as any;

  const url = new URL(`${FIRESTORE_BASE_URL}/${resource}`);
  url.searchParams.append("mask.fieldPaths", "follows");
  for (const user of usersAffected) {
    userFields[user] = {
      nullValue: null,
    };
    url.searchParams.append("updateMask.fieldPaths", `follows.${user}`);
  }

  const body = {
    name: resource,
    fields: {
      follows: {
        mapValue: {
          fields: removeThem ? {} : userFields,
        },
      },
    },
  };

  const response = await fetch(url.toString(), {
    method: "PATCH",
    body: JSON.stringify(body),
    headers: {
      authorization: `Bearer ${token}`,
    },
  });

  if (response.status != 200) {
    console.error(
      `Failed to fetch document ${response.status} ${await response.text()}`,
    );
    return;
  }

  return parseUserData(await response.json());
}

function parseUserData(doc: any) {
  const followingUsers = [] as string[];
  const fields = doc["fields"];
  let dissappearingMessagesDuration = DEFAULT_DISAPPEARING_MESSAGES; // minutes
  if (fields) {
    const dissappearingMessages = fields["dissappearingMessages"];
    if (dissappearingMessages) {
      const numberValue = dissappearingMessages["numberValue"];
      if (numberValue) {
        dissappearingMessagesDuration = Number(numberValue);
      }
    }

    const follows = fields["follows"];
    if (follows) {
      const mapValue = follows["mapValue"];
      if (mapValue) {
        const fields = mapValue["fields"];
        if (fields) {
          for (const key in fields) {
            if (isValidUsername(key)) {
              followingUsers.push(key);
            }
          }
        }
      }
    }
  }

  return {
    follows: followingUsers,
    dissapearingMessages: dissappearingMessagesDuration,
  };
}
