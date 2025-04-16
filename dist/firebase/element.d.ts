import { FirebaseApp } from "firebase/app";
import { User, Auth as FirebaseAuth } from "firebase/auth";
import "../constants";
export declare const FUNCTIONS_REGION = "asia-south1";
export declare class LupydFirebaseElement extends HTMLElement {
    app: FirebaseApp;
    auth: FirebaseAuth;
    currentUser: import("vanjs-core").State<User>;
    currentUsername: import("vanjs-core").State<string>;
    constants: {
        MAX_TOTAL_FILES_SIZE: number;
        DEFAULT_USER_ICON: string;
        API_URL: string;
        API_CDN_URL: string;
        CDN_STORAGE: string;
        CREATE_USER_FUNC_URL: string;
        FIRESTORE_BASE_URL: string;
        MOBILE_MAX_WIDTH_PX: number;
        CREATE_USER_CHAT_FUNC_URL: string;
        LUPYD_VERSION: string;
        FIREBASE_CONFIG: any;
    };
    constructor();
    initializeAuth(): void;
}
export declare const fbElement: () => LupydFirebaseElement;
