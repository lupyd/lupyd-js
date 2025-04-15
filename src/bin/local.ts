
import { DataSnapshot, get, getDatabase, ref, update } from "firebase/database";
import { _Auth } from "../firebase/auth";
import { firebaseImport } from "../firebase/firebaseUrls";
import { FriendStatus } from "../models/friendRequest";
import { _User } from "../models/userModel";
import { MessageOptions } from "./messaging";
import { server } from "./server";

const getObjectStore = (dbName: string, options?: IDBObjectStoreParameters) => new Promise<IDBObjectStore>((res, rej) => {
    const req = indexedDB.open(dbName);
    req.onsuccess = _ =>
        res(req.result.transaction(dbName, "readwrite").objectStore(dbName));

    req.onupgradeneeded = _ =>
        res(req.result.createObjectStore(dbName, options));

    req.onerror = rej;
})


export class MessageStorage {
    // readonly id: string;
    private id: string;
    // private db: IDBDatabase | undefined;
    private get store() {
        return getObjectStore(this.id, {
            keyPath: "id"
        })
    }

    constructor(storeId: string) {
        this.id = storeId
    }

    put(msg: MessageOptions) {
        return new Promise<string>((res, rej) => {
            this.store.then(store => {
                const req = store.put(msg, msg.id);
                req.onsuccess = _ => res(req.result as string);
                req.onerror = rej;
            })
        })
    }

    getLast(limit?: number, from?: string) {

        return new Promise<MessageOptions[]>((res, rej) => {

            this.store.then(store => {
                if (limit) {

                    const req = store.openCursor(from, "prev");
                    req.onsuccess = _ => {
                        const cursor = req.result!;
                        const messages: MessageOptions[] = [];

                        while (messages.length < limit) {
                            try {
                                messages.push(cursor.value);
                                cursor.continue();
                            } catch (_) {
                                break;
                            }
                        }

                        res(messages.reverse());
                    }
                    req.onerror = rej;
                } else {
                    const req = store!.getAll();
                    req.onsuccess = _ => res((req.result ?? []) as MessageOptions[]);
                    req.onerror = rej;
                }
            })
        })
    }

    delete() {
        return new Promise((res, rej) => {
            const req = indexedDB.deleteDatabase(this.id);
            req.onsuccess = res;
            req.onerror = rej;
        })
    }

}

export namespace PrivateGroup {
    
}

export namespace GroupCache {

}

export namespace UserCache {
    const dbName = "userCache";
    // {
    //     const req = indexedDB.open(dbName);
    //     req.onupgradeneeded = _ => store = req.result.createObjectStore(dbName);
    //     req.onsuccess = _ => store = req.result.transaction(dbName).objectStore(dbName);
    // }
    export const get = (id: string): Promise<_User | undefined> => getObjectStore(dbName).then(store => new Promise((res, rej) => {
        const req = store!.get(id);
        req.onsuccess = _ => res(req.result);
        req.onerror = rej;
    }))


    export const set = (_user: _User, full = false) => getObjectStore(dbName).then(store => new Promise<_User>((res, rej) => {

        if (full || ("status" in _user && "last" in _user)) {
            const putReq = store.put(_user, _user.id);

            putReq.onsuccess = _ => res(_user);
            putReq.onerror = rej;
        } else {
            const req = store!.get(_user.id);
            req.onsuccess = _ => {
                let oldData: _User | undefined = req.result;
                let putReq: IDBRequest<IDBValidKey>;
                if (oldData) {
                    const newData = structuredClone(_user);
                    newData.status = oldData.status;
                    newData.last = oldData.last;

                    putReq = store.put(newData, _user.id);
                    putReq.onsuccess = _ => res(newData);
                } else {
                    putReq = store.put(_user, _user.id);
                    putReq.onsuccess = _ => res(_user);
                }
                putReq.onerror = rej;
            }
            req.onerror = rej;
        }
    }));

    export const updateStatusAndLast = async (id: string, status?: FriendStatus, last?: number) => {
        const oldData = await get(id);

        if (oldData) {
            const newData = structuredClone(oldData);
            if (status) newData.status = status;
            if (last) newData.last = last;
            return set(newData, true);
        } else {
            throw "no user found in cache"
        }
    }


    export const pendingRequests = async () => {
        const store = await getObjectStore(dbName);
        const cursorReq = store.openCursor(null, "prev");
        cursorReq.onsuccess = _ => {
            const cursor = cursorReq.result!;
            const pendingreqs: _User[] = [];
            try {
                while (true) {
                    const _user = cursor.value as _User;
                    if (_user.status === FriendStatus.pending || _user.status === FriendStatus.requested) {
                        pendingreqs.push(_user);
                    }
                    cursor.continue()
                }
            } catch (_) {
            }

            return pendingreqs;
        }
    }

    export const knownUsers = async () => {
        return new Promise<_User[]>(async (res, rej) => {

            const req = await getObjectStore(dbName).then(_ => _.openCursor());
            req.onsuccess = _ => {
                const cursor = req.result!;
                const _users: _User[] = [];
                try {
                    while (true) {
                        const value: _User | undefined = cursor.value;
                        if (value) {
                            if (value.status !== FriendStatus.none) {
                                _users.push(value);
                            }
                        }
                    }
                } catch (e) {

                }
                res(_users);
            }
        })
    }
    export const syncDataBase = async () => {
        const username = await _Auth.username();
        const lastOnline = await Prefs.get("lastOnline");
        const { get, ref, getDatabase } = await firebaseImport("database");
        if (lastOnline) {

        } else {
            const snapshot: DataSnapshot = await get(ref(getDatabase(), `data/${username}`));
            if (snapshot.exists()) {
                const data = snapshot.val();
                const _users = data.users;
                if (_users) {
                    const setNewUsers = Object.entries<boolean | number>(_users).map(async entry => {
                        const _user = await server.getUsers(entry[0]);
                        if (_user) {
                            const filledInUser = _user as _User;
                            if (typeof entry[1] === "number") {
                                filledInUser.last = entry[1];
                                filledInUser.status = FriendStatus.friend;
                            } else if (typeof entry[1] === "boolean") {
                                if (entry[1]) {
                                    filledInUser.status = FriendStatus.requested;
                                } else {
                                    filledInUser.status = FriendStatus.follows;
                                }
                            }
                            return set(filledInUser);
                        }
                    });

                    await Promise.all(setNewUsers);
                }
                const _grps = data._grps;
                if (_grps) {

                }
                const grps = data.grps;
                if (grps) {

                }

            } else {
            }
            update(snapshot.ref, {
                "LO": Date.now() //Last login/online
            })
        }
    }

}

export namespace VotesStorage {
    const dbName = "votes";
    // const req = indexedDB.open(dbName);
    // let store: IDBObjectStore;
    // req.onsuccess = _ => {
    //     store = req.result.transaction(dbName).objectStore(dbName);
    // }
    // req.onupgradeneeded = _ => {
    //     store = req.result.createObjectStore(dbName);
    // }
    // let store: IDBObjectStore;
    // getObjectStore("votes").then(_ => store = _);

    export const get = (id: string) => getObjectStore(dbName).then(store => new Promise<boolean | undefined>((res, rej) => {
        const req = store.get(id);
        req.onsuccess = _ => res(req.result);
        req.onerror = rej;
    }));

    export const put = (vote: Vote) => getObjectStore(dbName).then(store => new Promise<string>((res, rej) => {
        const req = store.put(vote.v, vote.id);
        req.onsuccess = _ => res(req.result as string);
        req.onerror = rej;
    }));

    export const remove = (id: string) => getObjectStore(dbName).then(store => new Promise((res, rej) => {
        const req = store.delete(id);
        req.onerror = rej;
        req.onsuccess = res;
    }))
}

export namespace Prefs {

    let store: IDBObjectStore;

    getObjectStore("prefs").then(_ => store = _);
    export const put = (key: string, value: any) => new Promise((res, rej) => {
        const req = store.put(value, key);

        req.onerror = rej;
        req.onsuccess = _ => res(req.result);
    })
    export const get = (key: string) => new Promise<any>((res, rej) => {
        const req = store.get(key);

        req.onsuccess = _ => res(req.result);

        req.onerror = rej;
    })
}

export namespace local {

    // export namespace DB {
    //     let _prefs: IDBObjectStore;
    //     let _votes: IDBObjectStore;
    //     {
    //         let _db: IDBDatabase;
    //         const request = indexedDB.open("main");

    //         request.onupgradeneeded = _ => {
    //             _db = request.result;
    //             _prefs = _db.createObjectStore("prefs");
    //             _votes = _db.createObjectStore("votes", { keyPath: "id" });
    //         }

    //         request.onsuccess = _ => {
    //             // console.log("indexed db success")
    //             _db = request.result;
    //             _prefs = _db.transaction("prefs", "readwrite").objectStore("prefs");
    //             _votes = _db.transaction("votes", "readwrite").objectStore("votes");

    //         }
    //     }

    //     const getput = <T>(store: IDBObjectStore, key: string, value?: T) => new Promise<string | T | undefined>((res, rej) => {
    //         const request = value === undefined ? store.get(key) : store.put(value, key);
    //         request.onsuccess = _ => res(request.result)
    //         request.onerror = rej;
    //     });



    //     export const prefs = <T>(key: string, value?: T) => getput(_prefs, key, value);
    //     export const votes = (key: string, value?: Vote) => getput(_votes, key, value);

    //     export const deleteEverything = () => indexedDB.databases().then(_ => _.forEach(e => indexedDB.deleteDatabase(e.name!)));

    // }


    export const deleteFriend = (id: string, follows = false) => {
        UserCache.get(id).then(_user => {
            if (_user) {
                _user.status = follows ? FriendStatus.follows : FriendStatus.none
                UserCache.set(_user);
            }
        });
        // getObjectStore(`chat/${id}`).then(_ => new MessageStorage(_).delete());
        indexedDB.deleteDatabase(`chat/${id}`);
    }



    export const syncDataBase = async () => {
        const username = await _Auth.username();

        if (!username) throw "no username";
        const lastFreqTime: number = await Prefs.get("lastFreqTs");
        const lastSyncTime: number = await Prefs.get("lastSyncTs");
        const lastOnline: number = await Prefs.get("lastOnline");

        const response = await get(ref(getDatabase(), `data/${username}/LST`))
        if (response.val()) {
            if (lastSyncTime && response.val() === lastSyncTime) {

            } else {
                const fullData = await get(ref(getDatabase(), `data/${username}`));

                // UserCache.updateAllUsersFromSnapshot(fullData);
            }
        }
    }

    // export const test = () => {
    //     // indexedDB.deleteDatabase("prefs");


    //     const request = indexedDB.open("prefs");
    //     request.onsuccess = e => {
    //         console.log("success")
    //         const store = request.result.transaction("prefs", "readwrite").objectStore("prefs");
    //         { const _ = store.get("hello"); _.onsuccess = e => console.log("read ", _.result) }
    //     }

    //     request.onupgradeneeded = e => {
    //         console.log("upgrading indexed db ", e, request);
    //     }

    // }

    // export namespace Prefs {

    //     const request = indexedDB.open("")
    // }


    // export async function isNsfwAllowed() {
    //     return localStorage.getItem("showNsfw") == "1" ? true : false
    // }

    // export function postsDb() {
    //     const request = indexedDB.open("posts", 1);

    //     request.onupgradeneeded = e => {
    //         request.result.createObjectStore("posts", {
    //             keyPath: "id"
    //         })
    //     }

    //     request.onsuccess = e => {
    //         const db = request.result;
    //         db.transaction("posts");

    //     }
    // }

}

export interface Vote {
    id: string,
    v: boolean
}