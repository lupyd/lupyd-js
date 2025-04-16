import { Vote } from "./local";
export declare namespace server {
    function getUsers(username: string, like?: boolean, forcedRefresh?: boolean): Promise<any>;
    const report: (id: string) => any;
    function getFriendRequests(ts: Date): Promise<_User[]>;
}
export declare namespace CDN {
    function uploadFile(buffer: Uint8Array | Blob, url: string, link: string, contentType?: string): Promise<Response>;
}
export declare namespace ServerVotes {
    const vote: (vote: Vote) => Promise<void>;
    const getvotes: (ids: string[]) => any;
    const flushVotes: () => Promise<void>;
}
