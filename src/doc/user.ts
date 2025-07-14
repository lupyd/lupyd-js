const DEFAULT_DISAPPEARING_MESSAGES = 60 * 24 * 7; // minutes

// export interface UserData {
//   follows: string[];
//   savedPosts: string[];
//   dissappearingMessages: number;
// }

// // let localUserFollows = van.state([] as Array<string>);
// // let localDissappearingMessages = van.state(DEFAULT_DISAPPEARING_MESSAGES); // minutes

// export class UsersFollowState {
//   localUserFollows: Array<string> = [];
//   localUserSavedPosts: Array<string> = [];

//   onChange = (_: UsersFollowState) => {};

//   constructor(callback: (state: UsersFollowState) => void = (_) => {}) {
//     this.onChange = callback;
//   }

//   setOnChangeCallback(callback: (state: UsersFollowState) => void) {
//     this.onChange = callback;
//   }

//   async followUser(username: string) {
//     if (this.doesFollowUser(username)) return;
//     const data = await updateUserDocFollows([username], false);
//     this.localUserFollows = data.follows;
//     this.onChange(this);
//   }

//   async unfollowUser(username: string) {
//     if (!this.doesFollowUser(username)) return;
//     const data = await updateUserDocFollows([username], true);
//     this.localUserFollows = data.follows;
//     this.onChange(this);
//   }

//   async savePost(postId: string) {
//     if (this.isSavedPost(postId)) return;
//     const data = await updateUserDocSavedPosts([postId], false);
//     this.localUserSavedPosts = data.savedPosts;
//     this.onChange(this);
//   }

//   async unsavePost(postId: string) {
//     if (!this.isSavedPost(postId)) return;
//     const data = await updateUserDocSavedPosts([postId], true);
//     this.localUserSavedPosts = data.savedPosts;
//     this.onChange(this);
//   }

//   doesFollowUser(username: string) {
//     return this.localUserFollows.includes(username);
//   }

//   isSavedPost(postId: string) {
//     return this.localUserSavedPosts.includes(postId);
//   }
// }

// let _state: UsersFollowState | undefined = undefined;

// export const getFollowedUsersState = () => {
//   if (typeof window === "undefined") return undefined;

//   if (!_state) _state = new UsersFollowState();

//   window["_userFollowedState"] = _state;

//   return _state;
// };

// export const getUserData = async () => {
//   const username = await AuthHandler.getUsername();
//   if (!username) {
//     throw new Error("User is not authenticated");
//   }
//   const userData = await fetchUserDoc();
//   return userData;
// };

// export async function fetchUserDoc() {
//   const username = await AuthHandler.getUsername();
//   const token = await AuthHandler.getToken();
//   const projectId = fbElement()!.app.options.projectId;
//   if (!username || !token || !projectId) {
//     return undefined;
//   }

//   const url = `${FIRESTORE_BASE_URL}/projects/${projectId}/databases/(default)/documents/users/${username}`;

//   const response = await fetch(url);
//   if (response.status !== 200) {
//     console.error(
//       `Failed to fetch document ${response.status} ${await response.text()}`,
//     );
//     return;
//   }

//   return parseUserData(await response.json());
// }

// export async function updateUserDocFollows(
//   usersAffected: Array<string>,
//   removeThem: boolean,
// ) {
//   if (usersAffected.length === 0) {
//     return;
//   }
//   const username = await AuthHandler.getUsername();
//   const token = await AuthHandler.getToken();
//   const projectId = fbElement()!.app.options.projectId;
//   if (!username || !token || !projectId) {
//     return undefined;
//   }

//   const resource = `projects/${projectId}/databases/(default)/documents/users/${username}`;

//   const userFields = {} as any;

//   const url = new URL(`${FIRESTORE_BASE_URL}/${resource}`);
//   url.searchParams.append("mask.fieldPaths", "follows");
//   for (const user of usersAffected) {
//     userFields[user] = {
//       nullValue: null,
//     };
//     url.searchParams.append("updateMask.fieldPaths", `follows.${user}`);
//   }

//   const body = {
//     name: resource,
//     fields: {
//       follows: {
//         mapValue: {
//           fields: removeThem ? {} : userFields,
//         },
//       },
//     },
//   };

//   const response = await fetch(url.toString(), {
//     method: "PATCH",
//     body: JSON.stringify(body),
//     headers: {
//       authorization: `Bearer ${token}`,
//     },
//   });

//   if (response.status != 200) {
//     console.error(
//       `Failed to fetch document ${response.status} ${await response.text()}`,
//     );
//     return;
//   }

//   return parseUserData(await response.json());
// }
// export async function updateUserDocSavedPosts(
//   postsAffected: Array<string>,
//   removeThem: boolean,
// ) {
//   if (postsAffected.length === 0) {
//     return;
//   }
//   const username = await AuthHandler.getUsername();
//   const token = await AuthHandler.getToken();
//   const projectId = fbElement()!.app.options.projectId;
//   if (!username || !token || !projectId) {
//     return undefined;
//   }

//   const resource = `projects/${projectId}/databases/(default)/documents/users/${username}`;

//   const postsFields = {} as any;

//   const url = new URL(`${FIRESTORE_BASE_URL}/${resource}`);
//   url.searchParams.append("mask.fieldPaths", "follows");
//   for (const postId of postsAffected) {
//     if (!Ulid.isCanonical(postId)) {
//       throw new Error("Invalid post id");
//     }

//     postsFields[postId] = {
//       nullValue: null,
//     };
//     url.searchParams.append("updateMask.fieldPaths", `saved.${postId}`);
//   }

//   const body = {
//     name: resource,
//     fields: {
//       saved: {
//         mapValue: {
//           fields: removeThem ? {} : postsFields,
//         },
//       },
//     },
//   };

//   const response = await fetch(url.toString(), {
//     method: "PATCH",
//     body: JSON.stringify(body),
//     headers: {
//       authorization: `Bearer ${token}`,
//     },
//   });

//   if (response.status != 200) {
//     console.error(
//       `Failed to fetch document ${response.status} ${await response.text()}`,
//     );
//     return;
//   }

//   return parseUserData(await response.json());
// }

// function parseUserData(doc: any) {
//   const followingUsers: string[] = [];
//   const savedPosts: string[] = [];
//   const fields = doc["fields"];
//   let dissappearingMessagesDuration = DEFAULT_DISAPPEARING_MESSAGES; // minutes
//   if (fields) {
//     const dissappearingMessages = fields["dissappearingMessages"];
//     if (dissappearingMessages) {
//       const numberValue = dissappearingMessages["numberValue"];
//       if (numberValue) {
//         dissappearingMessagesDuration = Number(numberValue);
//       }
//     }

//     const follows = fields["follows"];
//     if (follows) {
//       const mapValue = follows["mapValue"];
//       if (mapValue) {
//         const fields = mapValue["fields"];
//         if (fields) {
//           for (const key in fields) {
//             if (isValidUsername(key)) {
//               followingUsers.push(key);
//             }
//           }
//         }
//       }
//     }

//     const saved = fields["saved"];
//     if (saved) {
//       const mapValue = saved["mapValue"];
//       if (mapValue) {
//         const fields = mapValue["fields"];
//         if (fields) {
//           for (const key in fields) {
//             if (Ulid.isCanonical(key)) {
//               savedPosts.push(key);
//             }
//           }
//         }
//       }
//     }
//   }

//   return {
//     follows: followingUsers,
//     dissapearingMessages: dissappearingMessagesDuration,
//     savedPosts,
//   };
// }
