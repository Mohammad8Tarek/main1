
import { User, Building, Floor, Room, Employee, Assignment, MaintenanceRequest, ActivityLog, Reservation, Hosting } from '../types';

const API_BASE_URL = '/api/v1';

const getAuthToken = () => {
    return localStorage.getItem('token') || sessionStorage.getItem('token');
};

const apiRequest = async <T>(endpoint: string, options: RequestInit = {}): Promise<T> => {
    const token = getAuthToken();
    const headers = new Headers(options.headers || {});
    if (!(options.body instanceof FormData)) {
        headers.set('Content-Type', 'application/json');
    }
    
    if (token) {
        headers.set('Authorization', `Bearer ${token}`);
    }

    try {
        const response = await fetch(`${API_BASE_URL}${endpoint}`, {
            ...options,
            headers,
            credentials: 'include', // Ensures cookies/auth headers are sent with CORS requests
        });

        if (!response.ok) {
            let errorData;
            try {
                errorData = await response.json();
            } catch (e) {
                // If the response is not JSON, use the status text
                throw new Error(response.statusText || 'An unknown error occurred');
            }
            // Use the message from the backend error response
            throw new Error(errorData.message || 'An API error occurred');
        }
        
        if (response.status === 204) { // No Content
            return null as T;
        }

        const result = await response.json();
        return result.data as T;

    } catch (error: any) {
        console.error(`API request to ${endpoint} failed:`, error);
        // Specifically check for network errors and provide a better message
        if (error instanceof TypeError && error.message === 'Failed to fetch') {
            throw new Error('Network error: Could not connect to the server. Please check the connection.');
        }
        throw error; // Re-throw other errors
    }
};

// --- API Service Factory ---
const createApiService = <T extends { id: number | string }>(resourceName: string) => {
    return {
        getAll: (): Promise<T[]> => apiRequest<T[]>(`/${resourceName}`),
        getById: (id: number | string): Promise<T> => apiRequest<T>(`/${resourceName}/${id}`),
        create: (data: Partial<Omit<T, 'id'>>): Promise<T> => apiRequest<T>(`/${resourceName}`, {
            method: 'POST',
            body: JSON.stringify(data),
        }),
        update: (id: number | string, data: Partial<Omit<T, 'id'>>): Promise<T> => apiRequest<T>(`/${resourceName}/${id}`, {
            method: 'PATCH',
            body: JSON.stringify(data),
        }),
        delete: (id: number | string): Promise<void> => apiRequest<void>(`/${resourceName}/${id}`, {
            method: 'DELETE',
        }),
    };
};

// --- Activity Log ---
// Activity logging is now handled by the backend.
export const activityLogApi = createApiService<ActivityLog>('activity-log');

// --- Auth ---
export const authApi = {
    login: async ({ username, password }: { username: string, password: string }): Promise<{ user: User, token: string }> => {
        const result = await apiRequest<{ user: User; tokens: { accessToken: string } }>('/auth/login', {
            method: 'POST',
            body: JSON.stringify({ username, password }),
        });
        return { user: result.user, token: result.tokens.accessToken };
    }
};

// --- Custom User API ---
// FIX: Override create and update to allow for a password property, which is not in the User type but needed for API calls.
const userApi = {
    ...createApiService<User>('users'),
    create: (data: Partial<Omit<User, 'id'>> & { password?: string }): Promise<User> => apiRequest<User>(`/users`, {
        method: 'POST',
        body: JSON.stringify(data),
    }),
    update: (id: number | string, data: Partial<Omit<User, 'id'>> & { password?: string }): Promise<User> => apiRequest<User>(`/users/${id}`, {
        method: 'PATCH',
        body: JSON.stringify(data),
    }),
    changePassword: async ({ userId, currentPassword, newPassword }: { userId: number | string, currentPassword?: string, newPassword: string }): Promise<void> => {
        return apiRequest<void>(`/users/${userId}/change-password`, {
            method: 'POST',
            body: JSON.stringify({ currentPassword, newPassword }),
        });
    },
};

// --- System Settings ---
const systemSettingsApi = {
    getSettings: async (): Promise<{ [key: string]: string }> => {
        return apiRequest<{ [key: string]: string }>('/system-settings');
    },
    updateSettings: async (settings: { [key: string]: string }): Promise<void> => {
        return apiRequest<void>('/system-settings', {
            method: 'PUT',
            body: JSON.stringify(settings),
        });
    }
};


// --- Export APIs ---
export { userApi, systemSettingsApi };
export const buildingApi = createApiService<Building>('buildings');
export const floorApi = createApiService<Floor>('floors');
export const roomApi = createApiService<Room>('rooms');
export const employeeApi = createApiService<Employee>('employees');
export const assignmentApi = {
    ...createApiService<Assignment>('assignments'),
    checkout: async (id: number | string, checkOutDate: string): Promise<Assignment> => {
        return apiRequest(`/assignments/${id}/checkout`, {
            method: 'PATCH',
            body: JSON.stringify({ checkOutDate })
        });
    }
};
export const maintenanceApi = createApiService<MaintenanceRequest>('maintenance');
export const reservationApi = createApiService<Reservation>('reservations');
export const hostingApi = createApiService<Hosting>('hostings');

// Dummy functions to prevent crashes in components that might still import them.
export const initDb = async () => Promise.resolve();
export const resetDatabase = async () => Promise.resolve();