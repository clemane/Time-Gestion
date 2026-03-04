export interface User {
  id: string;
  email: string;
  displayName: string;
  avatarUrl: string | null;
  partnerId: string | null;
  createdAt: string;
}

export interface CreateUserDto {
  email: string;
  password: string;
  displayName: string;
}

export interface LoginDto {
  email: string;
  password: string;
}

export interface AuthResponse {
  accessToken: string;
  user: User;
}
