// SkyBooker - API Client with JWT Authentication

const API_BASE = '/api';
const TOKEN_KEY = 'airbooking_jwt_token';
const USER_KEY = 'airbooking_user_data';

const api = {
    getToken() {
        return localStorage.getItem(TOKEN_KEY);
    },

    setAuth(token, userData) {
        localStorage.setItem(TOKEN_KEY, token);
        localStorage.setItem(USER_KEY, JSON.stringify(userData));
    },

    clearAuth() {
        localStorage.removeItem(TOKEN_KEY);
        localStorage.removeItem(USER_KEY);
    },

    getCurrentUser() {
        const userStr = localStorage.getItem(USER_KEY);
        try {
            return userStr ? JSON.parse(userStr) : null;
        } catch (e) {
            return null;
        }
    },

    isAuthenticated() {
        return !!this.getToken();
    },

    isAdmin() {
        const user = this.getCurrentUser();
        return user && user.role === 'ROLE_ADMIN';
    },

    async request(endpoint, options = {}) {
        const url = `${API_BASE}${endpoint}`;
        const headers = {
            'Content-Type': 'application/json',
            ...(options.headers || {})
        };

        const token = this.getToken();
        if (token) {
            headers['Authorization'] = `Bearer ${token}`;
        }

        const config = {
            ...options,
            headers
        };

        try {
            const response = await fetch(url, config);

            if (response.status === 401) {
                // Token expired or unauthorized
                this.clearAuth();
                window.dispatchEvent(new CustomEvent('auth-changed'));
            }

            const data = await response.json();

            if (!response.ok || (data.hasOwnProperty('success') && !data.success)) {
                let message = data.message || `Request failed (${response.status})`;
                if (data.data && typeof data.data === 'object' && !Array.isArray(data.data)) {
                    const validationMessages = Object.values(data.data).filter(v => typeof v === 'string');
                    if (validationMessages.length > 0) {
                        message = validationMessages.join(' | ');
                    }
                }
                throw new Error(message);
            }

            return data.data !== undefined ? data.data : data;
        } catch (error) {
            console.error(`API Error on ${endpoint}:`, error);
            throw error;
        }
    },

    // Auth endpoints
    async login(username, password) {
        const data = await this.request('/auth/login', {
            method: 'POST',
            body: JSON.stringify({ username, password })
        });
        this.setAuth(data.token, {
            id: data.id,
            username: data.username,
            email: data.email,
            fullName: data.fullName,
            phone: data.phone || '',
            role: data.role
        });
        window.dispatchEvent(new CustomEvent('auth-changed'));
        return data;
    },

    async register(registerData) {
        const data = await this.request('/auth/register', {
            method: 'POST',
            body: JSON.stringify(registerData)
        });
        this.setAuth(data.token, {
            id: data.id,
            username: data.username,
            email: data.email,
            fullName: data.fullName,
            phone: data.phone || registerData.phone || '',
            role: data.role
        });
        window.dispatchEvent(new CustomEvent('auth-changed'));
        return data;
    },

    async getMe() {
        return await this.request('/auth/me');
    },

    // Flights
    async getFlights(source = '', destination = '', date = '') {
        const params = new URLSearchParams();
        if (source) params.append('source', source);
        if (destination) params.append('destination', destination);
        if (date) params.append('date', date);

        const qs = params.toString();
        return await this.request(`/flights${qs ? '?' + qs : ''}`);
    },

    async getFlightById(id) {
        return await this.request(`/flights/${id}`);
    },

    // Bookings
    async bookFlight(bookingData) {
        return await this.request('/bookings', {
            method: 'POST',
            body: JSON.stringify(bookingData)
        });
    },

    async getMyBookings() {
        return await this.request('/bookings/my');
    },

    async getBookingById(id) {
        return await this.request(`/bookings/${id}`);
    },

    async getBookingByTicket(ticketNumber) {
        return await this.request(`/bookings/ticket/${ticketNumber}`);
    },

    async cancelBooking(id) {
        return await this.request(`/bookings/${id}/cancel`, {
            method: 'POST'
        });
    },

    // Admin endpoints
    async adminGetStats() {
        return await this.request('/admin/stats');
    },

    async adminGetAllBookings() {
        return await this.request('/admin/bookings');
    },

    async adminCreateFlight(flightData) {
        return await this.request('/admin/flights', {
            method: 'POST',
            body: JSON.stringify(flightData)
        });
    },

    async adminUpdateFlight(id, flightData) {
        return await this.request(`/admin/flights/${id}`, {
            method: 'PUT',
            body: JSON.stringify(flightData)
        });
    },

    async adminDeleteFlight(id) {
        return await this.request(`/admin/flights/${id}`, {
            method: 'DELETE'
        });
    },

    async adminCancelBooking(id) {
        return await this.request(`/admin/bookings/${id}/cancel`, {
            method: 'POST'
        });
    }
};

window.api = api;
