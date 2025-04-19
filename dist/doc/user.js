"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.unfollowUsers = exports.followUsers = exports.getUserData = exports.getDissaperaingMessagesState = exports.getFollowedUsersState = void 0;
exports.fetchUserDoc = fetchUserDoc;
exports.updateUserDocFollows = updateUserDocFollows;
const utils_1 = require("../bin/utils");
const auth_1 = require("../firebase/auth");
const vanjs_core_1 = require("vanjs-core");
const element_1 = require("../firebase/element");
const constants_1 = require("../constants");
const DEFAULT_DISAPPEARING_MESSAGES = 60 * 24 * 7; // minutes
let localUserFollows = vanjs_core_1.default.state([]);
let localDissappearingMessages = vanjs_core_1.default.state(DEFAULT_DISAPPEARING_MESSAGES); // minutes
const getFollowedUsersState = () => localUserFollows;
exports.getFollowedUsersState = getFollowedUsersState;
const getDissaperaingMessagesState = () => localDissappearingMessages;
exports.getDissaperaingMessagesState = getDissaperaingMessagesState;
const getUserData = async () => {
    const username = await auth_1.AuthHandler.getUsername();
    if (!username) {
        throw new Error("User is not authenticated");
    }
    const userData = await fetchUserDoc();
    if (userData) {
        localUserFollows.val = [...userData.follows];
    }
    return userData;
};
exports.getUserData = getUserData;
const followUsers = async (users) => {
    const data = await updateUserDocFollows(users, false);
    if (data) {
        localUserFollows.val = [...data.follows];
    }
};
exports.followUsers = followUsers;
const unfollowUsers = async (users) => {
    const data = await updateUserDocFollows(users, true);
    if (data) {
        localUserFollows.val = [...data.follows];
    }
};
exports.unfollowUsers = unfollowUsers;
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
