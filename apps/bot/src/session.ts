// A simple in-memory session tracker.
// In a larger application, this might use Redis or another store.

interface Participant {
    id: string;
    username: string;
    lastSeen: number;
}

const channelSessions: Map<string, Participant[]> = new Map();
const SESSION_TIMEOUT = 1000 * 60 * 15; // 15 minutes

export function trackMessage(channelId: string, userId: string, username: string) {
    if (!channelSessions.has(channelId)) {
        channelSessions.set(channelId, []);
    }

    const now = Date.now();
    let participants = channelSessions.get(channelId)!;

    // Filter out timed-out users
    participants = participants.filter(p => (now - p.lastSeen) < SESSION_TIMEOUT);

    const existingUser = participants.find(p => p.id === userId);
    if (existingUser) {
        existingUser.lastSeen = now;
    } else {
        participants.push({ id: userId, username, lastSeen: now });
    }
    channelSessions.set(channelId, participants);
}

export function getParticipants(channelId: string): Participant[] {
    const now = Date.now();
    if (!channelSessions.has(channelId)) {
        return [];
    }
    // Clean up on read
    const participants = channelSessions.get(channelId)!.filter(p => (now - p.lastSeen) < SESSION_TIMEOUT);
    channelSessions.set(channelId, participants);
    return participants;
}

export function isUserTracked(channelId: string, userId: string): boolean {
    if (!channelSessions.has(channelId)) return false;
    return channelSessions.get(channelId)!.some(p => p.id === userId);
}
