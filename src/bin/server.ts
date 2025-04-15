// import { getFunctions, httpsCallable } from "firebase/functions";
// import { _Auth } from "../firebase/auth";
import { FBFunctions } from "../firebase/functions";
import { FriendStatus } from "../models/friendRequest";
import { _User } from "../models/userModel";
// import { getSupabase } from "../supabase/supabase";
import { local, UserCache, Vote, VotesStorage } from "./local";

export namespace server {

    export async function getUsers(username: string, like: boolean = false, forcedRefresh: boolean = false) {

        if (!forcedRefresh && !like) {
            const _user = await UserCache.get(username);
            if (_user) {
                return _user as _User;
            }
        }
        try {
            if (like) {
                const users: _User[] = [];
                const result = await FBFunctions.call("getUsers", {
                    _name: username,
                    like: like
                });
                console.log("got result from server ", result);
                const obj: _User[] = JSON.parse(result.data as string);
                if (Array.isArray(obj)) {
                    for (let i of obj) {
                        users.push(i);
                    }
                }
                return users;
            } else {
                const result = await FBFunctions.call("getUsers", {
                    _name: username
                });
                const obj: _User[] = JSON.parse(result.data as string);
                if (Array.isArray(obj) && obj.length == 1) {
                    UserCache.set(obj[0]);
                    return obj[0];
                }

            }
        } catch (err) {
            console.error(err);
        }
    }


    export const report = (id: string) => getSupabase().then(client => client.rpc("report", { id }));


    export async function getFriendRequests(ts: Date) {
        const username = await _Auth.username();

        if (!username) throw "User need to be signed in";

        const isoDate = ts.toISOString();

        const response = await FBFunctions.call("getFriends", { ts: isoDate });

        const data: any[] = JSON.parse(response.data as string);

        const _users: _User[] = [];
        if (Array.isArray(data)) {
            for (let f of data) {

                const [first, second]: string[] = f.id.split('-');

                const isFirst = first === username;
                const _getUser = () => {
                    return getUsers(
                        isFirst ? second : first
                    )
                }
                const user = (await _getUser()) as _User;
                const getStatus = () => {

                    switch (f.s) {
                        case 0:
                            return isFirst ? FriendStatus.requested : FriendStatus.pending
                        case 1:
                            return FriendStatus.friend
                        case 2:
                            return isFirst ? FriendStatus.requested : FriendStatus.pending

                        case -1:
                            if (isFirst) {

                            } else {

                            }
                        case -2:
                            if (isFirst) {

                            } else {
                                local;
                            }
                        default:
                            return FriendStatus.none
                    }
                }

                _users.push(user);
            }
        } else {
            throw "failed to get friend requests" + data
        }
        return _users;
    }
}

export namespace CDN {
    export async function uploadFile(buffer: Uint8Array | Blob, url: string, link: string, contentType?: string) {
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
}

export namespace ServerVotes {
    let votes: Vote[] = [];

    export const vote = async (vote: Vote) => {
        const index = votes.findIndex(e => e.id === vote.id);
        if (index == -1) {
            const _vote = await VotesStorage.get(vote.id);
            if (_vote == undefined) {
                votes.push(vote);
                await VotesStorage.put(vote);
            } else {
                if (_vote == vote.v) {
                    await VotesStorage.remove(vote.id)
                } else {
                    await VotesStorage.put(vote);
                }
            }
        } else {
            if (votes[index].v === vote.v) {
                votes.splice(index, 1);
            } else {
                votes[index] = vote;
            }
        }
    }

    export const getvotes = (ids: string[]) => getSupabase().then(client => client.rpc("getvotes", {
        ids,
    }).then(res => res.data as number[]))


    export const flushVotes = async () => {
        const username = _Auth.username();
        const jwt = await _Auth.getJwt();
        if (!(await username) || !jwt) return;

        const client = await getSupabase();
        client.functions.invoke("vote", {
            headers: {
                jwt,
                "Access-Control-Allow-Headers": "*"
            },
            body: JSON.stringify(votes)
        })
        votes.length = 0;
    }
}