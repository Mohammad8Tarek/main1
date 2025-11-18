
import { User, Building, Floor, Room, Employee, Assignment, MaintenanceRequest, ActivityLog, Reservation, Hosting } from '../types';

// Using 127.0.0.1 explicitly to avoid localhost IPv6 resolution issues in Node 17+ environments
const API_BASE_URL = 'http://127.0.0.1:5001/api/v1';

const API_TIMEOUT = 15000; // 15 seconds

const getAuthToken = () => {
    return localStorage.getItem('token') || sessionStorage.getItem('token');
};

const apiFetch = async (endpoint: string, options: RequestInit = {}) => {
    const controller = new AbortController();
    const timeoutId = setTimeout(() => controller.abort(), API_TIMEOUT);

    try {
        const token = getAuthToken();
        const headers = new Headers({ 'Content-Type': 'application/json' });
        if (options.headers) {
            new Headers(options.headers).forEach((val, key) => headers.set(key, val));
        }
        if (token) {
            headers.set('Authorization', `Bearer ${token}`);
        }

        // Ensure endpoint starts with /
        const safeEndpoint = endpoint.startsWith('/') ? endpoint : `/${endpoint}`;
        const url = `${API_BASE_URL}${safeEndpoint}`;
        
        const response = await fetch(url, {
            ...options,
            headers,
            signal: controller.signal,
        });
        clearTimeout(timeoutId);

        if (response.status === 401) {
            window.dispatchEvent(new Event('auth-error'));
            const errorData = await response.json().catch(() => ({ message: 'Unauthorized' }));
            throw new Error(errorData.message || 'Unauthorized');
        }

        if (!response.ok) {
            const contentType = response.headers.get("content-type");
            if (contentType && contentType.includes("application/json")) {
                let errorData;
                try {
                    errorData = await response.json();
                } catch (e) {
                    throw new Error(`API Error ${response.status}: Server returned invalid JSON.`);
                }
                throw new Error(errorData.message || `API request failed with status ${response.status}`);
            } else {
                // If response is not JSON (e.g. HTML 404/500 from server), read text to debug
                const errorText = await response.text().catch(() => 'No response body');
                console.error(`API Error (${response.status}) at ${url}:`, errorText.substring(0, 500)); 
                throw new Error(`API Error: ${response.status} ${response.statusText || 'Unknown Error'}`);
            }
        }

        if (response.status === 204 || response.headers.get('content-length') === '0') {
            return null;
        }

        const responseData = await response.json();
        if (responseData && typeof responseData === 'object' && 'success' in responseData && responseData.success === false) {
            throw new Error(responseData.message || 'API request failed');
        }

        // Support both { data: ... } wrapper and direct response
        return responseData.data !== undefined ? responseData.data : responseData;

    } catch (error: any) {
        clearTimeout(timeoutId);
        if (error.name === 'AbortError') {
            throw new Error('API request timed out. Please check your internet connection or server status.');
        }
        if (error.message === 'Failed to fetch') {
            console.error(`Connection failed to ${API_BASE_URL}.`, error);
            throw new Error(`Network error: Unable to connect to the server at ${API_BASE_URL}. Ensure the backend is running on port 5001.`);
        }
        throw error;
    }
};


// --- Auth ---
export const authApi = {
    login: async (credentials: { identifier: string, password: string }): Promise<{ user: User, tokens: { accessToken: string, refreshToken: string } }> => {
        return apiFetch('/auth/login', {
            method: 'POST',
            body: JSON.stringify(credentials),
        });
    },
    logout: async (refreshToken: string): Promise<void> => {
        try {
            await apiFetch('/auth/logout', {
                method: 'POST',
                body: JSON.stringify({ refreshToken }),
            });
        } catch (error) {
            console.error('Logout API call failed, but logging out client-side anyway.', error);
        }
    },
};

// --- API Service Factory ---
const createApiService = <T extends { id: string | number }>(resource: string) => {
    const endpoint = `/${resource}`;
    return {
        getAll: (): Promise<T[]> => apiFetch(endpoint),
        getById: (id: string | number): Promise<T> => apiFetch(`${endpoint}/${id}`),
        create: (data: Partial<Omit<T, 'id'>>): Promise<T> => apiFetch(endpoint, {
            method: 'POST',
            body: JSON.stringify(data),
        }),
        update: (id: string | number, data: Partial<Omit<T, 'id'>>): Promise<T> => apiFetch(`${endpoint}/${id}`, {
            method: 'PATCH',
            body: JSON.stringify(data),
        }),
        delete: (id: string | number): Promise<void> => apiFetch(`${endpoint}/${id}`, {
            method: 'DELETE',
        }),
    };
};

// --- APIs ---
const baseUserApi = createApiService<User>('users');
export const userApi = {
    ...baseUserApi,
    update: (id: string, data: Partial<Omit<User, 'id'>> & { password?: string }): Promise<User> => apiFetch(`/users/${id}`, {
        method: 'PATCH',
        body: JSON.stringify(data),
    }),
    changePassword: ({ currentPassword, newPassword }: { currentPassword: string, newPassword: string }): Promise<void> => {
        return apiFetch('/users/me/change-password', {
            method: 'PATCH',
            body: JSON.stringify({ currentPassword, newPassword }),
        });
    },
};

export const logActivity = (username: string, action: string): Promise<ActivityLog> => {
    return apiFetch('/activity-log', {
        method: 'POST',
        body: JSON.stringify({ username, action }),
    });
};

export const activityLogApi = createApiService<ActivityLog>('activity-log');
export const buildingApi = createApiService<Building>('buildings');
export const floorApi = createApiService<Floor>('floors');
export const roomApi = createApiService<Room>('rooms');
export const employeeApi = createApiService<Employee>('employees');
export const assignmentApi = {
    ...createApiService<Assignment>('assignments'),
    checkout: (id: string, checkOutDate?: string): Promise<Assignment> => apiFetch(`/assignments/${id}/checkout`, {
        method: 'PATCH',
        body: JSON.stringify({ checkOutDate })
    }),
};
export const maintenanceApi = createApiService<MaintenanceRequest>('maintenance');
export const reservationApi = createApiService<Reservation>('reservations');
export const hostingApi = createApiService<Hosting>('hostings');

export const systemSettingsApi = {
    getSettings: (): Promise<{ [key: string]: string }> => apiFetch('/settings'),
    updateSettings: (settings: { [key: string]: string }): Promise<void> => apiFetch('/settings', {
        method: 'PATCH',
        body: JSON.stringify(settings),
    }),
};

// --- Mock/Deprecated Functions (kept for compatibility if needed) ---
export const initDb = () => Promise.resolve();
export const resetDatabase = () => Promise.resolve();
