import { io } from 'socket.io-client';

// In development, the backend is on port 5000 (usually proxied, but socket.io client handles the origin better if explicitly specified in dev)
const URL = import.meta.env.PROD ? undefined : 'http://localhost:5000';

export const socket = io(URL, {
    autoConnect: false, // We will manually connect when ChatScreen mounts
    withCredentials: true
});
