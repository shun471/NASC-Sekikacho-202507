export function createSocket() {
    const url = process.env.NEXT_PUBLIC_WS_URL ?? 'ws://localhost:3000';
    return new WebSocket(url);
}