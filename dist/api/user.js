"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.deleteUserProfilePicture = exports.updateUserProfilePicture = exports.updateUser = exports.getUsersByUsername = exports.getUser = exports.getUsers = void 0;
const utils_1 = require("../bin/utils");
const auth_1 = require("../firebase/auth");
const user_1 = require("../protos/user");
const constants_1 = require("./../constants");
const getUsers = async (username) => {
    const users = [];
    if (!(0, utils_1.isValidUsername)(username)) {
        console.error(new Error("Invalid Username"));
        return users;
    }
    const token = await auth_1.AuthHandler.getToken();
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
    const token = await auth_1.AuthHandler.getToken();
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
    const token = await auth_1.AuthHandler.getToken();
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
    const token = await auth_1.AuthHandler.getToken();
    if (!token) {
        throw new Error(`User is not fully signed in`);
    }
    const response = await fetch(`${constants_1.API_URL}/user`, {
        method: "PUT",
        body: user_1.UpdateUserInfo.encode(info).finish(),
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
    const token = await auth_1.AuthHandler.getToken();
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
    const token = await auth_1.AuthHandler.getToken();
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
