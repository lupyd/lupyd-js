import { FirebaseApp, FirebaseOptions } from "firebase/app";
import { User, Auth as FirebaseAuth } from "firebase/auth";
import "../constants";
import { State } from "vanjs-core";
export declare const FUNCTIONS_REGION = "asia-south1";
export declare class LupydFirebaseElement {
    app: FirebaseApp;
    auth: FirebaseAuth;
    currentUser: State<User | null>;
    currentUsername: State<string | null>;
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
    };
    onAuthStateChange: (username: string, user: User) => void;
    constructor(config: FirebaseOptions, onAuthStateChange?: (username: string, user: User) => void);
    setOnAuthStateChangeCallback(onAuthStateChange: (username: string, user: User) => void): void;
    initializeAuth(): void;
}
export declare const fbElement: () => LupydFirebaseElement;
