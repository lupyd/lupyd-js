type ErrorConstructor<T extends Error> = new (...args: any[]) => T;
export declare function createError<T extends string, E extends Error>(name: T, defaultMessage?: string): ErrorConstructor<Error & {
    name: T;
}>;
export declare const ServerInternalError: ErrorConstructor<Error & {
    name: "ServerInternal";
}>;
export declare const BadRequestError: ErrorConstructor<Error & {
    name: "BadRequestError";
}>;
export declare const NotFoundError: ErrorConstructor<Error & {
    name: "NotFound";
}>;
export declare const NotAuthorizedError: ErrorConstructor<Error & {
    name: "NotAuthorized";
}>;
export declare const UnexpectedStatusError: ErrorConstructor<Error & {
    name: "UnexpectedStatus";
}>;
export declare const ConflictStatusError: ErrorConstructor<Error & {
    name: "Conflict";
}>;
export declare function throwStatusError(status: number, text: string): never;
export {};
