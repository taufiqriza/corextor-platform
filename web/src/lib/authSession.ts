type InvalidationListener = () => void;

let accessToken: string | null = null;
let currentRole: string | null = null;
const invalidationListeners = new Set<InvalidationListener>();

export function getAccessToken() {
    return accessToken;
}

export function getCurrentRole() {
    return currentRole;
}

export function setSessionToken(token: string | null) {
    accessToken = token;
}

export function setSessionRole(role: string | null | undefined) {
    currentRole = role ?? null;
}

export function clearSessionState() {
    accessToken = null;
    currentRole = null;
}

export function invalidateSession() {
    clearSessionState();
    invalidationListeners.forEach(listener => listener());
}

export function onSessionInvalidated(listener: InvalidationListener) {
    invalidationListeners.add(listener);

    return () => {
        invalidationListeners.delete(listener);
    };
}
