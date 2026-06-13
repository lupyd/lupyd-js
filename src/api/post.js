"use strict";
// import { API_URL, API_CDN_URL } from "../constants";
Object.defineProperty(exports, "__esModule", { value: true });
exports.getSavedPosts = exports.savePost = exports.getNotifications = exports.getTrendingHashtags = exports.deletePost = exports.reportPost = exports.createPostWithFiles = exports.createPost = exports.putVotes = exports.getPosts = exports.FetchType = exports.getPost = void 0;
const post_1 = require("../protos/post");
const utils_1 = require("../bin/utils");
const __1 = require("..");
const notification_1 = require("../protos/notification");
const api_1 = require("./api");
const error_1 = require("../error");
const getPost = async (apiUrl, id, token) => {
    const url = `${apiUrl}/post/${id}`;
    const response = await fetch(url, {
        headers: token
            ? {
                authorization: `Bearer ${token}`,
            }
            : undefined,
    });
    if (response.status === 200) {
        return post_1.FullPost.decode(new Uint8Array(await response.arrayBuffer()));
    }
    (0, error_1.throwStatusError)(response.status, await response.text());
};
exports.getPost = getPost;
var FetchType;
(function (FetchType) {
    FetchType[FetchType["Latest"] = 0] = "Latest";
    FetchType[FetchType["Users"] = 1] = "Users";
    FetchType[FetchType["Replies"] = 2] = "Replies";
    FetchType[FetchType["Edits"] = 3] = "Edits";
    FetchType[FetchType["Search"] = 4] = "Search";
    FetchType[FetchType["Hashtag"] = 5] = "Hashtag";
    FetchType[FetchType["Ids"] = 6] = "Ids";
})(FetchType || (exports.FetchType = FetchType = {}));
const parseGetPostsData = (details) => {
    const searchParams = new URLSearchParams();
    searchParams.append("type", (details.allowedPostTypes ?? 0).toString());
    if (details.start) {
        searchParams.append("start", details.start);
    }
    if (details.end) {
        searchParams.append("end", details.end);
    }
    if (details.offset) {
        searchParams.append("offset", details.offset.toString());
    }
    switch (details.fetchType) {
        case FetchType.Latest: {
            break;
        }
        case FetchType.Users: {
            if (Array.isArray(details.fetchTypeFields) &&
                details.fetchTypeFields.every((e) => typeof e === "string")) {
                searchParams.append("users", details.fetchTypeFields.join(","));
            }
            else if (typeof details.fetchTypeFields === "string" &&
                (0, utils_1.isValidUsername)(details.fetchTypeFields)) {
                searchParams.append("users", details.fetchTypeFields);
            }
            else {
                throw new Error("Invalid FetchType.Users");
            }
            break;
        }
        case FetchType.Replies: {
            if (typeof details.fetchTypeFields === "string") {
                searchParams.append("replies", details.fetchTypeFields);
            }
            else if (Array.isArray(details.fetchTypeFields) &&
                details.fetchTypeFields.every((e) => typeof e === "string")) {
                searchParams.append("replies", details.fetchTypeFields.join(","));
            }
            else {
                throw new Error("Invalid FetchType.Replies");
            }
            break;
        }
        case FetchType.Edits: {
            if (typeof details.fetchTypeFields === "string") {
                searchParams.append("edits", details.fetchTypeFields);
            }
            else if (Array.isArray(details.fetchTypeFields) &&
                details.fetchTypeFields.every((e) => typeof e === "string")) {
                searchParams.append("edits", details.fetchTypeFields.join(","));
            }
            else {
                throw new Error("Invalid FetchType.Replies");
            }
            break;
        }
        case FetchType.Search: {
            if (typeof details.fetchTypeFields === "string") {
                searchParams.append("search", details.fetchTypeFields);
            }
            else {
                throw new Error("Invalid FetchType.Search");
            }
            break;
        }
        case FetchType.Hashtag: {
            if (typeof details.fetchTypeFields == "string") {
                searchParams.append("hashtag", details.fetchTypeFields);
            }
            else {
                throw new Error("Invalid FetchType.Hashtag");
            }
            break;
        }
        case FetchType.Ids: {
            if (typeof details.fetchTypeFields === "string") {
                searchParams.append("edits", details.fetchTypeFields);
            }
            else if (Array.isArray(details.fetchTypeFields) &&
                details.fetchTypeFields.every((e) => typeof e === "string")) {
                searchParams.append("ids", details.fetchTypeFields.join(","));
            }
            else {
                throw new Error("Invalid FetchType.Ids");
            }
            break;
        }
    }
    return searchParams;
};
const getPosts = async (apiUrl, getPostDetails, token) => {
    const url = new URL(`${apiUrl}/post`, window.location.origin);
    parseGetPostsData(getPostDetails).forEach((value, key) => url.searchParams.append(key, value));
    const response = await fetch(url, {
        headers: token ? { Authorization: `Bearer ${token}` } : undefined,
    });
    if (response.status === 200) {
        const posts = post_1.FullPosts.decode(new Uint8Array(await response.arrayBuffer())).posts;
        return posts;
    }
    (0, error_1.throwStatusError)(response.status, await response.text());
};
exports.getPosts = getPosts;
const putVotes = async (apiUrl, votes, token) => {
    const url = `${apiUrl}/vote`;
    if (!token || !(0, api_1.usernameExistsInToken)(token)) {
        throw new Error(`User not authenticated`);
    }
    const body = new Uint8Array(post_1.Votes.encode(post_1.Votes.create({ votes })).finish());
    const response = await fetch(url, {
        method: "PUT",
        body,
        headers: {
            authorization: `Bearer ${token}`,
        },
    });
    if (response.status === 200) {
        return;
    }
    (0, error_1.throwStatusError)(response.status, await response.text());
};
exports.putVotes = putVotes;
const createPost = async (apiUrl, createPostDetails, token) => {
    const url = `${apiUrl}/post`;
    if (!token || !(0, api_1.usernameExistsInToken)(token))
        throw new Error("User Not Authenticated");
    const response = await fetch(url, {
        method: "POST",
        headers: { Authorization: `Bearer ${token}` },
        body: new Uint8Array(post_1.CreatePostDetails.encode(createPostDetails).finish()),
    });
    if (response.status === 200) {
        const id = new Uint8Array(await response.arrayBuffer());
        const post = post_1.FullPost.create({
            id,
            title: createPostDetails.title,
            body: createPostDetails.body
                ? post_1.PostBodies.encode(post_1.PostBodies.create({ bodies: [createPostDetails.body] })).finish()
                : new Uint8Array(),
            expiry: createPostDetails.expiry,
            replyingTo: createPostDetails.replyingTo,
            postType: createPostDetails.postType,
            isMemory: createPostDetails.isMemory,
        });
        return post;
    }
    (0, error_1.throwStatusError)(response.status, await response.text());
};
exports.createPost = createPost;
const makeCreatePostWithFilesBlob = async (details, files) => {
    const detailsProto = new Uint8Array(post_1.CreatePostWithFiles.encode(details).finish());
    const contentLength = detailsProto.byteLength +
        8 +
        details.files.map((e) => Number(e.length)).reduce((a, b) => a + b);
    const blobParts = [];
    console.log({ contentLength });
    blobParts.push(utils_1.Utils.bigintToBigEndian8Bytes(BigInt(detailsProto.byteLength)));
    blobParts.push(detailsProto);
    for (const file of files) {
        const response = await fetch(file);
        if (response.body && response.status === 200) {
            const blob = await response.blob();
            blobParts.push(blob);
        }
        else {
            throw new Error("File or blob url is invalid");
        }
    }
    console.log({ blobParts });
    return new Blob(blobParts);
};
const createPostWithFiles = async (apiCdnUrl, createPostDetails, files, progressCallback, token) => {
    const url = `${apiCdnUrl}/post-full`;
    if (!token || !(0, api_1.usernameExistsInToken)(token))
        throw new Error("User Not Authenticated");
    if (!progressCallback) {
        progressCallback = (total, sent) => console.log(`${sent}/${total} progress: ${(sent * 100) / total}%`);
    }
    const body = await makeCreatePostWithFilesBlob(createPostDetails, files);
    const contentLength = body.size;
    console.log({ createPostDetails, files, contentLength });
    const response = await (0, utils_1.fetchWithProgress)(url, "PUT", {
        Authorization: `Bearer ${token}`,
        "content-type": "application/octet-stream",
    }, body, (sent, total) => {
        if (progressCallback)
            progressCallback(total, sent);
    }, (recv, total) => { });
    if (response.status === 200) {
        return post_1.FullPost.decode(response.body);
    }
    (0, error_1.throwStatusError)(response.status, new TextDecoder().decode(response.body));
};
exports.createPostWithFiles = createPostWithFiles;
const reportPost = async (apiUrl, id, text, token) => {
    const body = new Uint8Array(post_1.PostReport.encode(post_1.PostReport.create({ postId: id, description: text })).finish());
    const url = `${apiUrl}/report`;
    if (token === undefined)
        throw new Error("User Not Authenticated");
    const response = await fetch(url, {
        method: "POST",
        headers: { Authorization: `Bearer ${token}` },
        body,
    });
    if (response.status === 200) {
        return;
    }
    (0, error_1.throwStatusError)(response.status, await response.text());
};
exports.reportPost = reportPost;
const deletePost = async (apiUrl, id, token) => {
    if (!token || !(0, api_1.usernameExistsInToken)(token)) {
        throw new Error("User is not signed in");
    }
    const url = `${apiUrl}/post/${(0, utils_1.ulidStringify)(id)}`;
    const response = await fetch(url, {
        method: "DELETE",
        headers: {
            Authorization: `Bearer ${token}`,
        },
    });
    if (response.status === 200) {
        return;
    }
    (0, error_1.throwStatusError)(response.status, await response.text());
};
exports.deletePost = deletePost;
const getTrendingHashtags = async (apiUrl) => {
    const url = `${apiUrl}/hashtags`;
    const response = await fetch(url);
    if (response.status == 200) {
        return __1.PostProtos.PostHashtags.decode(new Uint8Array(await response.arrayBuffer()));
    }
    (0, error_1.throwStatusError)(response.status, await response.text());
};
exports.getTrendingHashtags = getTrendingHashtags;
const getNotifications = async (apiUrl, token) => {
    if (!token || !(0, api_1.usernameExistsInToken)(token)) {
        throw new Error("User not authenticated");
    }
    const url = `${apiUrl}/notifications`;
    const response = await fetch(url, {
        headers: {
            authorization: `Bearer ${token}`,
        },
    });
    if (response.status == 200) {
        return notification_1.Notifications.decode(new Uint8Array(await response.arrayBuffer()));
    }
    (0, error_1.throwStatusError)(response.status, await response.text());
};
exports.getNotifications = getNotifications;
const savePost = async (apiUrl, token, postId) => {
    if (!(0, api_1.usernameExistsInToken)(token)) {
        throw new Error("User not authenticated");
    }
    const url = `${apiUrl}/savepost?id=${postId}`;
    const response = await fetch(url, {
        headers: {
            authorization: `Bearer ${token}`,
        },
        method: "PUT",
    });
    if (response.status == 200) {
        return;
    }
    (0, error_1.throwStatusError)(response.status, await response.text());
};
exports.savePost = savePost;
const getSavedPosts = async (apiUrl, token) => {
    if (!(0, api_1.usernameExistsInToken)(token)) {
        throw new Error("User not authenticated");
    }
    const url = `${apiUrl}/saved_posts`;
    const response = await fetch(url, {
        headers: {
            authorization: `Bearer ${token}`,
        },
    });
    // returns plain uuids; bad choice, but allows client side pagination
    if (response.status == 200) {
        const body = await response.arrayBuffer();
        const postIds = [];
        for (let i = 0; i < body.byteLength; i += 16) {
            postIds.push((0, utils_1.ulidStringify)(new Uint8Array(body.slice(i, i + 16))));
        }
        return postIds;
    }
    (0, error_1.throwStatusError)(response.status, await response.text());
};
exports.getSavedPosts = getSavedPosts;
