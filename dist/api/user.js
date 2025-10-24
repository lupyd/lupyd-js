"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.UserRelationsState = exports.relationToString = exports.deleteUserProfilePicture = exports.updateUserProfilePicture = exports.updateUser = exports.getUsersByUsername = exports.getUser = exports.getUsers = void 0;
exports.getUserRelations = getUserRelations;
exports.updateUserRelation = updateUserRelation;
const __1 = require("..");
const utils_1 = require("../bin/utils");
const user_1 = require("../protos/user");
const api_1 = require("./api");
// import { API_CDN_URL, API_URL } from "./../constants";
const getUsers = async (apiUrl, username, token) => {
    const users = [];
    if (username.length <= 1) {
        console.error(new Error("Invalid Username"));
        return users;
    }
    const response = await fetch(`${apiUrl}/user/${username}*`, {
        headers: token ? { Authorization: `Bearer ${token}` } : undefined,
    });
    if (response.status === 200) {
        const body = await response.arrayBuffer();
        return user_1.Users.decode(new Uint8Array(body)).users;
    }
    return users;
};
exports.getUsers = getUsers;
const getUser = async (apiUrl, username, token) => {
    if (!(0, utils_1.isValidUsername)(username)) {
        console.error(new Error("Invalid Username"));
    }
    const response = await fetch(`${apiUrl}/user/${username}`, {
        headers: token ? { Authorization: `Bearer ${token}` } : undefined,
    });
    if (response.status === 200) {
        const body = await response.arrayBuffer();
        return user_1.User.decode(new Uint8Array(body));
    }
};
exports.getUser = getUser;
const getUsersByUsername = async (apiUrl, usernames, token) => {
    const users = [];
    if (usernames.some((e) => !(0, utils_1.isValidUsername)(e))) {
        console.error(new Error("Invalid Username"));
        return users;
    }
    const response = await fetch(`${apiUrl}/user?users=${encodeURIComponent(usernames.join(","))}`, {
        headers: token ? { Authorization: `Bearer ${token}` } : undefined,
    });
    if (response.status === 200) {
        const body = await response.arrayBuffer();
        return user_1.Users.decode(new Uint8Array(body)).users;
    }
    return users;
};
exports.getUsersByUsername = getUsersByUsername;
const updateUser = async (apiUrl, info, token) => {
    if (!token || !(0, api_1.usernameExistsInToken)(token)) {
        throw new Error(`User is not fully signed in`);
    }
    const response = await fetch(`${apiUrl}/user`, {
        method: "PUT",
        body: new Uint8Array(user_1.UpdateUserInfo.encode(info).finish()),
        headers: {
            "content-type": "application/protobuf; proto=lupyd.user.UpdateUserInfo",
            authorization: `Bearer ${token}`,
        },
    });
    if (response.status !== 200) {
        console.error(`Failed to update user ${response.status} ${await response.text()}`);
    }
};
exports.updateUser = updateUser;
const updateUserProfilePicture = async (apiCdnUrl, blob, token) => {
    if (!token || !(0, api_1.usernameExistsInToken)(token)) {
        throw new Error(`User is not fully signed in`);
    }
    const response = await fetch(`${apiCdnUrl}/user`, {
        method: "PUT",
        body: blob,
        headers: {
            authorization: `Bearer ${token}`,
        },
    });
    if (response.status !== 200) {
        console.error(`Failed to update user profile ${response.status} ${await response.text()}`);
    }
};
exports.updateUserProfilePicture = updateUserProfilePicture;
const deleteUserProfilePicture = async (apiCdnUrl, token) => {
    if (!token || !(0, api_1.usernameExistsInToken)(token)) {
        throw new Error(`User is not fully signed in`);
    }
    const response = await fetch(`${apiCdnUrl}/user`, {
        method: "DELETE",
        headers: {
            authorization: `Bearer ${token}`,
        },
    });
    if (response.status !== 200) {
        console.error(`Failed to update user profile ${response.status} ${await response.text()}`);
    }
};
exports.deleteUserProfilePicture = deleteUserProfilePicture;
var Relation;
(function (Relation) {
    Relation[Relation["follow"] = 0] = "follow";
    Relation[Relation["unfollow"] = 1] = "unfollow";
    Relation[Relation["block"] = 2] = "block";
    Relation[Relation["unblock"] = 3] = "unblock";
})(Relation || (Relation = {}));
const relationToString = (r) => {
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
exports.relationToString = relationToString;
class UserRelationsState {
    followedUsers;
    blockedUsers;
    apiUrl;
    getToken;
    onUpdate;
    constructor(onUpdate, apiUrl, getToken) {
        this.onUpdate = onUpdate;
        this.followedUsers = new Set();
        this.blockedUsers = new Set();
        this.apiUrl = apiUrl;
        this.getToken = getToken;
    }
    async refresh() {
        const relations = await getUserRelations(this.apiUrl, await this.getToken());
        this.fromRelations(relations);
        this.callUpdate();
    }
    fromRelations(relations) {
        this.followedUsers.clear();
        this.blockedUsers.clear();
        for (const relation of relations.relations) {
            if (relation.relation) {
                this.followedUsers.add(relation.uname);
            }
            else {
                this.blockedUsers.add(relation.uname);
            }
        }
    }
    callUpdate() {
        this.onUpdate([...this.followedUsers], [...this.blockedUsers]);
    }
    async blockUser(username) {
        await updateUserRelation(this.apiUrl, username, Relation.block, await this.getToken());
        this.followedUsers.delete(username);
        this.blockedUsers.add(username);
        this.callUpdate();
    }
    async unblockUser(username) {
        await updateUserRelation(this.apiUrl, username, Relation.unblock, await this.getToken());
        this.blockedUsers.delete(username);
        this.callUpdate();
    }
    async followUser(username) {
        await updateUserRelation(this.apiUrl, username, Relation.follow, await this.getToken());
        this.followedUsers.add(username);
        this.blockedUsers.delete(username);
        this.callUpdate();
    }
    async unfollowUser(username) {
        await updateUserRelation(this.apiUrl, username, Relation.unblock, await this.getToken());
        this.followedUsers.delete(username);
        this.callUpdate();
    }
}
exports.UserRelationsState = UserRelationsState;
async function getUserRelations(apiUrl, token) {
    if (!token || !(0, api_1.usernameExistsInToken)(token)) {
        throw new Error("User haven't completed their sign in setup");
    }
    const response = await fetch(`${apiUrl}/relations`, {
        headers: {
            authorization: `Bearer ${token}`,
        },
    });
    if (response.status != 200) {
        throw new Error(`received invalid status ${response.status}, text: ${await response.text()}`);
    }
    return __1.UserProtos.Relations.decode(new Uint8Array(await response.arrayBuffer()));
}
async function updateUserRelation(apiUrl, username, relation, token) {
    if (!token || !(0, api_1.usernameExistsInToken)(token)) {
        throw new Error("User haven't completed their sign in setup");
    }
    const response = await fetch(`${apiUrl}/relation?uname=${username}&relation=${(0, exports.relationToString)(relation)}`, {
        method: "PUT",
        headers: { authorization: `Bearer ${token}` },
    });
    if (response.status !== 200) {
        throw new Error(await response.text());
    }
}
