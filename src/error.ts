import { createDeflate } from "zlib";

type ErrorConstructor<T extends Error> = new (...args: any[]) => T;

export function createError<T extends string, E extends Error>(
  name: T,
  defaultMessage?: string,
): ErrorConstructor<Error & { name: T }> {
  return class extends Error {
    name = name as T;
    constructor(msg?: string) {
      super(msg || defaultMessage);
      Object.setPrototypeOf(this, new.target.prototype);
    }
  } as any;
}

export const ServerInternalError = createError(
  "ServerInternal",
  "Something Went Wrong",
);

export const BadRequestError = createError("BadRequestError", "Bad Request");

export const NotFoundError = createError(
  "NotFound",
  "Couldn't find what you are looking for",
);

export const NotAuthorizedError = createError(
  "NotAuthorized",
  "You are not permitted for this operation",
);

export const UnexpectedStatusError = createError(
  "UnexpectedStatus",
  "Unexpected Status Code receieved",
);
export const ConflictStatusError = createError(
  "Conflict",
  "Conflict with an existing resource",
);

export function throwStatusError(status: number, text: string): never {
  if (status == 500) {
    throw new ServerInternalError(text);
  }

  if (status == 400) {
    throw new BadRequestError(text);
  }

  if (status == 403) {
    throw new NotAuthorizedError(text);
  }

  if (status == 404) {
    throw new NotFoundError(text);
  }

  if (status == 409) {
    throw new ConflictStatusError(text);
  }

  throw new UnexpectedStatusError(`[${status}] ${text}`);
}
