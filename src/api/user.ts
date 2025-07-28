import { UserProtos } from "..";
import { getAuthHandler } from "../auth/auth";
import { isValidUsername } from "../bin/utils";
import { UpdateUserInfo, User, Users } from "../protos/user";

// Define the enum outside any class to avoid TypeScript syntax errors
enum UserRelationTypes {
  follow,
  unfollow,
  block,
  unblock,
}

// API configuration class
class ApiConfig {
  private readonly apiUrl: string;
  private readonly apiCdnUrl: string;

  constructor(apiUrl: string, apiCdnUrl: string) {
    this.apiUrl = apiUrl;
    this.apiCdnUrl = apiCdnUrl;
  }

  getApiUrl(): string {
    return this.apiUrl;
  }

  getApiCdnUrl(): string {
    return this.apiCdnUrl;
  }
}

// User service class
class UserService {
  private readonly apiConfig: ApiConfig;

  constructor(apiConfig: ApiConfig) {
    this.apiConfig = apiConfig;
  }

  async getUsers(username: string): Promise<User[]> {
    const users: User[] = [];
    if (username.length <= 1) {
      console.error(new Error("Invalid Username"));
      return users;
    }

    const token = await getAuthHandler()?.getToken();
    const response = await fetch(`${this.apiConfig.getApiUrl()}/user/${username}*`, {
      headers: token !== null ? { Authorization: `Bearer ${token}` } : undefined,
    });
    
    if (response.status === 200) {
      const body = await response.arrayBuffer();
      return Users.decode(new Uint8Array(body)).users;
    }

    return users;
  }

  async getUser(username: string): Promise<User | undefined> {
    if (!isValidUsername(username)) {
      console.error(new Error("Invalid Username"));
      return undefined;
    }

    const token = await getAuthHandler()?.getToken();
    const response = await fetch(`${this.apiConfig.getApiUrl()}/user/${username}`, {
      headers: token !== null ? { Authorization: `Bearer ${token}` } : undefined,
    });
    
    if (response.status === 200) {
      const body = await response.arrayBuffer();
      return User.decode(new Uint8Array(body));
    }
    return undefined;
  }

  async getUsersByUsername(usernames: string[]): Promise<User[]> {
    const users: User[] = [];
    if (usernames.some((e) => !isValidUsername(e))) {
      console.error(new Error("Invalid Username"));
      return users;
    }

    const token = await getAuthHandler()?.getToken();
    const response = await fetch(
      `${this.apiConfig.getApiUrl()}/user?users=${encodeURIComponent(usernames.join(","))}`,
      {
        headers: token !== null ? { Authorization: `Bearer ${token}` } : undefined,
      },
    );
    
    if (response.status === 200) {
      const body = await response.arrayBuffer();
      return Users.decode(new Uint8Array(body)).users;
    }

    return users;
  }

  async updateUser(info: UpdateUserInfo): Promise<void> {
    const token = await getAuthHandler()?.getToken();
    if (!token) {
      throw new Error(`User is not fully signed in`);
    }

    const response = await fetch(`${this.apiConfig.getApiUrl()}/user`, {
      method: "PUT",
      body: UpdateUserInfo.encode(info).finish(),
      headers: {
        "content-type": "application/protobuf; proto=lupyd.user.UpdateUserInfo",
        authorization: `Bearer ${token}`,
      },
    });

    if (response.status !== 200) {
      console.error(
        `Failed to update user ${response.status} ${await response.text()}`,
      );
    }
  }

  async updateUserProfilePicture(blob: Blob): Promise<void> {
    const token = await getAuthHandler()?.getToken();
    if (!token) {
      throw new Error(`User is not fully signed in`);
    }

    const response = await fetch(`${this.apiConfig.getApiCdnUrl()}/user`, {
      method: "PUT",
      body: blob,
      headers: {
        authorization: `Bearer ${token}`,
      },
    });
    
    if (response.status !== 200) {
      console.error(
        `Failed to update user profile ${response.status} ${await response.text()}`,
      );
    }
  }

  async deleteUserProfilePicture(): Promise<void> {
    const token = await getAuthHandler()?.getToken();
    if (!token) {
      throw new Error(`User is not fully signed in`);
    }

    const response = await fetch(`${this.apiConfig.getApiCdnUrl()}/user`, {
      method: "DELETE",
      headers: {
        authorization: `Bearer ${token}`,
      },
    });
    
    if (response.status !== 200) {
      console.error(
        `Failed to update user profile ${response.status} ${await response.text()}`,
      );
    }
  }
}

// User relations state class - separated from service to avoid nesting issues
class UserRelationsState {
  private followedUsers: Set<string> = new Set();
  private blockedUsers: Set<string> = new Set();
  private relationService: UserRelationsService;
  private onUpdateCallback: (followedUsers: string[], blockedUsers: string[]) => void;

  constructor(
    relationService: UserRelationsService,
    onUpdate: (followed: string[], blocked: string[]) => void
  ) {
    this.relationService = relationService;
    this.onUpdateCallback = onUpdate;
  }

  async refresh(): Promise<void> {
    const relations = await this.relationService.getUserRelations();
    this.fromRelations(relations);
    this.callUpdate();
  }

  private fromRelations(relations: UserProtos.Relations): void {
    this.followedUsers.clear();
    this.blockedUsers.clear();

    for (const relation of relations.relations) {
      if (relation.relation) {
        this.followedUsers.add(relation.uname);
      } else {
        this.blockedUsers.add(relation.uname);
      }
    }
  }

  private callUpdate(): void {
    this.onUpdateCallback([...this.followedUsers], [...this.blockedUsers]);
  }

  async blockUser(username: string): Promise<void> {
    await this.relationService.updateUserRelation(username, UserRelationTypes.block);
    this.followedUsers.delete(username);
    this.blockedUsers.add(username);
    this.callUpdate();
  }

  async unblockUser(username: string): Promise<void> {
    await this.relationService.updateUserRelation(username, UserRelationTypes.unblock);
    this.blockedUsers.delete(username);
    this.callUpdate();
  }

  async followUser(username: string): Promise<void> {
    await this.relationService.updateUserRelation(username, UserRelationTypes.follow);
    this.followedUsers.add(username);
    this.blockedUsers.delete(username);
    this.callUpdate();
  }

  async unfollowUser(username: string): Promise<void> {
    await this.relationService.updateUserRelation(username, UserRelationTypes.unfollow);
    this.followedUsers.delete(username);
    this.callUpdate();
  }

  getFollowedUsers(): string[] {
    return [...this.followedUsers];
  }

  getBlockedUsers(): string[] {
    return [...this.blockedUsers];
  }
}

// User relations service class
class UserRelationsService {
  private readonly apiConfig: ApiConfig;

  constructor(apiConfig: ApiConfig) {
    this.apiConfig = apiConfig;
  }

  // Helper method to convert enum to string
  relationToString(relation: UserRelationTypes): string {
    switch (relation) {
      case UserRelationTypes.follow:
        return "follow";
      case UserRelationTypes.unfollow:
        return "unfollow";
      case UserRelationTypes.block:
        return "block";
      case UserRelationTypes.unblock:
        return "unblock";
    }
  }

  async getUserRelations(): Promise<UserProtos.Relations> {
    if (!(await getAuthHandler()?.getUsername())) {
      throw new Error("User haven't completed their sign in setup");
    }

    const token = await getAuthHandler()?.getToken();
    const response = await fetch(`${this.apiConfig.getApiUrl()}/relations`, {
      headers: {
        authorization: `Bearer ${token}`,
      },
    });

    if (response.status !== 200) {
      throw new Error(
        `received invalid status ${response.status}, text: ${await response.text()}`,
      );
    }

    return UserProtos.Relations.decode(
      new Uint8Array(await response.arrayBuffer()),
    );
  }

  async updateUserRelation(username: string, relation: UserRelationTypes): Promise<void> {
    if (!(await getAuthHandler()?.getUsername())) {
      throw new Error("User haven't completed their sign in setup");
    }

    const token = await getAuthHandler()?.getToken();
    const response = await fetch(
      `${this.apiConfig.getApiUrl()}/relation?user=${username}&relation=${this.relationToString(relation)}`,
      {
        method: "PUT",
        headers: { authorization: `Bearer ${token}` },
      },
    );

    if (response.status !== 200) {
      throw new Error(await response.text());
    }
  }

  // Factory method for creating UserRelationsState instances
  createRelationsState(onUpdate: (followed: string[], blocked: string[]) => void): UserRelationsState {
    return new UserRelationsState(this, onUpdate);
  }
}

// Export a factory function to create service instances
export function createUserServices(apiUrl: string, apiCdnUrl: string) {
  const apiConfig = new ApiConfig(apiUrl, apiCdnUrl);
  const userService = new UserService(apiConfig);
  const userRelationsService = new UserRelationsService(apiConfig);
  
  return {
    userService,
    userRelationsService,
    // Export the enum for external use
    UserRelationTypes
  };
}

// For backward compatibility
export { UserRelationTypes };
