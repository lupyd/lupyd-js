"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.UserRelationsState = exports.RELATION_FLAGS = exports.relationToString = exports.Relation = exports.deleteUserProfilePicture = exports.updateUserProfilePicture = exports.updateUser = exports.getUsersByUsername = exports.getUser = exports.getUsers = void 0;
exports.getUserRelations = getUserRelations;
exports.updateUserRelation = updateUserRelation;
const protos_1 = require("@lupyd/protos");
const utils_1 = require("../bin/utils");
const error_1 = require("../error");
const api_1 = require("./api");
const { UpdateUserInfo, User, Users } = protos_1.user;
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
        return Users.decode(new Uint8Array(body)).users;
    }
    (0, error_1.throwStatusError)(response.status, await response.text());
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
        return User.decode(new Uint8Array(body));
    }
    (0, error_1.throwStatusError)(response.status, await response.text());
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
        return Users.decode(new Uint8Array(body)).users;
    }
    (0, error_1.throwStatusError)(response.status, await response.text());
};
exports.getUsersByUsername = getUsersByUsername;
const updateUser = async (apiUrl, info, token) => {
    if (!token || !(0, api_1.usernameExistsInToken)(token)) {
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
    (0, error_1.throwStatusError)(response.status, await response.text());
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
    if (response.status === 200) {
        return;
    }
    (0, error_1.throwStatusError)(response.status, await response.text());
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
    if (response.status === 200) {
        return;
    }
    (0, error_1.throwStatusError)(response.status, await response.text());
};
exports.deleteUserProfilePicture = deleteUserProfilePicture;
var Relation;
(function (Relation) {
    Relation[Relation["follow"] = 0] = "follow";
    Relation[Relation["unfollow"] = 1] = "unfollow";
    Relation[Relation["block"] = 2] = "block";
    Relation[Relation["unblock"] = 3] = "unblock";
    Relation[Relation["accept"] = 4] = "accept";
    Relation[Relation["unaccept"] = 5] = "unaccept";
})(Relation || (exports.Relation = Relation = {}));
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
        case Relation.accept:
            return "accept";
        case Relation.unaccept:
            return "unaccept";
    }
};
exports.relationToString = relationToString;
exports.RELATION_FLAGS = {
    FOLLOWS: 1,
    BLOCKED: 2,
    ACCEPTED: 4,
};
class UserRelationsState {
    followedUsers;
    blockedUsers;
    acceptedUsers;
    userStates;
    apiUrl;
    getToken;
    onUpdate;
    constructor(onUpdate, apiUrl, getToken) {
        this.onUpdate = onUpdate;
        this.followedUsers = new Set();
        this.blockedUsers = new Set();
        this.acceptedUsers = new Set();
        this.userStates = new Map();
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
        this.acceptedUsers.clear();
        this.userStates.clear();
        for (const relation of relations.relations) {
            let relVal;
            if (typeof relation.relation === "boolean") {
                relVal = relation.relation ? exports.RELATION_FLAGS.FOLLOWS : exports.RELATION_FLAGS.BLOCKED;
            }
            else {
                relVal = Number(relation.relation);
            }
            this.userStates.set(relation.uname, relVal);
            if ((relVal & exports.RELATION_FLAGS.FOLLOWS) !== 0) {
                this.followedUsers.add(relation.uname);
            }
            if ((relVal & exports.RELATION_FLAGS.BLOCKED) !== 0) {
                this.blockedUsers.add(relation.uname);
            }
            if ((relVal & exports.RELATION_FLAGS.ACCEPTED) !== 0) {
                this.acceptedUsers.add(relation.uname);
            }
        }
    }
    callUpdate() {
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
    getAcceptedUsers() {
        return [...this.acceptedUsers];
    }
    getUserState(username) {
        return this.userStates.get(username) ?? 0;
    }
    async blockUser(username) {
        await updateUserRelation(this.apiUrl, username, Relation.block, await this.getToken());
        const current = this.userStates.get(username) ?? 0;
        const updated = current | exports.RELATION_FLAGS.BLOCKED;
        this.userStates.set(username, updated);
        this.blockedUsers.add(username);
        this.callUpdate();
    }
    async unblockUser(username) {
        await updateUserRelation(this.apiUrl, username, Relation.unblock, await this.getToken());
        const current = this.userStates.get(username) ?? 0;
        const updated = current & ~exports.RELATION_FLAGS.BLOCKED;
        if (updated === 0) {
            this.userStates.delete(username);
        }
        else {
            this.userStates.set(username, updated);
        }
        this.blockedUsers.delete(username);
        this.callUpdate();
    }
    async followUser(username) {
        await updateUserRelation(this.apiUrl, username, Relation.follow, await this.getToken());
        const current = this.userStates.get(username) ?? 0;
        const updated = current | exports.RELATION_FLAGS.FOLLOWS;
        this.userStates.set(username, updated);
        this.followedUsers.add(username);
        this.callUpdate();
    }
    async unfollowUser(username) {
        await updateUserRelation(this.apiUrl, username, Relation.unfollow, await this.getToken());
        const current = this.userStates.get(username) ?? 0;
        const updated = current & ~exports.RELATION_FLAGS.FOLLOWS;
        if (updated === 0) {
            this.userStates.delete(username);
        }
        else {
            this.userStates.set(username, updated);
        }
        this.followedUsers.delete(username);
        this.callUpdate();
    }
    async acceptUser(username) {
        await updateUserRelation(this.apiUrl, username, Relation.accept, await this.getToken());
        const current = this.userStates.get(username) ?? 0;
        const updated = current | exports.RELATION_FLAGS.ACCEPTED;
        this.userStates.set(username, updated);
        this.acceptedUsers.add(username);
        this.callUpdate();
    }
    async unacceptUser(username) {
        await updateUserRelation(this.apiUrl, username, Relation.unaccept, await this.getToken());
        const current = this.userStates.get(username) ?? 0;
        const updated = current & ~exports.RELATION_FLAGS.ACCEPTED;
        if (updated === 0) {
            this.userStates.delete(username);
        }
        else {
            this.userStates.set(username, updated);
        }
        this.acceptedUsers.delete(username);
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
    if (response.status == 200) {
        return protos_1.user.Relations.decode(new Uint8Array(await response.arrayBuffer()));
    }
    (0, error_1.throwStatusError)(response.status, await response.text());
}
async function updateUserRelation(apiUrl, username, relation, token) {
    if (!token || !(0, api_1.usernameExistsInToken)(token)) {
        throw new Error("User haven't completed their sign in setup");
    }
    const response = await fetch(`${apiUrl}/relation?uname=${username}&relation=${(0, exports.relationToString)(relation)}`, {
        method: "PUT",
        headers: { authorization: `Bearer ${token}` },
    });
    if (response.status == 200) {
        return;
    }
    (0, error_1.throwStatusError)(response.status, await response.text());
}
