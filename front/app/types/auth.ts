export interface UserAuthRequest {
  email: string;
  password: string;
}

export interface AccessTokenResponse {
  access_token: string;
  token_type: string;
}

export interface UserResponse {
  id: string;
  email: string;
  created_at: string;
}
