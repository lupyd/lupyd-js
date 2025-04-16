"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.ServerVotes = exports.CDN = exports.server = void 0;
// import { getFunctions, httpsCallable } from "firebase/functions";
// import { _Auth } from "../firebase/auth";
const functions_1 = require("../firebase/functions");
const friendRequest_1 = require("../models/friendRequest");
// import { getSupabase } from "../supabase/supabase";
const local_1 = require("./local");
var server;
(function (server) {
    async function getUsers(username, like = false, forcedRefresh = false) {
        if (!forcedRefresh && !like) {
            const _user = await local_1.UserCache.get(username);
            if (_user) {
                return _user;
            }
        }
        try {
            if (like) {
                const users = [];
                const result = await functions_1.FBFunctions.call("getUsers", {
                    _name: username,
                    like: like
                });
                console.log("got result from server ", result);
                const obj = JSON.parse(result.data);
                if (Array.isArray(obj)) {
                    for (let i of obj) {
                        users.push(i);
                    }
                }
                return users;
            }
            else {
                const result = await functions_1.FBFunctions.call("getUsers", {
                    _name: username
                });
                const obj = JSON.parse(result.data);
                if (Array.isArray(obj) && obj.length == 1) {
                    local_1.UserCache.set(obj[0]);
                    return obj[0];
                }
            }
        }
        catch (err) {
            console.error(err);
        }
    }
    server.getUsers = getUsers;
    server.report = (id) => getSupabase().then(client => client.rpc("report", { id }));
    async function getFriendRequests(ts) {
        const username = await _Auth.username();
        if (!username)
            throw "User need to be signed in";
        const isoDate = ts.toISOString();
        const response = await functions_1.FBFunctions.call("getFriends", { ts: isoDate });
        const data = JSON.parse(response.data);
        const _users = [];
        if (Array.isArray(data)) {
            for (let f of data) {
                const [first, second] = f.id.split('-');
                const isFirst = first === username;
                const _getUser = () => {
                    return getUsers(isFirst ? second : first);
                };
                const user = (await _getUser());
                const getStatus = () => {
                    switch (f.s) {
                        case 0:
                            return isFirst ? friendRequest_1.FriendStatus.requested : friendRequest_1.FriendStatus.pending;
                        case 1:
                            return friendRequest_1.FriendStatus.friend;
                        case 2:
                            return isFirst ? friendRequest_1.FriendStatus.requested : friendRequest_1.FriendStatus.pending;
                        case -1:
                            if (isFirst) {
                            }
                            else {
                            }
                        case -2:
                            if (isFirst) {
                            }
                            else {
                                local_1.local;
                            }
                        default:
                            return friendRequest_1.FriendStatus.none;
                    }
                };
                _users.push(user);
            }
        }
        else {
            throw "failed to get friend requests" + data;
        }
        return _users;
    }
    server.getFriendRequests = getFriendRequests;
})(server || (exports.server = server = {}));
var CDN;
(function (CDN) {
    async function uploadFile(buffer, url, link, contentType) {
        const jwt = await _Auth.getJwt();
        if (!jwt) {
            throw "Not verified";
        }
        // const _headers = new Headers(...headers);
        // _headers.set("jwt", jwt);
        // _headers.set("content-type", file.type)
        return fetch(url + "/" + link, {
            method: "PUT",
            body: buffer,
            headers: {
                "content-type": contentType ?? "application/octet-stream"
            }
            // headers
        });
    }
    CDN.uploadFile = uploadFile;
})(CDN || (exports.CDN = CDN = {}));
var ServerVotes;
(function (ServerVotes) {
    let votes = [];
    ServerVotes.vote = async (vote) => {
        const index = votes.findIndex(e => e.id === vote.id);
        if (index == -1) {
            const _vote = await local_1.VotesStorage.get(vote.id);
            if (_vote == undefined) {
                votes.push(vote);
                await local_1.VotesStorage.put(vote);
            }
            else {
                if (_vote == vote.v) {
                    await local_1.VotesStorage.remove(vote.id);
                }
                else {
                    await local_1.VotesStorage.put(vote);
                }
            }
        }
        else {
            if (votes[index].v === vote.v) {
                votes.splice(index, 1);
            }
            else {
                votes[index] = vote;
            }
        }
    };
    ServerVotes.getvotes = (ids) => getSupabase().then(client => client.rpc("getvotes", {
        ids,
    }).then(res => res.data));
    ServerVotes.flushVotes = async () => {
        const username = _Auth.username();
        const jwt = await _Auth.getJwt();
        if (!(await username) || !jwt)
            return;
        const client = await getSupabase();
        client.functions.invoke("vote", {
            headers: {
                jwt,
                "Access-Control-Allow-Headers": "*"
            },
            body: JSON.stringify(votes)
        });
        votes.length = 0;
    };
})(ServerVotes || (exports.ServerVotes = ServerVotes = {}));
