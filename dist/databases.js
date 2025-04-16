"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.LupydDatabasesElement = exports.POSTS_DB_STORE_NAME = exports.SEARCH_DB_STORE_NAME = exports.VOTES_DB_STORE_NAME = exports.LOCAL_DB_VERSION = exports.LOCAL_DB_NAME = exports.CHAT_DB_VERSION = exports.CHAT_DB_STORE_NAME = exports.CHAT_DB_NAME = void 0;
exports.clearEverything = clearEverything;
const id128_1 = require("id128");
const idb_1 = require("idb");
const store2_1 = require("store2");
exports.CHAT_DB_NAME = "chats";
exports.CHAT_DB_STORE_NAME = "defaultChatMessages";
exports.CHAT_DB_VERSION = 1;
exports.LOCAL_DB_NAME = "local";
exports.LOCAL_DB_VERSION = 5;
exports.VOTES_DB_STORE_NAME = "votes";
exports.SEARCH_DB_STORE_NAME = "search";
exports.POSTS_DB_STORE_NAME = "posts";
class LupydDatabasesElement extends HTMLElement {
    loadingError;
    chatDb;
    localDb;
    constructor() {
        super();
        this.openDatabases();
    }
    async openDatabases() {
        try {
            this.chatDb = await (0, idb_1.openDB)(exports.CHAT_DB_NAME, exports.CHAT_DB_VERSION, {
                blocked(currentVersion, blockedVersion, event) {
                    console.error(`blocked db open cV: ${currentVersion} bV: ${blockedVersion}`, event);
                },
                upgrade(database, oldVersion, newVersion, transaction, event) {
                    console.log(`upgrade `, database, ` oldVersion: ${oldVersion} newVersion: ${newVersion} transaction: `, transaction, ` event `, event);
                    const store = database.createObjectStore(exports.CHAT_DB_STORE_NAME, {
                        keyPath: "msgId",
                    });
                    store.createIndex("other", "other");
                },
                blocking(currentVersion, blockedVersion, event) {
                    console.warn(`blocking db cv: ${currentVersion} bv: ${blockedVersion} `, event);
                },
                terminated() {
                    console.log(`Terminated db chats`);
                },
            });
            this.localDb = await (0, idb_1.openDB)(exports.LOCAL_DB_NAME, exports.LOCAL_DB_VERSION, {
                blocked(currentVersion, blockedVersion, event) {
                    console.error(`blocked db open cV: ${currentVersion} bV: ${blockedVersion}`, event);
                },
                upgrade(database, oldVersion, newVersion, transaction, event) {
                    console.log(`upgrade `, database, ` oldVersion: ${oldVersion} newVersion: ${newVersion} transaction: `, transaction, ` event `, event);
                    for (const store of Array.from(database.objectStoreNames)) {
                        database.deleteObjectStore(store);
                    }
                    const searchStore = database.createObjectStore(exports.SEARCH_DB_STORE_NAME);
                    const votesStore = database.createObjectStore(exports.VOTES_DB_STORE_NAME);
                    const postsStore = database.createObjectStore(exports.POSTS_DB_STORE_NAME);
                    postsStore.createIndex("userIndex", "by");
                },
                blocking(currentVersion, blockedVersion, event) {
                    console.warn(`blocking db cv: ${currentVersion} bv: ${blockedVersion} `, event);
                },
                terminated() {
                    console.log(`Terminated local database`);
                },
            });
            this.dispatchEvent(new CustomEvent("DatabasesOpened"));
        }
        catch (err) {
            this.dispatchEvent(new CustomEvent("error", { detail: err }));
            this.loadingError = err;
        }
        if (this.localDb) {
            const tx = this.localDb.transaction(exports.POSTS_DB_STORE_NAME, "readwrite");
            const oldTime = new Date();
            oldTime.setDate(oldTime.getDate() - 7);
            const oldKey = id128_1.Ulid.generate({ time: oldTime }).toCanonical();
            for await (const postId of tx.store) {
                if (postId.key && postId.key.toString() < oldKey) {
                    await tx.store.delete(postId.key);
                }
                else {
                    break;
                }
            }
            await tx.done;
        }
    }
    isLoaded() {
        return this.chatDb != null && this.localDb != null;
    }
    waitTillDatabasesOpen() {
        if (this.loadingError) {
            throw this.loadingError;
        }
        if (this.isLoaded()) {
            return;
        }
        return new Promise((res, rej) => {
            this.addEventListener("DatabasesOpened", (_) => {
                res(0);
            });
            this.addEventListener("error", (err) => rej(err));
        });
    }
    async clearDatabases() {
        if (this.chatDb)
            await clearDatabase(this.chatDb);
        if (this.localDb)
            await clearDatabase(this.localDb);
    }
}
exports.LupydDatabasesElement = LupydDatabasesElement;
async function clearDatabase(db) {
    for (const storeName in db.objectStoreNames) {
        await db.clear(storeName);
    }
}
async function clearEverything() {
    store2_1.default.clearAll();
    const dbs = await indexedDB.databases();
    for (const db of dbs) {
        if (db.name) {
            await (0, idb_1.deleteDB)(db.name);
        }
    }
}
customElements.define("lupyd-databases", LupydDatabasesElement);
