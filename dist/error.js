"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.ConflictStatusError = exports.UnexpectedStatusError = exports.NotAuthorizedError = exports.NotFoundError = exports.BadRequestError = exports.ServerInternalError = void 0;
exports.createError = createError;
exports.throwStatusError = throwStatusError;
function createError(name, defaultMessage) {
    return class extends Error {
        name = name;
        constructor(msg) {
            super(msg || defaultMessage);
            Object.setPrototypeOf(this, new.target.prototype);
        }
    };
}
exports.ServerInternalError = createError("ServerInternal", "Something Went Wrong");
exports.BadRequestError = createError("BadRequestError", "Bad Request");
exports.NotFoundError = createError("NotFound", "Couldn't find what you are looking for");
exports.NotAuthorizedError = createError("NotAuthorized", "You are not permitted for this operation");
exports.UnexpectedStatusError = createError("UnexpectedStatus", "Unexpected Status Code receieved");
exports.ConflictStatusError = createError("Conflict", "Conflict with an existing resource");
function throwStatusError(status, text) {
    if (status == 500) {
        throw new exports.ServerInternalError(text);
    }
    if (status == 400) {
        throw new exports.BadRequestError(text);
    }
    if (status == 403) {
        throw new exports.NotAuthorizedError(text);
    }
    if (status == 404) {
        throw new exports.NotFoundError(text);
    }
    if (status == 409) {
        throw new exports.ConflictStatusError(text);
    }
    throw new exports.UnexpectedStatusError(`[${status}] ${text}`);
}
