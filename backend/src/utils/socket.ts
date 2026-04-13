import { Server } from 'socket.io';

let io: Server | null = null;

export function initSocket(server: any) {
  io = new Server(server, {
    cors: {
      origin: process.env.CORS_ALLOWED_ORIGINS?.split(',') || '*',
      credentials: true,
    },
  });
}

export function emitNotification(event: string, data: any) {
  if (io) {
    io.emit(event, data);
  }
}
