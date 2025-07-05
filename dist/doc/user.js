"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.getUserData = exports.getFollowedUsersState = exports.UsersFollowState = void 0;
exports.fetchUserDoc = fetchUserDoc;
exports.updateUserDocFollows = updateUserDocFollows;
exports.updateUserDocSavedPosts = updateUserDocSavedPosts;
const utils_1 = require("../bin/utils");
const auth_1 = require("../firebase/auth");
const constants_1 = require("../constants");
const element_1 = require("../firebase/element");
const id128_1 = require("id128");
const DEFAULT_DISAPPEARING_MESSAGES = 60 * 24 * 7; // minutes
// let localUserFollows = van.state([] as Array<string>);
// let localDissappearingMessages = van.state(DEFAULT_DISAPPEARING_MESSAGES); // minutes
class UsersFollowState {
    localUserFollows = [];
    localUserSavedPosts = [];
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
    async savePost(postId) {
        if (this.isSavedPost(postId))
            return;
        const data = await updateUserDocSavedPosts([postId], false);
        this.localUserSavedPosts = data.savedPosts;
        this.onChange(this);
    }
    async unsavePost(postId) {
        if (!this.isSavedPost(postId))
            return;
        const data = await updateUserDocSavedPosts([postId], true);
        this.localUserSavedPosts = data.savedPosts;
        this.onChange(this);
    }
    doesFollowUser(username) {
        return this.localUserFollows.includes(username);
    }
    isSavedPost(postId) {
        return this.localUserSavedPosts.includes(postId);
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
const getUserData = async () => {
    const username = await auth_1.AuthHandler.getUsername();
    if (!username) {
        throw new Error("User is not authenticated");
    }
    const userData = await fetchUserDoc();
    return userData;
};
exports.getUserData = getUserData;
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
async function updateUserDocSavedPosts(postsAffected, removeThem) {
    if (postsAffected.length === 0) {
        return;
    }
    const username = await auth_1.AuthHandler.getUsername();
    const token = await auth_1.AuthHandler.getToken();
    const projectId = (0, element_1.fbElement)().app.options.projectId;
    if (!username || !token || !projectId) {
        return undefined;
    }
    const resource = `projects/${projectId}/databases/(default)/documents/users/${username}`;
    const postsFields = {};
    const url = new URL(`${constants_1.FIRESTORE_BASE_URL}/${resource}`);
    url.searchParams.append("mask.fieldPaths", "follows");
    for (const postId of postsAffected) {
        if (!id128_1.Ulid.isCanonical(postId)) {
            throw new Error("Invalid post id");
        }
        postsFields[postId] = {
            nullValue: null,
        };
        url.searchParams.append("updateMask.fieldPaths", `saved.${postId}`);
    }
    const body = {
        name: resource,
        fields: {
            saved: {
                mapValue: {
                    fields: removeThem ? {} : postsFields,
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
    const savedPosts = [];
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
        const saved = fields["saved"];
        if (saved) {
            const mapValue = saved["mapValue"];
            if (mapValue) {
                const fields = mapValue["fields"];
                if (fields) {
                    for (const key in fields) {
                        if (id128_1.Ulid.isCanonical(key)) {
                            savedPosts.push(key);
                        }
                    }
                }
            }
        }
    }
    return {
        follows: followingUsers,
        dissapearingMessages: dissappearingMessagesDuration,
        savedPosts,
    };
}
