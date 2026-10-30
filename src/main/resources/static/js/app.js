// SkyBooker - Main Application Logic

let selectedFlightForBooking = null;
let currentEditingFlightId = null;

// Initialize app when DOM is ready
document.addEventListener('DOMContentLoaded', () => {
    initAuthUI();
    initNavigation();
    initSearchForm();
    initModals();
    loadFlights();

    // Listen to auth changes
    window.addEventListener('auth-changed', () => {
        initAuthUI();
        // If logged in and on my-bookings view, refresh it
        const currentView = document.querySelector('.view-section.active');
        if (currentView && currentView.id === 'my-bookings-view') {
            loadMyBookings();
        } else if (currentView && currentView.id === 'admin-view') {
            if (api.isAdmin()) {
                loadAdminDashboard();
            } else {
                switchView('flights-view');
            }
        }
    });
});

// Toast notification helper
function showToast(message, type = 'success') {
    const container = document.getElementById('toast-container');
    const toast = document.createElement('div');
    toast.className = `toast toast-${type}`;
    toast.innerHTML = `<span>${type === 'success' ? '✓' : 'ℹ'}</span> <span>${message}</span>`;
    container.appendChild(toast);

    setTimeout(() => {
        toast.style.opacity = '0';
        toast.style.transition = 'opacity 0.3s ease';
        setTimeout(() => toast.remove(), 300);
    }, 3500);
}

// Navigation & Views
function initNavigation() {
    document.querySelectorAll('[data-view-target]').forEach(btn => {
        btn.addEventListener('click', (e) => {
            e.preventDefault();
            const target = btn.getAttribute('data-view-target');
            switchView(target);
        });
    });

    // Admin sub-tabs
    document.querySelectorAll('.admin-tabs .tab-btn').forEach(btn => {
        btn.addEventListener('click', () => {
            document.querySelectorAll('.admin-tabs .tab-btn').forEach(b => b.classList.remove('active'));
            btn.classList.add('active');

            const tab = btn.getAttribute('data-admin-tab');
            document.getElementById('admin-flights-tab').style.display = tab === 'flights' ? 'block' : 'none';
            document.getElementById('admin-bookings-tab').style.display = tab === 'bookings' ? 'block' : 'none';
        });
    });
}

function switchView(viewId) {
    // Check permission for admin view
    if (viewId === 'admin-view' && !api.isAdmin()) {
        showToast('Admin access required', 'error');
        openAuthModal('login');
        return;
    }

    // Check auth for my bookings view
    if (viewId === 'my-bookings-view' && !api.isAuthenticated()) {
        showToast('Please log in to view your bookings', 'info');
        openAuthModal('login');
        return;
    }

    document.querySelectorAll('.view-section').forEach(section => {
        section.classList.remove('active');
    });

    const activeSection = document.getElementById(viewId);
    if (activeSection) {
        activeSection.classList.add('active');
    }

    // Update nav links
    document.querySelectorAll('.nav-btn').forEach(btn => {
        if (btn.getAttribute('data-view-target') === viewId) {
            btn.classList.add('active');
        } else {
            btn.classList.remove('active');
        }
    });

    // Load data specific to view
    if (viewId === 'flights-view') {
        loadFlights();
    } else if (viewId === 'my-bookings-view') {
        loadMyBookings();
    } else if (viewId === 'admin-view') {
        loadAdminDashboard();
    }

    window.scrollTo({ top: 0, behavior: 'smooth' });
}

// Authentication UI & State
function initAuthUI() {
    const isAuth = api.isAuthenticated();
    const isAdmin = api.isAdmin();
    const user = api.getCurrentUser();

    const loggedOutNav = document.getElementById('nav-logged-out');
    const loggedInNav = document.getElementById('nav-logged-in');
    const myBookingsNav = document.getElementById('nav-my-bookings-btn');
    const adminNav = document.getElementById('nav-admin-btn');
    const userNameDisplay = document.getElementById('user-full-name');
    const userRoleBadge = document.getElementById('user-role-badge');

    if (isAuth && user) {
        loggedOutNav.style.display = 'none';
        loggedInNav.style.display = 'flex';
        myBookingsNav.style.display = 'inline-flex';
        userNameDisplay.textContent = user.fullName || user.username;

        if (isAdmin) {
            adminNav.style.display = 'inline-flex';
            userRoleBadge.textContent = 'Admin';
            userRoleBadge.className = 'role-tag admin';
        } else {
            adminNav.style.display = 'none';
            userRoleBadge.textContent = 'User';
            userRoleBadge.className = 'role-tag';
        }
    } else {
        loggedOutNav.style.display = 'flex';
        loggedInNav.style.display = 'none';
        myBookingsNav.style.display = 'none';
        adminNav.style.display = 'none';
    }

    // Logout button handler
    const logoutBtn = document.getElementById('logout-btn');
    if (logoutBtn) {
        logoutBtn.onclick = () => {
            api.clearAuth();
            showToast('Logged out successfully', 'info');
            window.dispatchEvent(new CustomEvent('auth-changed'));
            switchView('flights-view');
        };
    }
}

// Search Flights Form
function initSearchForm() {
    const form = document.getElementById('flight-search-form');
    if (form) {
        form.addEventListener('submit', (e) => {
            e.preventDefault();
            const source = document.getElementById('search-source').value.trim();
            const destination = document.getElementById('search-destination').value.trim();
            const date = document.getElementById('search-date').value;
            loadFlights(source, destination, date);
        });
    }

    // Reset button
    const resetBtn = document.getElementById('search-reset-btn');
    if (resetBtn) {
        resetBtn.addEventListener('click', () => {
            document.getElementById('search-source').value = '';
            document.getElementById('search-destination').value = '';
            document.getElementById('search-date').value = '';
            loadFlights();
        });
    }

    // Quick route chips
    document.querySelectorAll('.route-chip').forEach(chip => {
        chip.addEventListener('click', () => {
            const src = chip.getAttribute('data-src');
            const dest = chip.getAttribute('data-dest');
            document.getElementById('search-source').value = src;
            document.getElementById('search-destination').value = dest;
            loadFlights(src, dest, document.getElementById('search-date').value);
        });
    });
}

// Fetch & Render Flights
async function loadFlights(source = '', destination = '', date = '') {
    const listContainer = document.getElementById('flights-list-container');
    listContainer.innerHTML = '<div style="text-align: center; padding: 2rem; color: #64748b;">Loading available flights...</div>';

    try {
        const flights = await api.getFlights(source, destination, date);
        renderFlightsList(flights);
    } catch (error) {
        listContainer.innerHTML = `<div class="empty-state">
            <div class="empty-icon">⚠️</div>
            <div class="empty-text">Failed to load flights: ${error.message}</div>
            <button class="btn btn-outline btn-sm" onclick="loadFlights()">Retry</button>
        </div>`;
    }
}

function renderFlightsList(flights) {
    const listContainer = document.getElementById('flights-list-container');
    const countDisplay = document.getElementById('flights-count');

    if (countDisplay) {
        countDisplay.textContent = `${flights.length} flight${flights.length === 1 ? '' : 's'} available`;
    }

    if (!flights || flights.length === 0) {
        listContainer.innerHTML = `
            <div class="empty-state">
                <div class="empty-icon">✈️</div>
                <div class="empty-text">No flights found matching your criteria.</div>
                <button class="btn btn-primary btn-sm" onclick="document.getElementById('search-reset-btn').click()">View All Flights</button>
            </div>
        `;
        return;
    }

    listContainer.innerHTML = flights.map(flight => {
        const depTime = formatTime(flight.departureTime);
        const arrTime = formatTime(flight.arrivalTime);
        const depDate = formatDate(flight.departureTime);
        const isSoldOut = flight.availableSeats <= 0;
        const lowSeats = flight.availableSeats > 0 && flight.availableSeats <= 10;

        return `
            <div class="flight-card">
                <div class="airline-info">
                    <div class="airline-name">${escapeHtml(flight.airline)}</div>
                    <span class="flight-number">${escapeHtml(flight.flightNumber)}</span>
                </div>

                <div class="route-info">
                    <div class="time-city">
                        <div class="flight-time">${depTime}</div>
                        <div class="flight-city">${escapeHtml(flight.sourceCity)}</div>
                        <div class="flight-date-small">${depDate}</div>
                    </div>

                    <div class="flight-path">
                        <span class="flight-duration">${escapeHtml(flight.duration)}</span>
                        <div class="path-line"></div>
                        <span style="font-size: 0.7rem; color: #64748b;">Non-stop</span>
                    </div>

                    <div class="time-city">
                        <div class="flight-time">${arrTime}</div>
                        <div class="flight-city">${escapeHtml(flight.destinationCity)}</div>
                        <div class="flight-date-small">${formatDate(flight.arrivalTime)}</div>
                    </div>
                </div>

                <div class="price-book">
                    <div class="flight-price">₹${flight.price.toLocaleString('en-IN')}</div>
                    <div class="seats-badge ${lowSeats ? 'low' : ''}">
                        ${isSoldOut ? 'Sold Out' : `${flight.availableSeats} seats left`}
                    </div>
                    <button class="btn btn-primary btn-sm" 
                            ${isSoldOut ? 'disabled' : ''} 
                            onclick="handleBookClick(${flight.id})">
                        ${isSoldOut ? 'Unavailable' : 'Book Flight'}
                    </button>
                </div>
            </div>
        `;
    }).join('');
}

// Booking Flow
async function handleBookClick(flightId) {
    if (!api.isAuthenticated()) {
        showToast('Please log in or register to book a flight', 'info');
        openAuthModal('login');
        return;
    }

    try {
        const flight = await api.getFlightById(flightId);
        selectedFlightForBooking = flight;
        openBookingModal(flight);
    } catch (error) {
        showToast('Error loading flight details: ' + error.message, 'error');
    }
}

function openBookingModal(flight) {
    const user = api.getCurrentUser();

    // Populate summary strip
    document.getElementById('booking-modal-route').textContent = `${flight.sourceCity} → ${flight.destinationCity}`;
    document.getElementById('booking-modal-airline').textContent = `${flight.airline} (${flight.flightNumber}) • ${formatDate(flight.departureTime)} ${formatTime(flight.departureTime)}`;
    document.getElementById('booking-modal-price').textContent = `₹${flight.price.toLocaleString('en-IN')}`;

    // Populate passenger form defaults
    document.getElementById('passenger-name').value = user?.fullName || '';
    document.getElementById('passenger-email').value = user?.email || '';
    document.getElementById('passenger-phone').value = user?.phone || '';
    document.getElementById('passenger-age').value = '28';
    document.getElementById('passenger-seat').value = '';

    openModal('booking-modal');
}

// Initialize Modals and forms
function initModals() {
    // Close modal triggers
    document.querySelectorAll('[data-close-modal]').forEach(btn => {
        btn.addEventListener('click', () => {
            const modalId = btn.getAttribute('data-close-modal');
            closeModal(modalId);
        });
    });

    // Close when clicking outside modal content
    document.querySelectorAll('.modal-backdrop').forEach(backdrop => {
        backdrop.addEventListener('click', (e) => {
            if (e.target === backdrop) {
                backdrop.classList.remove('open');
            }
        });
    });

    // Auth modal trigger buttons
    document.getElementById('nav-login-btn')?.addEventListener('click', () => openAuthModal('login'));
    document.getElementById('nav-register-btn')?.addEventListener('click', () => openAuthModal('register'));

    // Auth tab switching
    document.querySelectorAll('.auth-tab').forEach(tab => {
        tab.addEventListener('click', () => {
            document.querySelectorAll('.auth-tab').forEach(t => t.classList.remove('active'));
            tab.classList.add('active');

            const isLogin = tab.getAttribute('data-auth-tab') === 'login';
            document.getElementById('login-form-container').style.display = isLogin ? 'block' : 'none';
            document.getElementById('register-form-container').style.display = isLogin ? 'none' : 'block';
        });
    });

    // Quick fill demo buttons
    document.getElementById('demo-admin-btn')?.addEventListener('click', () => {
        document.getElementById('login-username').value = 'admin';
        document.getElementById('login-password').value = 'admin123';
    });

    document.getElementById('demo-user-btn')?.addEventListener('click', () => {
        document.getElementById('login-username').value = 'john_doe';
        document.getElementById('login-password').value = 'password123';
    });

    // Login Form Submit
    document.getElementById('login-form')?.addEventListener('submit', async (e) => {
        e.preventDefault();
        const submitBtn = e.target.querySelector('button[type="submit"]');
        submitBtn.disabled = true;
        submitBtn.textContent = 'Logging in...';

        try {
            const username = document.getElementById('login-username').value.trim();
            const password = document.getElementById('login-password').value;
            const res = await api.login(username, password);

            closeModal('auth-modal');
            showToast(`Welcome back, ${res.fullName}!`);

            // If user had clicked book before logging in
            if (selectedFlightForBooking) {
                openBookingModal(selectedFlightForBooking);
            }
        } catch (error) {
            showToast(error.message, 'error');
        } finally {
            submitBtn.disabled = false;
            submitBtn.textContent = 'Login';
        }
    });

    // Real-Time Mobile Number Validation & Key Filtering
    setupPhoneInputValidation('reg-phone', 'reg-phone-error');
    setupPhoneInputValidation('passenger-phone', 'passenger-phone-error');

    // Register Form Submit
    document.getElementById('register-form')?.addEventListener('submit', async (e) => {
        e.preventDefault();
        const submitBtn = e.target.querySelector('button[type="submit"]');

        const fullNameInput = document.getElementById('reg-fullname');
        const usernameInput = document.getElementById('reg-username');
        const emailInput = document.getElementById('reg-email');
        const phoneInput = document.getElementById('reg-phone');
        const phoneErrorEl = document.getElementById('reg-phone-error');
        const passwordInput = document.getElementById('reg-password');

        const fullName = fullNameInput.value.trim();
        const username = usernameInput.value.trim();
        const email = emailInput.value.trim();
        const phone = phoneInput.value.trim();
        const password = passwordInput.value;

        // Mobile number validation
        const isPhoneValid = validatePhoneInputState(phoneInput, phoneErrorEl, true);
        if (!isPhoneValid) {
            phoneInput.focus();
            showToast(phoneErrorEl.textContent || 'Please enter a valid mobile number', 'error');
            return;
        }

        submitBtn.disabled = true;
        submitBtn.textContent = 'Creating account...';

        try {
            const data = {
                fullName,
                username,
                email,
                phone,
                password
            };

            const res = await api.register(data);
            closeModal('auth-modal');
            showToast(`Account created! Welcome, ${res.fullName}!`);

            if (selectedFlightForBooking) {
                openBookingModal(selectedFlightForBooking);
            }
        } catch (error) {
            showToast(error.message, 'error');
        } finally {
            submitBtn.disabled = false;
            submitBtn.textContent = 'Create Account';
        }
    });

    // Confirm Booking Submit
    document.getElementById('booking-form')?.addEventListener('submit', async (e) => {
        e.preventDefault();
        if (!selectedFlightForBooking) return;

        const passengerPhoneInput = document.getElementById('passenger-phone');
        const passengerPhoneErrorEl = document.getElementById('passenger-phone-error');
        const isPassengerPhoneValid = validatePhoneInputState(passengerPhoneInput, passengerPhoneErrorEl, true);
        if (!isPassengerPhoneValid) {
            passengerPhoneInput.focus();
            showToast(passengerPhoneErrorEl.textContent || 'Please enter a valid passenger mobile number', 'error');
            return;
        }

        const submitBtn = document.getElementById('confirm-booking-btn');
        submitBtn.disabled = true;
        submitBtn.textContent = 'Confirming...';

        const bookingData = {
            flightId: selectedFlightForBooking.id,
            passengerName: document.getElementById('passenger-name').value.trim(),
            passengerEmail: document.getElementById('passenger-email').value.trim(),
            passengerPhone: passengerPhoneInput.value.trim(),
            passengerAge: parseInt(document.getElementById('passenger-age').value, 10),
            seatNumber: document.getElementById('passenger-seat').value.trim() || null
        };

        try {
            const booking = await api.bookFlight(bookingData);
            closeModal('booking-modal');
            showTicketModal(booking, true);
            showToast('Flight booked successfully! Ticket confirmed.');
            loadFlights(); // refresh seat availability
        } catch (error) {
            showToast(error.message, 'error');
        } finally {
            submitBtn.disabled = false;
            submitBtn.textContent = 'Confirm & Book';
        }
    });

    // Admin Add/Edit Flight Form Submit
    document.getElementById('admin-flight-form')?.addEventListener('submit', async (e) => {
        e.preventDefault();
        const submitBtn = document.getElementById('save-flight-btn');
        submitBtn.disabled = true;
        submitBtn.textContent = 'Saving...';

        const flightData = {
            flightNumber: document.getElementById('flight-form-number').value.trim(),
            airline: document.getElementById('flight-form-airline').value.trim(),
            sourceCity: document.getElementById('flight-form-source').value.trim(),
            destinationCity: document.getElementById('flight-form-destination').value.trim(),
            departureTime: document.getElementById('flight-form-departure').value,
            arrivalTime: document.getElementById('flight-form-arrival').value,
            price: parseFloat(document.getElementById('flight-form-price').value),
            totalSeats: parseInt(document.getElementById('flight-form-seats').value, 10),
            status: document.getElementById('flight-form-status').value
        };

        try {
            if (currentEditingFlightId) {
                await api.adminUpdateFlight(currentEditingFlightId, flightData);
                showToast('Flight updated successfully');
            } else {
                await api.adminCreateFlight(flightData);
                showToast('New flight added successfully');
            }
            closeModal('admin-flight-modal');
            loadAdminDashboard();
        } catch (error) {
            showToast(error.message, 'error');
        } finally {
            submitBtn.disabled = false;
            submitBtn.textContent = 'Save Flight';
        }
    });
}

// Phone Number Real-Time Validation & Key Filtering
function setupPhoneInputValidation(inputId, errorId) {
    const input = document.getElementById(inputId);
    const errorEl = document.getElementById(errorId);
    if (!input) return;

    // Prevent typing non-phone characters (letters, special symbols)
    input.addEventListener('keydown', (e) => {
        const allowedKeys = ['Backspace', 'Delete', 'Tab', 'Escape', 'Enter', 'ArrowLeft', 'ArrowRight', 'ArrowUp', 'ArrowDown', 'Home', 'End'];
        if (allowedKeys.includes(e.key) || e.ctrlKey || e.metaKey || e.altKey) {
            return;
        }

        // Allow digits, space, hyphen
        if (/^[0-9\s-]$/.test(e.key)) {
            return;
        }

        // Allow '+' only at index 0 if not already present
        if (e.key === '+' && input.selectionStart === 0 && !input.value.includes('+')) {
            return;
        }

        // Block any letters or invalid characters
        e.preventDefault();
    });

    // Sanitize on input (e.g. if user pastes dirty text) and validate in real time
    input.addEventListener('input', () => {
        let val = input.value;
        const startsWithPlus = val.startsWith('+');
        val = val.replace(/[^\d\s-]/g, '');
        if (startsWithPlus) {
            val = '+' + val.replace(/^\+*/, '');
        }
        if (input.value !== val) {
            input.value = val;
        }
        validatePhoneInputState(input, errorEl, false);
    });

    input.addEventListener('blur', () => {
        validatePhoneInputState(input, errorEl, true);
    });
}

function validatePhoneInputState(input, errorEl, showIfEmpty = false) {
    if (!input) return false;
    const raw = input.value.trim();

    if (!raw) {
        if (showIfEmpty) {
            input.classList.add('is-invalid');
            input.classList.remove('is-valid');
            if (errorEl) {
                errorEl.textContent = 'Mobile number is required';
                errorEl.style.display = 'block';
            }
        } else {
            input.classList.remove('is-invalid', 'is-valid');
            if (errorEl) {
                errorEl.textContent = '';
                errorEl.style.display = 'none';
            }
        }
        return false;
    }

    if (/[a-zA-Z]/.test(raw)) {
        input.classList.add('is-invalid');
        input.classList.remove('is-valid');
        if (errorEl) {
            errorEl.textContent = 'Mobile number cannot contain letters';
            errorEl.style.display = 'block';
        }
        return false;
    }

    const digits = raw.replace(/\D/g, '');
    if (digits.length < 10) {
        input.classList.add('is-invalid');
        input.classList.remove('is-valid');
        if (errorEl) {
            errorEl.textContent = `Please enter at least 10 digits (${digits.length}/10)`;
            errorEl.style.display = 'block';
        }
        return false;
    }

    if (digits.length > 15) {
        input.classList.add('is-invalid');
        input.classList.remove('is-valid');
        if (errorEl) {
            errorEl.textContent = 'Mobile number cannot exceed 15 digits';
            errorEl.style.display = 'block';
        }
        return false;
    }

    const phoneRegex = /^(?:(?:\+?\d{1,3}[-\s]?)?[6-9](?:\d{9}|\d{4}[-\s]?\d{5}|\d{2}[-\s]?\d{3}[-\s]?\d{4})|(?:\+[1-9]\d{0,3}[-\s]?\d{7,12}))$/;
    if (!phoneRegex.test(raw)) {
        input.classList.add('is-invalid');
        input.classList.remove('is-valid');
        if (errorEl) {
            errorEl.textContent = 'Enter a valid 10-digit mobile number (e.g. +91 9876543210 or 9876543210)';
            errorEl.style.display = 'block';
        }
        return false;
    }

    input.classList.remove('is-invalid');
    input.classList.add('is-valid');
    if (errorEl) {
        errorEl.textContent = '';
        errorEl.style.display = 'none';
    }
    return true;
}

function openModal(modalId) {
    document.getElementById(modalId)?.classList.add('open');
}

function closeModal(modalId) {
    document.getElementById(modalId)?.classList.remove('open');
}

function openAuthModal(tab = 'login') {
    // Reset any previous validation indicators
    const phoneInput = document.getElementById('reg-phone');
    const phoneErrorEl = document.getElementById('reg-phone-error');
    if (phoneInput) phoneInput.classList.remove('is-invalid', 'is-valid');
    if (phoneErrorEl) {
        phoneErrorEl.style.display = 'none';
        phoneErrorEl.textContent = '';
    }

    openModal('auth-modal');
    const tabBtn = document.querySelector(`.auth-tab[data-auth-tab="${tab}"]`);
    if (tabBtn) tabBtn.click();
}

// Ticket Display Modal
function showTicketModal(booking, isNewBooking = false) {
    document.getElementById('ticket-modal-title').textContent = isNewBooking ? 'Booking Confirmed!' : 'Ticket Details';
    document.getElementById('ticket-number-val').textContent = booking.ticketNumber;
    document.getElementById('ticket-passenger-name').textContent = booking.passengerName;
    document.getElementById('ticket-passenger-contact').textContent = `${booking.passengerEmail} • ${booking.passengerPhone}`;
    document.getElementById('ticket-flight-info').textContent = `${booking.airline} (${booking.flightNumber})`;
    document.getElementById('ticket-route-info').textContent = `${booking.sourceCity} → ${booking.destinationCity}`;
    document.getElementById('ticket-departure-info').textContent = `${formatDate(booking.departureTime)} at ${formatTime(booking.departureTime)}`;
    document.getElementById('ticket-arrival-info').textContent = `${formatDate(booking.arrivalTime)} at ${formatTime(booking.arrivalTime)}`;
    document.getElementById('ticket-seat-info').textContent = booking.seatNumber || 'Auto-Assigned';
    document.getElementById('ticket-fare-info').textContent = `₹${booking.totalAmount.toLocaleString('en-IN')}`;
    document.getElementById('ticket-status-info').innerHTML = `<span class="badge badge-${booking.status === 'CONFIRMED' ? 'success' : 'danger'}">${booking.status}</span>`;
    document.getElementById('ticket-barcode-num').textContent = `* ${booking.ticketNumber} *`;

    openModal('ticket-modal');
}

// User's My Bookings List
async function loadMyBookings() {
    const tableBody = document.getElementById('my-bookings-table-body');
    tableBody.innerHTML = '<tr><td colspan="7" style="text-align: center; padding: 2rem; color: #64748b;">Loading your bookings...</td></tr>';

    try {
        const bookings = await api.getMyBookings();

        if (!bookings || bookings.length === 0) {
            tableBody.innerHTML = `
                <tr>
                    <td colspan="7" style="text-align: center; padding: 2.5rem;">
                        <div style="font-size: 1.1rem; color: #475569; margin-bottom: 0.5rem;">No bookings found yet.</div>
                        <button class="btn btn-primary btn-sm" onclick="switchView('flights-view')">Search & Book Flights</button>
                    </td>
                </tr>
            `;
            return;
        }

        tableBody.innerHTML = bookings.map(b => {
            const isConfirmed = b.status === 'CONFIRMED';
            return `
                <tr>
                    <td><span class="ticket-number">${escapeHtml(b.ticketNumber)}</span></td>
                    <td>
                        <strong>${escapeHtml(b.airline)}</strong><br>
                        <span style="font-size: 0.8rem; color: #64748b;">${escapeHtml(b.flightNumber)}</span>
                    </td>
                    <td>${escapeHtml(b.sourceCity)} → ${escapeHtml(b.destinationCity)}</td>
                    <td>${formatDate(b.departureTime)} ${formatTime(b.departureTime)}</td>
                    <td><strong>${escapeHtml(b.seatNumber || '-')}</strong></td>
                    <td><strong>₹${b.totalAmount.toLocaleString('en-IN')}</strong></td>
                    <td><span class="badge badge-${isConfirmed ? 'success' : 'danger'}">${b.status}</span></td>
                    <td>
                        <div style="display: flex; gap: 0.35rem;">
                            <button class="btn btn-outline btn-sm" onclick="viewTicketByNumber('${b.ticketNumber}')">View Ticket</button>
                            ${isConfirmed ? `
                                <button class="btn btn-danger-outline btn-sm" onclick="handleCancelBooking(${b.id})">Cancel</button>
                            ` : ''}
                        </div>
                    </td>
                </tr>
            `;
        }).join('');
    } catch (error) {
        tableBody.innerHTML = `<tr><td colspan="7" style="text-align: center; color: #ef4444; padding: 2rem;">Error: ${error.message}</td></tr>`;
    }
}

async function viewTicketByNumber(ticketNumber) {
    try {
        const booking = await api.getBookingByTicket(ticketNumber);
        showTicketModal(booking, false);
    } catch (error) {
        showToast('Error loading ticket: ' + error.message, 'error');
    }
}

async function handleCancelBooking(bookingId) {
    if (!confirm('Are you sure you want to cancel this booking? The seat will be released.')) {
        return;
    }

    try {
        await api.cancelBooking(bookingId);
        showToast('Booking cancelled successfully');
        loadMyBookings();
    } catch (error) {
        showToast('Failed to cancel booking: ' + error.message, 'error');
    }
}

// Admin Dashboard Functions
async function loadAdminDashboard() {
    loadAdminStats();
    loadAdminFlights();
    loadAdminBookings();
}

async function loadAdminStats() {
    try {
        const stats = await api.adminGetStats();
        document.getElementById('stat-total-flights').textContent = stats.totalFlights;
        document.getElementById('stat-active-flights').textContent = stats.activeFlights;
        document.getElementById('stat-total-bookings').textContent = stats.totalBookings;
        document.getElementById('stat-total-revenue').textContent = `₹${(stats.totalRevenue || 0).toLocaleString('en-IN')}`;
    } catch (error) {
        console.error('Failed to load stats:', error);
    }
}

async function loadAdminFlights() {
    const tableBody = document.getElementById('admin-flights-table-body');
    tableBody.innerHTML = '<tr><td colspan="8" style="text-align: center; padding: 1.5rem; color: #64748b;">Loading flights...</td></tr>';

    try {
        const flights = await api.getFlights();
        if (!flights || flights.length === 0) {
            tableBody.innerHTML = '<tr><td colspan="8" style="text-align: center; padding: 1.5rem;">No flights scheduled.</td></tr>';
            return;
        }

        tableBody.innerHTML = flights.map(f => `
            <tr>
                <td><strong>${escapeHtml(f.flightNumber)}</strong></td>
                <td>${escapeHtml(f.airline)}</td>
                <td>${escapeHtml(f.sourceCity)} → ${escapeHtml(f.destinationCity)}</td>
                <td>${formatDate(f.departureTime)} ${formatTime(f.departureTime)}</td>
                <td>${formatTime(f.arrivalTime)}</td>
                <td>${f.availableSeats} / ${f.totalSeats}</td>
                <td><strong>₹${f.price.toLocaleString('en-IN')}</strong></td>
                <td><span class="badge badge-${f.status === 'SCHEDULED' ? 'success' : 'warning'}">${f.status}</span></td>
                <td>
                    <div style="display: flex; gap: 0.35rem;">
                        <button class="btn btn-outline btn-sm" onclick="openEditFlightModal(${f.id})">Edit</button>
                        <button class="btn btn-danger-outline btn-sm" onclick="handleDeleteFlight(${f.id})">Delete</button>
                    </div>
                </td>
            </tr>
        `).join('');
    } catch (error) {
        tableBody.innerHTML = `<tr><td colspan="8" style="text-align: center; color: #ef4444; padding: 1.5rem;">Error: ${error.message}</td></tr>`;
    }
}

async function loadAdminBookings() {
    const tableBody = document.getElementById('admin-bookings-table-body');
    tableBody.innerHTML = '<tr><td colspan="8" style="text-align: center; padding: 1.5rem; color: #64748b;">Loading all bookings...</td></tr>';

    try {
        const bookings = await api.adminGetAllBookings();
        if (!bookings || bookings.length === 0) {
            tableBody.innerHTML = '<tr><td colspan="8" style="text-align: center; padding: 1.5rem;">No bookings found.</td></tr>';
            return;
        }

        tableBody.innerHTML = bookings.map(b => {
            const isConfirmed = b.status === 'CONFIRMED';
            return `
                <tr>
                    <td><span class="ticket-number">${escapeHtml(b.ticketNumber)}</span></td>
                    <td><strong>${escapeHtml(b.passengerName)}</strong><br><span style="font-size: 0.75rem; color: #64748b;">${escapeHtml(b.passengerEmail)}</span></td>
                    <td>${escapeHtml(b.airline)} (${escapeHtml(b.flightNumber)})</td>
                    <td>${escapeHtml(b.sourceCity)} → ${escapeHtml(b.destinationCity)}</td>
                    <td>${escapeHtml(b.seatNumber || '-')}</td>
                    <td><strong>₹${b.totalAmount.toLocaleString('en-IN')}</strong></td>
                    <td><span class="badge badge-${isConfirmed ? 'success' : 'danger'}">${b.status}</span></td>
                    <td>
                        <div style="display: flex; gap: 0.35rem;">
                            <button class="btn btn-outline btn-sm" onclick="viewTicketByNumber('${b.ticketNumber}')">View</button>
                            ${isConfirmed ? `
                                <button class="btn btn-danger-outline btn-sm" onclick="handleAdminCancelBooking(${b.id})">Cancel</button>
                            ` : ''}
                        </div>
                    </td>
                </tr>
            `;
        }).join('');
    } catch (error) {
        tableBody.innerHTML = `<tr><td colspan="8" style="text-align: center; color: #ef4444; padding: 1.5rem;">Error: ${error.message}</td></tr>`;
    }
}

function openAddFlightModal() {
    currentEditingFlightId = null;
    document.getElementById('admin-flight-modal-title').textContent = 'Add New Flight';
    document.getElementById('admin-flight-form').reset();

    // Default dates: tomorrow
    const tomorrow = new Date();
    tomorrow.setDate(tomorrow.getDate() + 1);
    tomorrow.setHours(9, 0, 0, 0);

    const arrTime = new Date(tomorrow);
    arrTime.setHours(11, 15, 0, 0);

    document.getElementById('flight-form-departure').value = formatDateTimeLocal(tomorrow);
    document.getElementById('flight-form-arrival').value = formatDateTimeLocal(arrTime);
    document.getElementById('flight-form-status').value = 'SCHEDULED';

    openModal('admin-flight-modal');
}

async function openEditFlightModal(flightId) {
    try {
        const flight = await api.getFlightById(flightId);
        currentEditingFlightId = flight.id;
        document.getElementById('admin-flight-modal-title').textContent = `Edit Flight (${flight.flightNumber})`;

        document.getElementById('flight-form-number').value = flight.flightNumber;
        document.getElementById('flight-form-airline').value = flight.airline;
        document.getElementById('flight-form-source').value = flight.sourceCity;
        document.getElementById('flight-form-destination').value = flight.destinationCity;
        document.getElementById('flight-form-departure').value = formatDateTimeLocal(new Date(flight.departureTime));
        document.getElementById('flight-form-arrival').value = formatDateTimeLocal(new Date(flight.arrivalTime));
        document.getElementById('flight-form-price').value = flight.price;
        document.getElementById('flight-form-seats').value = flight.totalSeats;
        document.getElementById('flight-form-status').value = flight.status;

        openModal('admin-flight-modal');
    } catch (error) {
        showToast('Error loading flight: ' + error.message, 'error');
    }
}

async function handleDeleteFlight(flightId) {
    if (!confirm('Are you sure you want to delete this flight? This cannot be undone.')) {
        return;
    }

    try {
        await api.adminDeleteFlight(flightId);
        showToast('Flight deleted successfully');
        loadAdminDashboard();
    } catch (error) {
        showToast('Error deleting flight: ' + error.message, 'error');
    }
}

async function handleAdminCancelBooking(bookingId) {
    if (!confirm('Cancel this booking as administrator? Seat will be released.')) {
        return;
    }

    try {
        await api.adminCancelBooking(bookingId);
        showToast('Booking cancelled by admin');
        loadAdminDashboard();
    } catch (error) {
        showToast('Error: ' + error.message, 'error');
    }
}

// Helpers
function formatDate(dateStr) {
    if (!dateStr) return '';
    const d = new Date(dateStr);
    return d.toLocaleDateString('en-IN', { day: '2-digit', month: 'short', year: 'numeric' });
}

function formatTime(dateStr) {
    if (!dateStr) return '';
    const d = new Date(dateStr);
    return d.toLocaleTimeString('en-IN', { hour: '2-digit', minute: '2-digit', hour12: true });
}

function formatDateTimeLocal(date) {
    const pad = n => (n < 10 ? '0' + n : n);
    return date.getFullYear() + '-' +
        pad(date.getMonth() + 1) + '-' +
        pad(date.getDate()) + 'T' +
        pad(date.getHours()) + ':' +
        pad(date.getMinutes());
}

function escapeHtml(text) {
    if (!text) return '';
    return String(text)
        .replace(/&/g, '&amp;')
        .replace(/</g, '&lt;')
        .replace(/>/g, '&gt;')
        .replace(/"/g, '&quot;')
        .replace(/'/g, '&#039;');
}
