"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.fbElement = exports.LupydFirebaseElement = exports.FUNCTIONS_REGION = void 0;
const app_1 = require("firebase/app");
const auth_1 = require("firebase/auth");
const vanjs_core_1 = require("vanjs-core");
const auth_2 = require("./auth");
const user_1 = require("../doc/user");
const store2_1 = require("store2");
require("../constants");
const constants_1 = require("../constants");
exports.FUNCTIONS_REGION = "asia-south1";
// A Singleton Model designed by the Modern Web Standard
class LupydFirebaseElement extends HTMLElement {
    app;
    auth;
    currentUser = vanjs_core_1.default.state(null);
    currentUsername = vanjs_core_1.default.state(null);
    constants = {
        MAX_TOTAL_FILES_SIZE: constants_1.MAX_TOTAL_FILES_SIZE,
        DEFAULT_USER_ICON: constants_1.DEFAULT_USER_ICON,
        API_URL: constants_1.API_URL,
        API_CDN_URL: constants_1.API_CDN_URL,
        CDN_STORAGE: constants_1.CDN_STORAGE,
        CREATE_USER_FUNC_URL: constants_1.CREATE_USER_FUNC_URL,
        FIRESTORE_BASE_URL: constants_1.FIRESTORE_BASE_URL,
        MOBILE_MAX_WIDTH_PX: constants_1.MOBILE_MAX_WIDTH_PX,
        CREATE_USER_CHAT_FUNC_URL: constants_1.CREATE_USER_CHAT_FUNC_URL,
        LUPYD_VERSION: constants_1.LUPYD_VERSION,
        FIREBASE_CONFIG: constants_1.FIREBASE_CONFIG,
    };
    constructor() {
        super();
        this.app = (0, app_1.initializeApp)(constants_1.FIREBASE_CONFIG);
        this.auth = (0, auth_1.initializeAuth)(this.app, {
            persistence: auth_1.browserLocalPersistence,
        });
        this.initializeAuth();
        if (process.env.JS_ENV_EMULATOR_MODE == "true") {
            (0, auth_1.connectAuthEmulator)(this.auth, "http://127.0.0.1:9099", {
                disableWarnings: true,
            });
            console.log("Using Firebase Auth emulator");
            Promise.resolve().then(() => require("firebase/database")).then(({ connectDatabaseEmulator, getDatabase }) => {
                connectDatabaseEmulator(getDatabase(this.app), "127.0.0.1", 9000);
                console.log("Using firebase database emulator");
            });
        }
    }
    initializeAuth() {
        (0, auth_1.onAuthStateChanged)(this.auth, (user) => {
            console.log(`Auth State Changed: `, user);
            this.currentUser.val = user;
            if (user) {
                if (user.email) {
                    store2_1.default.set("email", user.email);
                }
                auth_2.AuthHandler.getUsername(user).then((username) => {
                    if (username) {
                        (0, user_1.getUserData)().then(console.log).catch(console.error);
                        store2_1.default.set("username", username);
                        this.currentUsername.val = username;
                    }
                });
            }
        });
    }
}
exports.LupydFirebaseElement = LupydFirebaseElement;
customElements.define("lupyd-firebase", LupydFirebaseElement);
const fbElement = () => document.querySelector("lupyd-firebase");
exports.fbElement = fbElement;
