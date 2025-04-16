import { User } from "firebase/auth";
import { FullUser } from "../protos/user";
export declare namespace AuthHandler {
    function deleteAccount(): Promise<void>;
    function createUser(email: string, password: string): Promise<import("@firebase/auth").UserCredential>;
    function currentUser(): import("vanjs-core").State<User>;
    function currentUsername(): import("vanjs-core").State<string>;
    function getAuth(): import("@firebase/auth").Auth;
    function sendVerificationMail(user: User): Promise<void>;
    function signIn(email: string, link: string): Promise<User>;
    function sendSignInLink(email: string, thirdPartyDynamicLink?: string): Promise<void>;
    function signOut(): Promise<void>;
    function signUp(user: FullUser, pfpUrl?: string | undefined): Promise<void>;
    function getToken(forceRefresh?: boolean): Promise<string>;
    function getUsername(currentUser?: User | null): Promise<string>;
    function linkPassword(password: string): Promise<void>;
    function sendResetPasswordMail(email: string): Promise<void>;
    function changePassword(newPassword: string): Promise<void>;
    function confirmResettingPassword(newPassword: string, oobCode: string): Promise<void>;
    function signInWithPassword(email: string, password: string): Promise<void>;
    function changeEmail(newEmail: string): Promise<string>;
}
