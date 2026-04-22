import {  AuthApi } from "./sdk";

const basePath = 'http://localhost:3000';

const authApi = new AuthApi({
  basePath,
  isJsonMime: (contentType: string) => contentType === 'application/json',
  accessToken: () => localStorage.getItem('access_token') || '',
})

class AquaService {
  async login(username: string, password: string) {
    const response = await authApi.authControllerLogin({ username, password });
    localStorage.setItem('access_token', response.data.access_token);
    return response.data.access_token;
  }
  async getProfile() {
    const user = await authApi.authControllerGetProfile();
    return user.data;
  }
}

export const aquaService = new AquaService();
