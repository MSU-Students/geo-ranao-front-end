import axios from 'axios';

// NestJS's ValidationPipe puts the real reason a request was rejected in
// response.data.message (a string, or an array of one per failed field) —
// axios's own err.message is just "Request failed with status code 400",
// which tells the user nothing about what to fix. Shared here since
// stores/auth.ts and stores/admin.ts each used to duplicate this.
export function extractErrorMessage(err: unknown, fallback: string): string {
  if (axios.isAxiosError(err)) {
    const data = err.response?.data as { message?: string | string[] } | undefined;
    const msg = data?.message;
    if (Array.isArray(msg)) return msg.join(', ');
    if (typeof msg === 'string') return msg;
  }
  return fallback;
}
