"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.ApiService = void 0;
exports.usernameExistsInToken = usernameExistsInToken;
exports.getPayloadFromAccessToken = getPayloadFromAccessToken;
const utils_1 = require("../bin/utils");
const error_1 = require("../error");
const user_1 = require("../protos/user");
const post_1 = require("./post");
const user_2 = require("./user");
function usernameExistsInToken(token) {
    try {
        const decodedToken = getPayloadFromAccessToken(token);
        return "uname" in decodedToken && typeof decodedToken.uname == "string";
    }
    catch (err) {
        console.error(err);
        return false;
    }
}
function getPayloadFromAccessToken(token) {
    const [_header, payload, _signature] = token.split(".");
    return JSON.parse(atob(payload));
}
async function undefinedOnfail(p) {
    try {
        const val = await p;
        return val;
    }
    catch (err) {
        return undefined;
    }
}
class ApiService {
    getToken = () => {
        throw new Error("getToken is not given");
    };
    apiUrl;
    apiCdnUrl;
    constructor(apiUrl, apiCdnUrl, getToken) {
        this.apiUrl = apiUrl;
        this.getToken = getToken;
        this.apiCdnUrl = apiCdnUrl;
    }
    async getPost(id) {
        return (0, post_1.getPost)(this.apiUrl, id, await undefinedOnfail(this.getToken()));
    }
    async getPosts(getPostDetails) {
        return (0, post_1.getPosts)(this.apiUrl, getPostDetails, await undefinedOnfail(this.getToken()));
    }
    putVote(vote) {
        return this.putVotes([vote]);
    }
    async putVotes(votes) {
        const token = await this.getToken();
        return (0, post_1.putVotes)(this.apiUrl, votes, token);
    }
    async createPost(createPostDetails) {
        const token = await this.getToken();
        return (0, post_1.createPost)(this.apiUrl, createPostDetails, token);
    }
    async createPostWithFiles(createPostDetails, files, progressCallback) {
        const token = await this.getToken();
        return (0, post_1.createPostWithFiles)(this.apiCdnUrl, createPostDetails, files, progressCallback, token);
    }
    async reportPost(id, text) {
        const token = await this.getToken();
        return (0, post_1.reportPost)(this.apiUrl, id, text, token);
    }
    async deletePost(id) {
        const token = await this.getToken();
        return (0, post_1.deletePost)(this.apiUrl, id, token);
    }
    async getTrendingHashtags() {
        return (0, post_1.getTrendingHashtags)(this.apiUrl);
    }
    async getNotifications() {
        return (0, post_1.getNotifications)(this.apiUrl, await this.getToken());
    }
    async getUsers(username) {
        return (0, user_2.getUsers)(this.apiUrl, username, await undefinedOnfail(this.getToken()));
    }
    async getUser(username) {
        return (0, user_2.getUser)(this.apiUrl, username, await undefinedOnfail(this.getToken()));
    }
    async getUsersByUsername(usernames) {
        return (0, user_2.getUsersByUsername)(this.apiUrl, usernames, await undefinedOnfail(this.getToken()));
    }
    async updateUser(info) {
        return (0, user_2.updateUser)(this.apiUrl, info, await this.getToken());
    }
    async updateUserProfilePicture(blob) {
        return (0, user_2.updateUserProfilePicture)(this.apiCdnUrl, blob, await this.getToken());
    }
    async deleteUserProfilePicture() {
        return (0, user_2.deleteUserProfilePicture)(this.apiCdnUrl, await this.getToken());
    }
    async deleteUser() {
        const token = await this.getToken();
        if (!usernameExistsInToken(token)) {
            throw Error("User is not signed in full");
        }
        const response = await fetch(`${this.apiUrl}/user`, {
            method: "DELETE",
            headers: {
                authorization: `Bearer ${token}`,
            },
        });
        if (response.status == 200) {
            return;
        }
        (0, error_1.throwStatusError)(response.status, await response.text());
    }
    async assignUsername(username) {
        if (!(0, utils_1.isValidUsername)(username)) {
            throw new Error("Not a valid username");
        }
        const token = await this.getToken();
        if (usernameExistsInToken(token)) {
            throw Error("Username already assigned");
        }
        const response = await fetch(`${this.apiUrl}/user`, {
            method: "POST",
            headers: {
                authorization: `Bearer ${await this.getToken()}`,
            },
            body: new Uint8Array(user_1.FullUser.encode(user_1.FullUser.create({ uname: username })).finish()),
        });
        if (response.status == 200 || response.status == 201) {
            return;
        }
        (0, error_1.throwStatusError)(response.status, await response.text());
    }
}
exports.ApiService = ApiService;
