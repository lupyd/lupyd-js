"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.local = exports.Prefs = exports.VotesStorage = exports.UserCache = exports.MessageStorage = void 0;
const database_1 = require("firebase/database");
const auth_1 = require("../firebase/auth");
const firebaseUrls_1 = require("../firebase/firebaseUrls");
const friendRequest_1 = require("../models/friendRequest");
const server_1 = require("./server");
const getObjectStore = (dbName, options) => new Promise((res, rej) => {
    const req = indexedDB.open(dbName);
    req.onsuccess = _ => res(req.result.transaction(dbName, "readwrite").objectStore(dbName));
    req.onupgradeneeded = _ => res(req.result.createObjectStore(dbName, options));
    req.onerror = rej;
});
class MessageStorage {
    // readonly id: string;
    id;
    // private db: IDBDatabase | undefined;
    get store() {
        return getObjectStore(this.id, {
            keyPath: "id"
        });
    }
    constructor(storeId) {
        this.id = storeId;
    }
    put(msg) {
        return new Promise((res, rej) => {
            this.store.then(store => {
                const req = store.put(msg, msg.id);
                req.onsuccess = _ => res(req.result);
                req.onerror = rej;
            });
        });
    }
    getLast(limit, from) {
        return new Promise((res, rej) => {
            this.store.then(store => {
                if (limit) {
                    const req = store.openCursor(from, "prev");
                    req.onsuccess = _ => {
                        const cursor = req.result;
                        const messages = [];
                        while (messages.length < limit) {
                            try {
                                messages.push(cursor.value);
                                cursor.continue();
                            }
                            catch (_) {
                                break;
                            }
                        }
                        res(messages.reverse());
                    };
                    req.onerror = rej;
                }
                else {
                    const req = store.getAll();
                    req.onsuccess = _ => res((req.result ?? []));
                    req.onerror = rej;
                }
            });
        });
    }
    delete() {
        return new Promise((res, rej) => {
            const req = indexedDB.deleteDatabase(this.id);
            req.onsuccess = res;
            req.onerror = rej;
        });
    }
}
exports.MessageStorage = MessageStorage;
var UserCache;
(function (UserCache) {
    const dbName = "userCache";
    // {
    //     const req = indexedDB.open(dbName);
    //     req.onupgradeneeded = _ => store = req.result.createObjectStore(dbName);
    //     req.onsuccess = _ => store = req.result.transaction(dbName).objectStore(dbName);
    // }
    UserCache.get = (id) => getObjectStore(dbName).then(store => new Promise((res, rej) => {
        const req = store.get(id);
        req.onsuccess = _ => res(req.result);
        req.onerror = rej;
    }));
    UserCache.set = (_user, full = false) => getObjectStore(dbName).then(store => new Promise((res, rej) => {
        if (full || ("status" in _user && "last" in _user)) {
            const putReq = store.put(_user, _user.id);
            putReq.onsuccess = _ => res(_user);
            putReq.onerror = rej;
        }
        else {
            const req = store.get(_user.id);
            req.onsuccess = _ => {
                let oldData = req.result;
                let putReq;
                if (oldData) {
                    const newData = structuredClone(_user);
                    newData.status = oldData.status;
                    newData.last = oldData.last;
                    putReq = store.put(newData, _user.id);
                    putReq.onsuccess = _ => res(newData);
                }
                else {
                    putReq = store.put(_user, _user.id);
                    putReq.onsuccess = _ => res(_user);
                }
                putReq.onerror = rej;
            };
            req.onerror = rej;
        }
    }));
    UserCache.updateStatusAndLast = async (id, status, last) => {
        const oldData = await UserCache.get(id);
        if (oldData) {
            const newData = structuredClone(oldData);
            if (status)
                newData.status = status;
            if (last)
                newData.last = last;
            return UserCache.set(newData, true);
        }
        else {
            throw "no user found in cache";
        }
    };
    UserCache.pendingRequests = async () => {
        const store = await getObjectStore(dbName);
        const cursorReq = store.openCursor(null, "prev");
        cursorReq.onsuccess = _ => {
            const cursor = cursorReq.result;
            const pendingreqs = [];
            try {
                while (true) {
                    const _user = cursor.value;
                    if (_user.status === friendRequest_1.FriendStatus.pending || _user.status === friendRequest_1.FriendStatus.requested) {
                        pendingreqs.push(_user);
                    }
                    cursor.continue();
                }
            }
            catch (_) {
            }
            return pendingreqs;
        };
    };
    UserCache.knownUsers = async () => {
        return new Promise(async (res, rej) => {
            const req = await getObjectStore(dbName).then(_ => _.openCursor());
            req.onsuccess = _ => {
                const cursor = req.result;
                const _users = [];
                try {
                    while (true) {
                        const value = cursor.value;
                        if (value) {
                            if (value.status !== friendRequest_1.FriendStatus.none) {
                                _users.push(value);
                            }
                        }
                    }
                }
                catch (e) {
                }
                res(_users);
            };
        });
    };
    UserCache.syncDataBase = async () => {
        const username = await auth_1._Auth.username();
        const lastOnline = await Prefs.get("lastOnline");
        const { get, ref, getDatabase } = await (0, firebaseUrls_1.firebaseImport)("database");
        if (lastOnline) {
        }
        else {
            const snapshot = await get(ref(getDatabase(), `data/${username}`));
            if (snapshot.exists()) {
                const data = snapshot.val();
                const _users = data.users;
                if (_users) {
                    const setNewUsers = Object.entries(_users).map(async (entry) => {
                        const _user = await server_1.server.getUsers(entry[0]);
                        if (_user) {
                            const filledInUser = _user;
                            if (typeof entry[1] === "number") {
                                filledInUser.last = entry[1];
                                filledInUser.status = friendRequest_1.FriendStatus.friend;
                            }
                            else if (typeof entry[1] === "boolean") {
                                if (entry[1]) {
                                    filledInUser.status = friendRequest_1.FriendStatus.requested;
                                }
                                else {
                                    filledInUser.status = friendRequest_1.FriendStatus.follows;
                                }
                            }
                            return UserCache.set(filledInUser);
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
            }
            else {
            }
            (0, database_1.update)(snapshot.ref, {
                "LO": Date.now() //Last login/online
            });
        }
    };
})(UserCache || (exports.UserCache = UserCache = {}));
var VotesStorage;
(function (VotesStorage) {
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
    VotesStorage.get = (id) => getObjectStore(dbName).then(store => new Promise((res, rej) => {
        const req = store.get(id);
        req.onsuccess = _ => res(req.result);
        req.onerror = rej;
    }));
    VotesStorage.put = (vote) => getObjectStore(dbName).then(store => new Promise((res, rej) => {
        const req = store.put(vote.v, vote.id);
        req.onsuccess = _ => res(req.result);
        req.onerror = rej;
    }));
    VotesStorage.remove = (id) => getObjectStore(dbName).then(store => new Promise((res, rej) => {
        const req = store.delete(id);
        req.onerror = rej;
        req.onsuccess = res;
    }));
})(VotesStorage || (exports.VotesStorage = VotesStorage = {}));
var Prefs;
(function (Prefs) {
    let store;
    getObjectStore("prefs").then(_ => store = _);
    Prefs.put = (key, value) => new Promise((res, rej) => {
        const req = store.put(value, key);
        req.onerror = rej;
        req.onsuccess = _ => res(req.result);
    });
    Prefs.get = (key) => new Promise((res, rej) => {
        const req = store.get(key);
        req.onsuccess = _ => res(req.result);
        req.onerror = rej;
    });
})(Prefs || (exports.Prefs = Prefs = {}));
var local;
(function (local) {
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
    local.deleteFriend = (id, follows = false) => {
        UserCache.get(id).then(_user => {
            if (_user) {
                _user.status = follows ? friendRequest_1.FriendStatus.follows : friendRequest_1.FriendStatus.none;
                UserCache.set(_user);
            }
        });
        // getObjectStore(`chat/${id}`).then(_ => new MessageStorage(_).delete());
        indexedDB.deleteDatabase(`chat/${id}`);
    };
    local.syncDataBase = async () => {
        const username = await auth_1._Auth.username();
        if (!username)
            throw "no username";
        const lastFreqTime = await Prefs.get("lastFreqTs");
        const lastSyncTime = await Prefs.get("lastSyncTs");
        const lastOnline = await Prefs.get("lastOnline");
        const response = await (0, database_1.get)((0, database_1.ref)((0, database_1.getDatabase)(), `data/${username}/LST`));
        if (response.val()) {
            if (lastSyncTime && response.val() === lastSyncTime) {
            }
            else {
                const fullData = await (0, database_1.get)((0, database_1.ref)((0, database_1.getDatabase)(), `data/${username}`));
                // UserCache.updateAllUsersFromSnapshot(fullData);
            }
        }
    };
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
})(local || (exports.local = local = {}));
