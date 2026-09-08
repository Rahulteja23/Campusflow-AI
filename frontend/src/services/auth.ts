import api from './api';
import type { User } from '../types';

export interface LoginResponse {
  access_token: string;
  token_type: string;
  user: User;
}

export async function login(email: string, password: string): Promise<LoginResponse> {
  const { data } = await api.post<LoginResponse>('/api/auth/login', { email, password });
  localStorage.setItem('cf_token', data.access_token);
  localStorage.setItem('cf_user', JSON.stringify(data.user));
  return data;
}

export function logout() {
  localStorage.removeItem('cf_token');
  localStorage.removeItem('cf_user');
}

export function getStoredUser(): User | null {
  try {
    const stored = localStorage.getItem('cf_user');
    return stored ? JSON.parse(stored) : null;
  } catch {
    return null;
  }
}

export function getStoredToken(): string | null {
  return localStorage.getItem('cf_token');
}

export async function getCurrentUser(): Promise<User> {
  const { data } = await api.get<User>('/api/auth/me');
  return data;
}
