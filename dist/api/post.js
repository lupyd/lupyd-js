"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.getNotifications = exports.getTrendingHashtags = exports.deletePost = exports.reportPost = exports.createPostWithFiles = exports.createPost = exports.putVotes = exports.putVote = exports.getPosts = exports.FetchType = exports.getPost = void 0;
const constants_1 = require("../constants");
const post_1 = require("../protos/post");
const utils_1 = require("../bin/utils");
const __1 = require("..");
const notification_1 = require("../protos/notification");
const auth_1 = require("../auth/auth");
const getPost = async (id) => {
    const url = `${constants_1.API_URL}/post/${id}`;
    const response = await fetch(url);
    if (response.status === 200) {
        return post_1.FullPost.decode(new Uint8Array(await response.arrayBuffer()));
    }
    else {
        console.error(`${url} [${response.status}] ${await response.text()}`);
    }
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
    }
    return searchParams;
};
const getPosts = async (getPostDetails) => {
    try {
        const url = new URL(`${constants_1.API_URL}/post`, window.location.origin);
        parseGetPostsData(getPostDetails).forEach((value, key) => url.searchParams.append(key, value));
        const token = await (0, auth_1.getAuthHandler)()?.getToken();
        const response = await fetch(url, {
            headers: token ? { Authorization: `Bearer ${token}` } : undefined,
        });
        console.log({ url: url.toString() });
        if (response.status === 200) {
            const posts = post_1.FullPosts.decode(new Uint8Array(await response.arrayBuffer())).posts;
            return posts;
        }
        else {
            console.error(`${url} [${response.status}] ${await response.text()}`);
        }
    }
    catch (err) {
        console.error(err);
    }
    return [];
};
exports.getPosts = getPosts;
class VotesRequestBatcher {
    queuedVotes = [];
    intervalId;
    constructor() {
        this.intervalId = setInterval(() => {
            this.flushVotes();
        }, 10_000);
    }
    static instance = new VotesRequestBatcher();
    queueVote(vote) {
        for (let i = 0; i < this.queuedVotes.length; i++) {
            if (this.queuedVotes[i].id == vote.id) {
                this.queuedVotes[i] = vote;
            }
        }
    }
    flushVotes() {
        const votes = this.queuedVotes;
        if (votes.length === 0)
            return;
        this.queuedVotes = [];
        (0, exports.putVotes)(votes)
            .then(() => console.log(`Flushed votes ${votes.map((e) => `${(0, utils_1.ulidStringify)(e.id)}:${e.val}`)}`))
            .catch((err) => {
            console.error(err);
            votes.forEach(this.queueVote);
        });
    }
}
const putVote = (vote) => {
    // VotesRequestBatcher.instance.queueVote(vote);
    return (0, exports.putVotes)([vote]);
};
exports.putVote = putVote;
const putVotes = async (votes) => {
    try {
        // const db = (
        //   document.querySelector("lupyd-databases") as LupydDatabasesElement
        // ).localDb;
        const url = `${constants_1.API_URL}/vote`;
        const token = await (0, auth_1.getAuthHandler)()?.getToken();
        if (!token) {
            throw new Error(`User not authenticated`);
        }
        const body = post_1.Votes.encode(post_1.Votes.create({ votes })).finish();
        const response = await fetch(url, {
            method: "PUT",
            body,
            headers: {
                authorization: `Bearer ${token}`,
            },
        });
        if (response.status === 200) {
            console.log(`Successfully voted`);
            const username = await (0, auth_1.getAuthHandler)()?.getUsername();
            // if (db) {
            //   const tx = db.transaction(VOTES_DB_STORE_NAME, "readwrite");
            //   await Promise.all(
            //     votes.map((vote) =>
            //       tx.store.put(
            //         { id: vote.id, val: vote.val?.val, by: username },
            //         ulidStringify(vote.id),
            //       ),
            //     ),
            //   );
            //   await tx.done;
            // }
        }
        else {
            console.error(`${url} [${response.status}] ${await response.text()}`);
        }
    }
    catch (err) {
        console.error(err);
    }
};
exports.putVotes = putVotes;
const createPost = async (createPostDetails) => {
    const url = `${constants_1.API_URL}/post`;
    const username = await (0, auth_1.getAuthHandler)()?.getUsername();
    const token = await (0, auth_1.getAuthHandler)()?.getToken();
    if (username === null || token === undefined)
        throw new Error("User Not Authenticated");
    console.log({ createPostDetails });
    const response = await fetch(url, {
        method: "POST",
        headers: { Authorization: `Bearer ${token}` },
        body: post_1.CreatePostDetails.encode(createPostDetails).finish(),
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
            by: username,
        });
        return post;
    }
    else {
        console.error(`${url} [${response.status}] ${await response.text()}`);
    }
};
exports.createPost = createPost;
const makeCreatePostWithFilesBlob = async (details, files) => {
    const detailsProto = post_1.CreatePostWithFiles.encode(details).finish();
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
const createPostWithFiles = async (createPostDetails, files, progressCallback) => {
    const url = `${constants_1.API_CDN_URL}/post-full`;
    const token = await (0, auth_1.getAuthHandler)()?.getToken();
    if (token === undefined)
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
    }, body, (sent, total) => progressCallback(total, sent), (recv, total) => { });
    // const response = await fetch(url, {
    //   method: "PUT",
    //   headers: {
    //     Authorization: `Bearer ${token}`,
    //     "content-length": contentLength.toString(),
    //     "content-type": "application/octet-stream",
    //   },
    //   body,
    // });
    // if (response.status === 200) {
    //   return FullPost.decode(new Uint8Array(await response.arrayBuffer()));
    // } else {
    //   console.error(`${url} [${response.status}] ${await response.text()}`);
    // }
    if (response.status === 200) {
        return post_1.FullPost.decode(response.body);
    }
    else {
        console.error(`${url} [${response.status}] ${new TextDecoder().decode(response.body)}`);
    }
};
exports.createPostWithFiles = createPostWithFiles;
const reportPost = async (id, text) => {
    const body = post_1.PostReport.encode(post_1.PostReport.create({ postId: id, description: text })).finish();
    const url = `${constants_1.API_URL}/report`;
    const token = await (0, auth_1.getAuthHandler)()?.getToken();
    if (token === undefined)
        throw new Error("User Not Authenticated");
    const response = await fetch(url, {
        method: "POST",
        headers: { Authorization: `Bearer ${token}` },
        body,
    });
    if (response.status === 200) {
        console.log(`Successfully submitted report`);
    }
    else {
        console.error(`${url} [${response.status}] ${await response.text()}`);
    }
};
exports.reportPost = reportPost;
const deletePost = async (id) => {
    const username = await (0, auth_1.getAuthHandler)()?.getUsername();
    const token = await (0, auth_1.getAuthHandler)()?.getToken();
    if (!username || !token) {
        throw new Error("User is not signed in");
    }
    const url = `${constants_1.API_URL}/post/${(0, utils_1.ulidStringify)(id)}`;
    const response = await fetch(url, {
        method: "DELETE",
        headers: {
            Authorization: `Bearer ${token}`,
        },
    });
    console.log(`DELETE ${url} status: ${response.status} ${await response.text()}`);
};
exports.deletePost = deletePost;
const getTrendingHashtags = async () => {
    const url = `${constants_1.API_URL}/hashtags`;
    const response = await fetch(url);
    if (response.status != 200) {
        throw new Error(`unexpected status code: ${response.status}, body: ${await response.text()}`);
    }
    return __1.PostProtos.PostHashtags.decode(new Uint8Array(await response.arrayBuffer()));
};
exports.getTrendingHashtags = getTrendingHashtags;
const getNotifications = async () => {
    const url = `${constants_1.API_URL}/notifications`;
    const response = await fetch(url, {
        headers: {
            authorization: `Bearer ${await (0, auth_1.getAuthHandler)()?.getToken()}`,
        },
    });
    if (response.status == 200) {
        return notification_1.Notifications.decode(new Uint8Array(await response.arrayBuffer()));
    }
    else {
        throw new Error(`Received unexpected status: ${response.status} ${await response.text()}`);
    }
};
exports.getNotifications = getNotifications;
