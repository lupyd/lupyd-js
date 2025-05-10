"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.getUserData = exports.getFollowedUsersState = exports.UsersFollowState = void 0;
exports.fetchUserDoc = fetchUserDoc;
exports.updateUserDocFollows = updateUserDocFollows;
const utils_1 = require("../bin/utils");
const auth_1 = require("../firebase/auth");
const element_1 = require("../firebase/element");
const constants_1 = require("../constants");
const DEFAULT_DISAPPEARING_MESSAGES = 60 * 24 * 7; // minutes
// let localUserFollows = van.state([] as Array<string>);
// let localDissappearingMessages = van.state(DEFAULT_DISAPPEARING_MESSAGES); // minutes
class UsersFollowState {
    localUserFollows = [];
    onChange = (_) => { };
    constructor(callback = (_) => { }) {
        this.onChange = callback;
    }
    setOnChangeCallback(callback) {
        this.onChange = callback;
    }
    async followUser(username) {
        if (this.doesFollowUser(username))
            return;
        const data = await updateUserDocFollows([username], false);
        this.localUserFollows = data.follows;
        this.onChange(this);
    }
    async unfollowUser(username) {
        if (!this.doesFollowUser(username))
            return;
        const data = await updateUserDocFollows([username], true);
        this.localUserFollows = data.follows;
        this.onChange(this);
    }
    doesFollowUser(username) {
        return this.localUserFollows.includes(username);
    }
}
exports.UsersFollowState = UsersFollowState;
let _state = undefined;
const getFollowedUsersState = () => {
    if (typeof window === "undefined")
        return undefined;
    if (!_state)
        _state = new UsersFollowState();
    window["_userFollowedState"] = _state;
    return _state;
};
exports.getFollowedUsersState = getFollowedUsersState;
// export const getDissaperaingMessagesState = () => localDissappearingMessages;
const getUserData = async () => {
    const username = await auth_1.AuthHandler.getUsername();
    if (!username) {
        throw new Error("User is not authenticated");
    }
    const userData = await fetchUserDoc();
    // if (userData) {
    //   localUserFollows.val = [...userData.follows];
    // }
    return userData;
};
exports.getUserData = getUserData;
// export const followUsers = async (users: Array<string>) => {
//   const data = await updateUserDocFollows(users, false);
//   if (data) {
//     localUserFollows.val = [...data.follows];
//   }
// };
// export const unfollowUsers = async (users: Array<string>) => {
//   const data = await updateUserDocFollows(users, true);
//   if (data) {
//     localUserFollows.val = [...data.follows];
//   }
// };
async function fetchUserDoc() {
    const username = await auth_1.AuthHandler.getUsername();
    const token = await auth_1.AuthHandler.getToken();
    const projectId = (0, element_1.fbElement)().app.options.projectId;
    if (!username || !token || !projectId) {
        return undefined;
    }
    const url = `${constants_1.FIRESTORE_BASE_URL}/projects/${projectId}/databases/(default)/documents/users/${username}`;
    const response = await fetch(url);
    if (response.status !== 200) {
        console.error(`Failed to fetch document ${response.status} ${await response.text()}`);
        return;
    }
    return parseUserData(await response.json());
}
async function updateUserDocFollows(usersAffected, removeThem) {
    if (usersAffected.length === 0) {
        return;
    }
    const username = await auth_1.AuthHandler.getUsername();
    const token = await auth_1.AuthHandler.getToken();
    const projectId = (0, element_1.fbElement)().app.options.projectId;
    if (!username || !token || !projectId) {
        return undefined;
    }
    const resource = `projects/${projectId}/databases/(default)/documents/users/${username}`;
    const userFields = {};
    const url = new URL(`${constants_1.FIRESTORE_BASE_URL}/${resource}`);
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
        console.error(`Failed to fetch document ${response.status} ${await response.text()}`);
        return;
    }
    return parseUserData(await response.json());
}
function parseUserData(doc) {
    const followingUsers = [];
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
                        if ((0, utils_1.isValidUsername)(key)) {
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
