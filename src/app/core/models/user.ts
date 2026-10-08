export type Role = 'admin' | 'agent' | 'viewer';
export type UserStatus = 'active' | 'invited' | 'disabled';

export interface User {
  id: string;
  name: string;
  email: string;
  role: Role;
  status: UserStatus;
  lastActiveAt: string | null;
}

export interface UserInput {
  name: string;
  email: string;
  role: Role;
  status: UserStatus;
}

export interface Session {
  token: string;
  user: User;
  organization: { id: string; name: string };
}
