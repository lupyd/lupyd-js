"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.updateUserRelation = exports.getUserRelations = exports.UserRelationsState = exports.relationToString = exports.deleteUserProfilePicture = exports.updateUserProfilePicture = exports.updateUser = exports.getUsersByUsername = exports.getUser = exports.getUsers = void 0;
const __1 = require("..");
const auth_1 = require("../auth/auth");
const utils_1 = require("../bin/utils");
const user_1 = require("../protos/user");
const constants_1 = require("./../constants");
const getUsers = async (username) => {
    const users = [];
    if (username.length <= 1) {
        console.error(new Error("Invalid Username"));
        return users;
    }
    const token = await (0, auth_1.getAuthHandler)()?.getToken();
    const response = await fetch(`${constants_1.API_URL}/user/${username}*`, {
        headers: token !== null ? { Authorization: `Bearer ${token}` } : undefined,
    });
    if (response.status === 200) {
        const body = await response.arrayBuffer();
        return user_1.Users.decode(new Uint8Array(body)).users;
    }
    return users;
};
exports.getUsers = getUsers;
const getUser = async (username) => {
    if (!(0, utils_1.isValidUsername)(username)) {
        console.error(new Error("Invalid Username"));
    }
    const token = await (0, auth_1.getAuthHandler)()?.getToken();
    const response = await fetch(`${constants_1.API_URL}/user/${username}`, {
        headers: token !== null ? { Authorization: `Bearer ${token}` } : undefined,
    });
    if (response.status === 200) {
        const body = await response.arrayBuffer();
        return user_1.User.decode(new Uint8Array(body));
    }
};
exports.getUser = getUser;
const getUsersByUsername = async (usernames) => {
    const users = [];
    if (usernames.some((e) => !(0, utils_1.isValidUsername)(e))) {
        console.error(new Error("Invalid Username"));
        return users;
    }
    const token = await (0, auth_1.getAuthHandler)()?.getToken();
    const response = await fetch(`${constants_1.API_URL}/user?users=${encodeURIComponent(usernames.join(","))}`, {
        headers: token !== null ? { Authorization: `Bearer ${token}` } : undefined,
    });
    if (response.status === 200) {
        const body = await response.arrayBuffer();
        return user_1.Users.decode(new Uint8Array(body)).users;
    }
    return users;
};
exports.getUsersByUsername = getUsersByUsername;
const updateUser = async (info) => {
    const token = await (0, auth_1.getAuthHandler)()?.getToken();
    if (!token) {
        throw new Error(`User is not fully signed in`);
    }
    const response = await fetch(`${constants_1.API_URL}/user`, {
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
const updateUserProfilePicture = async (blob) => {
    const token = await (0, auth_1.getAuthHandler)()?.getToken();
    if (!token) {
        throw new Error(`User is not fully signed in`);
    }
    const response = await fetch(`${constants_1.API_CDN_URL}/user`, {
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
const deleteUserProfilePicture = async () => {
    const token = await (0, auth_1.getAuthHandler)()?.getToken();
    if (!token) {
        throw new Error(`User is not fully signed in`);
    }
    const response = await fetch(`${constants_1.API_CDN_URL}/user`, {
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
    onUpdate;
    constructor(onUpdate) {
        this.onUpdate = onUpdate;
        this.followedUsers = new Set();
        this.blockedUsers = new Set();
    }
    async refresh() {
        const relations = await getUserRelations();
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
        await updateUserRelation(username, Relation.block);
        this.followedUsers.delete(username);
        this.blockedUsers.add(username);
        this.callUpdate();
    }
    async unblockUser(username) {
        await updateUserRelation(username, Relation.unblock);
        this.blockedUsers.delete(username);
        this.callUpdate();
    }
    async followUser(username) {
        await updateUserRelation(username, Relation.follow);
        this.followedUsers.add(username);
        this.blockedUsers.delete(username);
        this.callUpdate();
    }
    async unfollowUser(username) {
        await updateUserRelation(username, Relation.unblock);
        this.followedUsers.delete(username);
        this.callUpdate();
    }
}
exports.UserRelationsState = UserRelationsState;
async function getUserRelations() {
    if (!(await (0, auth_1.getAuthHandler)()?.getUsername())) {
        throw new Error("User haven't completed their sign in setup");
    }
    const token = await (0, auth_1.getAuthHandler)()?.getToken();
    const response = await fetch(`${constants_1.API_URL}/relations`, {
        headers: {
            authorization: `Bearer ${token}`,
        },
    });
    if (response.status != 200) {
        throw new Error(`received invalid status ${response.status}, text: ${await response.text()}`);
    }
    return __1.UserProtos.Relations.decode(new Uint8Array(await response.arrayBuffer()));
}
exports.getUserRelations = getUserRelations;
async function updateUserRelation(username, relation) {
    if (!(await (0, auth_1.getAuthHandler)()?.getUsername())) {
        throw new Error("User haven't completed their sign in setup");
    }
    const token = await (0, auth_1.getAuthHandler)()?.getToken();
    const response = await fetch(`${constants_1.API_URL}/relation?uname=${username}&relation=${(0, exports.relationToString)(relation)}`, {
        method: "PUT",
        headers: { authorization: `Bearer ${token}` },
    });
    if (response.status !== 200) {
        throw new Error(await response.text());
    }
}
exports.updateUserRelation = updateUserRelation;
