const storage = window.localStorage;

const defaults = {
    users: [
        { username: 'patient1', password: 'patient123', fullName: 'Demo Patient', role: 'patient' },
        { username: 'admin', password: 'admin123', fullName: 'Administrator', role: 'main_admin' }
    ],
    settings: {
        name: 'General Hospital',
        tagline: 'Easy online appointment booking and payment support.',
        email: 'contact@hospital.example',
        paymentUrl: 'https://example.com/pay',
        logoUrl: '',
        notificationMessage: 'A new booking request has arrived. Please review and proceed with payment instructions.'
    },
    departments: ['General Medicine', 'Pediatrics', 'Cardiology', 'Orthopedics', 'Dermatology'],
    doctors: [
        { id: 1, name: 'Dr. Priya Sharma', specialty: 'Cardiology', department: 'Cardiology', imageUrl: '', timeSlots: ['09:00 AM - 10:00 AM', '10:30 AM - 11:30 AM', '02:00 PM - 03:00 PM'] },
        { id: 2, name: 'Dr. Aman Kumar', specialty: 'Orthopedics', department: 'Orthopedics', imageUrl: '', timeSlots: ['10:00 AM - 11:00 AM', '11:30 AM - 12:30 PM', '03:00 PM - 04:00 PM'] },
        { id: 3, name: 'Dr. Meera Singh', specialty: 'Dermatology', department: 'Dermatology', imageUrl: '', timeSlots: ['09:30 AM - 10:30 AM', '01:00 PM - 02:00 PM', '04:00 PM - 05:00 PM'] }
    ],
    appointments: []
};

function readData(key) {
    const value = storage.getItem(key);
    if (!value) return null;
    try { return JSON.parse(value); } catch { return null; }
}

function writeData(key, value) {
    storage.setItem(key, JSON.stringify(value));
}

function initializeStorage() {
    if (!readData('bookingApp')) {
        writeData('bookingApp', defaults);
    }
}

function getAppData() {
    return readData('bookingApp') || defaults;
}

function updateAppData(updates) {
    const data = getAppData();
    writeData('bookingApp', { ...data, ...updates });
}

function getCurrentUser() {
    return window.sessionStorage.getItem('currentUser');
}

function setCurrentUser(username) {
    if (username) {
        window.sessionStorage.setItem('currentUser', username);
    } else {
        window.sessionStorage.removeItem('currentUser');
    }
}

function getUserByUsername(username) {
    const data = getAppData();
    return data.users.find((user) => user.username === username);
}

function showElement(id, show = true) {
    const el = document.getElementById(id);
    if (!el) return;
    el.classList.toggle('hidden', !show);
}

function setText(id, text) {
    const el = document.getElementById(id);
    if (el) el.textContent = text;
}

function populateDepartmentOptions() {
    const data = getAppData();
    const deptSelect = document.getElementById('departmentSelect');
    const doctorDeptSelect = document.getElementById('doctorDepartment');
    if (deptSelect) {
        deptSelect.innerHTML = data.departments.map((dept) => `<option value="${dept}">${dept}</option>`).join('');
    }
    if (doctorDeptSelect) {
        doctorDeptSelect.innerHTML = data.departments.map((dept) => `<option value="${dept}">${dept}</option>`).join('');
    }
}

function populateDoctorOptions(department) {
    const data = getAppData();
    const doctorSelect = document.getElementById('doctorSelect');
    if (!doctorSelect) return;
    const doctors = data.doctors.filter((doc) => !department || doc.department === department);
    doctorSelect.innerHTML = doctors.map((doc) => `<option value="${doc.id}">${doc.name} — ${doc.specialty}</option>`).join('');
}

function populateSlotOptions(date = null, doctorId = null) {
    const data = getAppData();
    const slotSelect = document.getElementById('timeSlotSelect');
    if (!slotSelect) return;
    let availableSlots = [];
    if (doctorId) {
        const doctor = data.doctors.find(d => d.id == doctorId);
        availableSlots = doctor ? doctor.timeSlots : [];
    }
    if (date && doctorId) {
        const bookedSlots = data.appointments
            .filter(appt => appt.date === date && appt.doctorId == doctorId && appt.status !== 'Rejected')
            .map(appt => appt.slot);
        availableSlots = availableSlots.filter(slot => !bookedSlots.includes(slot));
    }
    slotSelect.innerHTML = availableSlots.map((slot) => `<option value="${slot}">${slot}</option>`).join('');
}

function loadSettingsToPage() {
    const settings = getAppData().settings;
    setText('hospital-name', settings.name);
    setText('hospital-tagline', settings.tagline);
    setLogoImage(settings.logoUrl);
    const settingsName = document.getElementById('settingsName');
    if (settingsName) settingsName.value = settings.name;
    const settingsTagline = document.getElementById('settingsTagline');
    if (settingsTagline) settingsTagline.value = settings.tagline;
    const settingsEmail = document.getElementById('settingsEmail');
    if (settingsEmail) settingsEmail.value = settings.email;
    const settingsPaymentUrl = document.getElementById('settingsPaymentUrl');
    if (settingsPaymentUrl) settingsPaymentUrl.value = settings.paymentUrl;
    const settingsLogoUrl = document.getElementById('settingsLogoUrl');
    if (settingsLogoUrl) settingsLogoUrl.value = settings.logoUrl || '';
    const settingsMessage = document.getElementById('settingsMessage');
    if (settingsMessage) settingsMessage.value = settings.notificationMessage;
}

function setLogoImage(url) {
    const logo = document.getElementById('hospitalLogo');
    if (!logo) return;
    if (url) {
        logo.onerror = () => logo.classList.add('hidden');
        logo.src = url;
        logo.classList.remove('hidden');
    } else {
        logo.classList.add('hidden');
    }
}

function renderAppointmentSummary(appointment) {
    if (!appointment) {
        setText('appointmentSummary', 'No bookings yet. Fill the form to request an appointment.');
        return;
    }
    const doctor = getAppData().doctors.find((doc) => doc.id === Number(appointment.doctorId));
    const summary = `Your request for ${doctor ? doctor.name : 'selected doctor'} on ${appointment.date} at ${appointment.slot} is submitted. Status: ${appointment.status}.`;
    setText('appointmentSummary', summary);
}

function renderPatientAppointments() {
    const currentUser = getCurrentUser();
    const tableBody = document.getElementById('appointmentsTableBody');
    if (!tableBody) return;
    const data = getAppData();
    const appointments = data.appointments.filter((appt) => appt.username === currentUser);
    if (!appointments.length) {
        tableBody.innerHTML = `<tr><td colspan="6">No appointments booked yet.</td></tr>`;
        showElement('paymentCard', false);
        return;
    }
    tableBody.innerHTML = appointments.map((appt, index) => {
        const doctor = data.doctors.find((doc) => doc.id === Number(appt.doctorId));
        const action = appt.status === 'Accepted' ? `<button class="button secondary" onclick="showPayment('${appt.id}')">Pay</button>` : '—';
        return `<tr><td>${index + 1}</td><td>${doctor ? doctor.name : 'Unknown'}</td><td>${appt.date}</td><td>${appt.slot}</td><td>${appt.status}</td><td>${action}</td></tr>`;
    }).join('');
}

function showPayment(appointmentId) {
    const data = getAppData();
    const appointment = data.appointments.find((appt) => appt.id === appointmentId);
    if (!appointment || appointment.status !== 'Accepted') return;
    const paymentLink = document.getElementById('paymentLink');
    const paymentCard = document.getElementById('paymentCard');
    if (!paymentLink || !paymentCard) return;
    const settings = data.settings;
    const url = `${settings.paymentUrl}?appointmentId=${appointment.id}&patient=${encodeURIComponent(appointment.username)}`;
    paymentLink.href = url;
    paymentLink.textContent = `Pay for appointment #${appointment.id}`;
    showElement('paymentCard', true);
}

function submitAppointmentRequest(event) {
    event.preventDefault();
    const currentUser = getCurrentUser();
    const nameEl = document.getElementById('patientName');
    const department = document.getElementById('departmentSelect').value;
    const doctorId = document.getElementById('doctorSelect').value;
    const date = document.getElementById('appointmentDate').value;
    const slot = document.getElementById('timeSlotSelect').value;
    const problem = document.getElementById('problemDescription').value.trim();
    const paymentMethod = document.getElementById('paymentMethod').value;
    if (!department || !doctorId || !date || !slot || !problem || !paymentMethod) {
        alert('Please fill out all appointment fields.');
        return;
    }
    const data = getAppData();
    // Check for conflicts
    const conflict = data.appointments.find(appt => appt.date === date && appt.slot === slot && appt.status !== 'Rejected');
    if (conflict) {
        alert('This slot is already booked on the selected date. Please choose another slot or date.');
        return;
    }
    const newAppointment = {
        id: `A${Date.now()}`,
        username: currentUser,
        doctorId,
        department,
        date,
        slot,
        problem,
        paymentMethod,
        status: 'Pending'
    };
    data.appointments.push(newAppointment);
    updateAppData({ appointments: data.appointments });
    renderAppointmentSummary(newAppointment);
    renderPatientAppointments();
    displayPatientNotification('Appointment request submitted. Admin will review and send payment instructions soon.');
    event.target.reset();
    populateSlotOptions(); // Reset slots
}

function displayPatientNotification(message) {
    const banner = document.getElementById('patientNotification');
    if (!banner) return;
    banner.textContent = message;
    showElement('patientNotification', true);
}

function showPatientDashboard() {
    const currentUser = getCurrentUser();
    const user = getUserByUsername(currentUser);
    if (!user) return;
    setText('patientName', user.fullName || user.username);
    showElement('welcomePanel', false);
    showElement('patientDashboard', true);
    showElement('logoutButton', true);
    populateDepartmentOptions();
    populateDoctorOptions();
    populateSlotOptions();
    renderPatientAppointments();
    renderAppointmentSummary();
}

function handleLogin(event) {
    event.preventDefault();
    const username = document.getElementById('loginUsername').value.trim();
    const password = document.getElementById('loginPassword').value;
    const user = getUserByUsername(username);
    if (!user || user.password !== password) {
        alert('Login failed. Check your username and password.');
        return;
    }
    if (user.role !== 'patient') {
        alert('Please use the admin panel for administrator login.');
        return;
    }
    setCurrentUser(username);
    showPatientDashboard();
}

function handleRegister(event) {
    event.preventDefault();
    const fullName = document.getElementById('registerName').value.trim();
    const username = document.getElementById('registerUsername').value.trim();
    const password = document.getElementById('registerPassword').value;
    const mobile = document.getElementById('registerMobile').value.trim();
    if (!fullName || !username || !password || !mobile) {
        alert('All registration fields are required.');
        return;
    }
    const data = getAppData();
    if (data.users.some((user) => user.username === username)) {
        alert('Username already exists. Choose another username.');
        return;
    }
    const newUser = { username, password, fullName, role: 'patient', mobile, age: '', dob: '', problem: '' };
    data.users.push(newUser);
    updateAppData({ users: data.users });
    alert('Registration successful. You can now log in.');
    document.getElementById('registerForm').reset();
    toggleForms('login');
}

function handleLogout() {
    setCurrentUser(null);
    showElement('patientDashboard', false);
    showElement('welcomePanel', true);
    showElement('logoutButton', false);
}

function toggleForms(tab) {
    document.getElementById('showLogin').classList.toggle('active', tab === 'login');
    document.getElementById('showRegister').classList.toggle('active', tab === 'register');
    showElement('loginForm', tab === 'login');
    showElement('registerForm', tab === 'register');
}

function setupPatientPage() {
    const showLogin = document.getElementById('showLogin');
    const showRegister = document.getElementById('showRegister');
    showLogin.addEventListener('click', () => toggleForms('login'));
    showRegister.addEventListener('click', () => toggleForms('register'));
    document.getElementById('loginForm').addEventListener('submit', handleLogin);
    document.getElementById('registerForm').addEventListener('submit', handleRegister);
    document.getElementById('appointmentForm').addEventListener('submit', submitAppointmentRequest);
    document.getElementById('departmentSelect').addEventListener('change', (e) => {
        populateDoctorOptions(e.target.value);
        document.getElementById('doctorSelect').value = '';
        showSelectedDoctorImage('');
    });
    document.getElementById('appointmentDate').addEventListener('change', (e) => {
        const doctorId = document.getElementById('doctorSelect').value;
        populateSlotOptions(e.target.value, doctorId);
    });
    document.getElementById('doctorSelect').addEventListener('change', (e) => {
        const date = document.getElementById('appointmentDate').value;
        populateSlotOptions(date, e.target.value);
        showSelectedDoctorImage(e.target.value);
    });
    document.getElementById('logoutButton').addEventListener('click', handleLogout);
    const currentUser = getCurrentUser();
    if (currentUser) showPatientDashboard();
}

function handleAdminLogin(event) {
    event.preventDefault();
    const username = document.getElementById('adminUsername').value.trim();
    const password = document.getElementById('adminPassword').value;
    const user = getUserByUsername(username);
    if (!user || user.password !== password || (user.role !== 'admin' && user.role !== 'main_admin')) {
        alert('Administrator login failed.');
        return;
    }
    window.sessionStorage.setItem('adminUser', username);
    showAdminPanel();
}

function showAdminPanel() {
    const adminUser = window.sessionStorage.getItem('adminUser');
    const user = getUserByUsername(adminUser);
    loadSettingsToPage();
    populateDepartmentOptions();
    populateDoctorOptions();
    renderDoctorList();
    renderAdminAppointments();
    renderNotificationLog();
    showElement('adminLoginSection', false);
    showElement('adminPanel', true);
    showElement('adminLogoutButton', true);
    if (user && user.role === 'main_admin') {
        showElement('adminManagement', true);
        renderAdminList();
        document.getElementById('adminForm').addEventListener('submit', addAdmin);
    } else {
        showElement('adminManagement', false);
    }
}

function adminLogout() {
    window.sessionStorage.removeItem('adminUser');
    showElement('adminLoginSection', true);
    showElement('adminPanel', false);
    showElement('adminLogoutButton', false);
}

function saveSettings(event) {
    event.preventDefault();
    const name = document.getElementById('settingsName').value.trim();
    const tagline = document.getElementById('settingsTagline').value.trim();
    const email = document.getElementById('settingsEmail').value.trim();
    const paymentUrl = document.getElementById('settingsPaymentUrl').value.trim();
    const logoUrl = document.getElementById('settingsLogoUrl').value.trim();
    const notificationMessage = document.getElementById('settingsMessage').value.trim();
    if (!name || !tagline || !email || !paymentUrl) {
        alert('Please fill in all settings fields.');
        return;
    }
    const data = getAppData();
    updateAppData({ settings: { ...data.settings, name, tagline, email, paymentUrl, logoUrl, notificationMessage } });
    loadSettingsToPage();
    alert('Hospital settings saved successfully.');
}

function addDepartment(event) {
    event.preventDefault();
    const departmentName = document.getElementById('departmentName').value.trim();
    if (!departmentName) return;
    const data = getAppData();
    if (data.departments.includes(departmentName)) {
        alert('Department already exists.');
        return;
    }
    data.departments.push(departmentName);
    updateAppData({ departments: data.departments });
    populateDepartmentOptions();
    document.getElementById('departmentForm').reset();
}

function addDoctor(event) {
    event.preventDefault();
    const name = document.getElementById('doctorName').value.trim();
    const specialty = document.getElementById('doctorSpecialty').value.trim();
    const imageUrl = document.getElementById('doctorImageUrl').value.trim();
    const department = document.getElementById('doctorDepartment').value;
    const timeSlotsText = document.getElementById('doctorTimeSlots').value.trim();
    const timeSlots = timeSlotsText ? timeSlotsText.split(',').map(s => s.trim()).filter(s => s) : [];
    if (!name || !specialty || !department) {
        alert('Complete the doctor fields.');
        return;
    }
    const data = getAppData();
    const newDoctor = { id: Date.now(), name, specialty, department, imageUrl, timeSlots };
    data.doctors.push(newDoctor);
    updateAppData({ doctors: data.doctors });
    populateDoctorOptions();
    renderDoctorList();
    document.getElementById('doctorForm').reset();
}

function removeDoctor(doctorId) {
    const data = getAppData();
    data.doctors = data.doctors.filter((doc) => doc.id !== Number(doctorId));
    updateAppData({ doctors: data.doctors });
    populateDoctorOptions();
    renderDoctorList();
    renderAdminAppointments();
    alert('Doctor removed successfully.');
}

function renderDoctorList() {
    const container = document.getElementById('doctorList');
    if (!container) return;
    const data = getAppData();
    if (!data.doctors.length) {
        container.innerHTML = '<p>No doctors added yet.</p>';
        return;
    }
    container.innerHTML = data.doctors.map((doc) => `
        <div class="doctor-item">
            <div>
                <img src="${doc.imageUrl || ''}" alt="${doc.name}" class="doctor-image" onerror="this.style.display='none'" />
                <div>
                    <strong>${doc.name}</strong>
                    <div>${doc.specialty} | ${doc.department}</div>
                </div>
            </div>
            <button class="button secondary small" onclick="removeDoctor(${doc.id})">Remove</button>
        </div>
    `).join('');
}

function renderAdminAppointments() {
    const body = document.getElementById('adminAppointmentsBody');
    if (!body) return;
    const data = getAppData();
    if (!data.appointments.length) {
        body.innerHTML = `<tr><td colspan="7">No appointment requests have been made yet.</td></tr>`;
        return;
    }
    body.innerHTML = data.appointments.map((appt, index) => {
        const doctor = data.doctors.find((doc) => doc.id === Number(appt.doctorId));
        const action = appt.status === 'Pending' ? `
      <button class="button secondary" onclick="changeAppointmentStatus('${appt.id}','Accepted')">Accept</button>
      <button class="button secondary" onclick="changeAppointmentStatus('${appt.id}','Rejected')">Reject</button>
    ` : 'Updated';
        return `<tr>
      <td>${index + 1}</td>
      <td>${appt.username}</td>
      <td>${doctor ? doctor.name : 'Unknown'}</td>
      <td>${appt.date}</td>
      <td>${appt.slot}</td>
      <td>${appt.status}</td>
      <td>${action}</td>
    </tr>`;
    }).join('');
}

function renderNotificationLog() {
    const log = document.getElementById('notificationLog');
    const data = getAppData();
    if (!log) return;
    const notifications = readData('notificationLog') || [];
    log.innerHTML = notifications.length ? notifications.map((item) => `<div>${item}</div>`).join('') : 'No notifications sent yet.';
}

function logNotification(message) {
    const existing = readData('notificationLog') || [];
    existing.unshift(`${new Date().toLocaleString()}: ${message}`);
    storage.setItem('notificationLog', JSON.stringify(existing.slice(0, 20)));
    renderNotificationLog();
}

function changeAppointmentStatus(appointmentId, status) {
    const data = getAppData();
    const appointment = data.appointments.find((appt) => appt.id === appointmentId);
    if (!appointment) return;
    appointment.status = status;
    updateAppData({ appointments: data.appointments });
    renderAdminAppointments();
    renderNotificationLog();
    const message = `Appointment ${appointment.id} for ${appointment.username} has been ${status.toLowerCase()}.`;
    logNotification(message);
    alert(message);
}

function setupAdminPage() {
    const adminLoginForm = document.getElementById('adminLoginForm');
    if (!adminLoginForm) return;
    adminLoginForm.addEventListener('submit', handleAdminLogin);
    document.getElementById('adminLogoutButton').addEventListener('click', adminLogout);
    document.getElementById('settingsForm').addEventListener('submit', saveSettings);
    document.getElementById('departmentForm').addEventListener('submit', addDepartment);
    document.getElementById('doctorForm').addEventListener('submit', addDoctor);
    const adminUser = window.sessionStorage.getItem('adminUser');
    if (adminUser) showAdminPanel();
}

function init() {
    initializeStorage();
    if (document.getElementById('loginForm')) {
        setupPatientPage();
    }
    if (document.getElementById('adminLoginForm')) {
        setupAdminPage();
    }
    loadSettingsToPage();
}

window.changeAppointmentStatus = changeAppointmentStatus;
window.showPayment = showPayment;
window.removeDoctor = removeDoctor;
window.addEventListener('DOMContentLoaded', init);

function showSelectedDoctorImage(doctorId) {
    const imageDiv = document.getElementById('selectedDoctorImage');
    const img = document.getElementById('doctorImage');
    if (doctorId) {
        const doctors = getData('doctors') || [];
        const doctor = doctors.find(d => d.id == doctorId);
        if (doctor && doctor.image) {
            img.src = doctor.image;
            imageDiv.style.display = 'block';
        } else {
            imageDiv.style.display = 'none';
        }
    } else {
        imageDiv.style.display = 'none';
    }
}

function addAdmin(event) {
    event.preventDefault();
    const username = document.getElementById('adminUsernameInput').value.trim();
    const password = document.getElementById('adminPasswordInput').value;
    const fullName = document.getElementById('adminFullNameInput').value.trim();
    if (!username || !password || !fullName) return;
    const users = getData('users') || [];
    if (users.find(u => u.username === username)) {
        alert('Username already exists.');
        return;
    }
    users.push({ username, password, fullName, role: 'admin' });
    setData('users', users);
    renderAdminList();
    document.getElementById('adminForm').reset();
}

function renderAdminList() {
    const users = getData('users') || [];
    const admins = users.filter(u => u.role === 'admin');
    const list = document.getElementById('adminList');
    if (admins.length === 0) {
        list.innerHTML = 'No additional admins.';
        return;
    }
    list.innerHTML = admins.map(admin => `
        <div class="admin-item">
            <span>${admin.fullName} (${admin.username})</span>
            <button onclick="editAdmin('${admin.username}')">Edit</button>
            <button onclick="removeAdmin('${admin.username}')">Remove</button>
        </div>
    `).join('');
}

window.editAdmin = function (username) {
    const users = getData('users') || [];
    const admin = users.find(u => u.username === username);
    if (!admin) return;
    const newUsername = prompt('New Username:', admin.username);
    const newPassword = prompt('New Password:', admin.password);
    const newFullName = prompt('New Full Name:', admin.fullName);
    if (newUsername && newPassword && newFullName) {
        admin.username = newUsername.trim();
        admin.password = newPassword;
        admin.fullName = newFullName.trim();
        setData('users', users);
        renderAdminList();
    }
};

window.removeAdmin = function (username) {
    if (!confirm('Remove this admin?')) return;
    const users = getData('users') || [];
    const filtered = users.filter(u => u.username !== username);
    setData('users', filtered);
    renderAdminList();
};
