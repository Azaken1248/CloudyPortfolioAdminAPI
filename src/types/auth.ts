import type { Request } from 'express';

export interface JwtPayload {
  discordId: string;
  username: string;
  avatar: string | null;
  role: 'admin';
}

export interface AuthenticatedRequest extends Request {
  user: JwtPayload;
}

export interface DiscordTokenResponse {
  access_token: string;
  token_type: string;
  expires_in: number;
  refresh_token: string;
  scope: string;
}

export interface DiscordUser {
  id: string;
  username: string;
  avatar: string | null;
  discriminator: string;
  global_name: string | null;
}
