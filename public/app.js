// Global state
let currentUser = null;
const API = 'http://localhost:3000/api';

// Set today's date as default
document.addEventListener('DOMContentLoaded', () => {
    const today = new Date().toISOString().split('T')[0];
    const dateInput = document.getElementById('attendanceDate');
    if (dateInput) dateInput.value = today;
});

// ==================== AUTHENTICATION ====================
async function login(event) {
    event.preventDefault();
    const email = document.getElementById('email').value;
    const password = document.getElementById('password').value;

    try {
        const response = await fetch(`${API}/login`, {
            method: 'POST',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify({ email, password })
        });

        const data = await response.json();
        if (data.success) {
            currentUser = data.teacher;
            showDashboard();
            loadInitialData();
        } else {
            alert('Login failed: ' + data.message);
        }
    } catch (err) {
        alert('Error: ' + err.message);
    }
}

function logout() {
    if (confirm('Are you sure you want to logout?')) {
        currentUser = null;
        document.getElementById('loginScreen').style.display = 'block';
        document.getElementById('dashboard').style.display = 'none';
        document.getElementById('email').value = '';
        document.getElementById('password').value = '';
    }
}

function showDashboard() {
    document.getElementById('loginScreen').style.display = 'none';
    document.getElementById('dashboard').style.display = 'block';
    document.getElementById('currentUser').textContent = currentUser.name;
}

// ==================== NAVIGATION ====================
function showSection(section) {
    // Hide all sections
    document.querySelectorAll('.content-section').forEach(s => s.style.display = 'none');

    // Show selected section
    const sectionId = section + '-section';
    const elem = document.getElementById(sectionId);
    if (elem) elem.style.display = 'block';

    // Load data for specific sections
    if (section === 'home') {
        // Home doesn't need specific loading
    } else if (section === 'attendance') {
        loadClassesForAttendance();
    } else if (section === 'marks') {
        loadClassesForMarks();
    } else if (section === 'timetable') {
        loadClassesForTimetable();
    } else if (section === 'reports') {
        loadAllStudents();
    }
}

function showManageTab(tab) {
    // Hide all tabs
    document.querySelectorAll('.tab-content').forEach(t => t.style.display = 'none');
    document.querySelectorAll('.tab-btn').forEach(b => b.classList.remove('active'));

    // Show selected tab
    const tabId = tab + '-tab';
    const elem = document.getElementById(tabId);
    if (elem) elem.style.display = 'block';

    // Mark button as active
    event.target.classList.add('active');

    // Load data for specific tabs
    if (tab === 'teachers') {
        loadTeachers();
    } else if (tab === 'classes') {
        loadClassesForManage();
    } else if (tab === 'students') {
        loadStudents();
    } else if (tab === 'timetable-setup') {
        loadTimetableSetup();
    }
}

// ==================== INITIAL DATA LOADING ====================
async function loadInitialData() {
    try {
        await loadClassesForAttendance();
        await loadClassesForMarks();
        await loadClassesForTimetable();
    } catch (err) {
        console.error('Error loading initial data:', err);
    }
}

async function loadClassesForAttendance() {
    try {
        const response = await fetch(`${API}/classes`);
        const classes = await response.json();
        const select = document.getElementById('attendanceClass');
        select.innerHTML = '<option value="">-- Choose a Class --</option>';
        classes.forEach(c => {
            const option = document.createElement('option');
            option.value = c.id;
            option.textContent = c.name;
            select.appendChild(option);
        });
    } catch (err) {
        console.error('Error loading classes:', err);
    }
}

async function loadClassesForMarks() {
    try {
        const response = await fetch(`${API}/classes`);
        const classes = await response.json();
        const select = document.getElementById('marksClass');
        select.innerHTML = '<option value="">-- Choose a Class --</option>';
        classes.forEach(c => {
            const option = document.createElement('option');
            option.value = c.id;
            option.textContent = c.name;
            select.appendChild(option);
        });
    } catch (err) {
        console.error('Error loading classes:', err);
    }
}

async function loadClassesForTimetable() {
    try {
        const response = await fetch(`${API}/classes`);
        const classes = await response.json();
        const select = document.getElementById('timetableClass');
        select.innerHTML = '<option value="">-- All Classes --</option>';
        classes.forEach(c => {
            const option = document.createElement('option');
            option.value = c.id;
            option.textContent = c.name;
            select.appendChild(option);
        });
    } catch (err) {
        console.error('Error loading classes:', err);
    }
}

async function loadAllStudents() {
    try {
        const response = await fetch(`${API}/students`);
        const students = await response.json();
        const select = document.getElementById('reportStudent');
        select.innerHTML = '<option value="">-- Select a Student --</option>';
        students.forEach(s => {
            const option = document.createElement('option');
            option.value = s.id;
            option.textContent = `${s.name} (${s.class_name})`;
            select.appendChild(option);
        });
    } catch (err) {
        console.error('Error loading students:', err);
    }
}

// ==================== ATTENDANCE ====================
async function loadStudentsForAttendance() {
    const classId = document.getElementById('attendanceClass').value;
    if (!classId) return;

    try {
        const response = await fetch(`${API}/students?class_id=${classId}`);
        const students = await response.json();

        const container = document.getElementById('attendanceList');
        container.innerHTML = '<div class="attendance-row header"><div>Student Name</div><div>Status</div><div>Reason (if Leave)</div></div>';

        students.forEach(student => {
            const row = document.createElement('div');
            row.className = 'attendance-row';
            row.innerHTML = `
                <div>${student.name} (Roll: ${student.roll_number})</div>
                <div class="attendance-status">
                    <button class="status-btn" data-student-id="${student.id}" data-status="present" onclick="setAttendanceStatus(this)">Present</button>
                    <button class="status-btn" data-student-id="${student.id}" data-status="absent" onclick="setAttendanceStatus(this)">Absent</button>
                    <button class="status-btn" data-student-id="${student.id}" data-status="leave" onclick="setAttendanceStatus(this)">Leave</button>
                </div>
                <input type="text" placeholder="Reason..." class="leave-reason" data-student-id="${student.id}" style="display:none;">
            `;
            container.appendChild(row);
        });
    } catch (err) {
        alert('Error loading students: ' + err.message);
    }
}

function setAttendanceStatus(btn) {
    const status = btn.dataset.status;
    const studentId = btn.dataset.studentId;

    // Remove active class from other buttons
    document.querySelectorAll(`[data-student-id="${studentId}"]`).forEach(b => {
        if (b.className.includes('status-btn')) b.classList.remove('active');
    });

    // Add active to clicked button
    btn.classList.add('active');

    // Show/hide reason field
    const reasonField = document.querySelector(`[data-student-id="${studentId}"].leave-reason`);
    if (status === 'leave') {
        reasonField.style.display = 'block';
    } else {
        reasonField.style.display = 'none';
        reasonField.value = '';
    }
}

async function saveAttendance() {
    const classId = document.getElementById('attendanceClass').value;
    const period = document.getElementById('attendancePeriod').value;
    const date = document.getElementById('attendanceDate').value;

    if (!classId) {
        alert('Please select a class');
        return;
    }

    try {
        const statusBtns = document.querySelectorAll('.status-btn.active');

        for (let btn of statusBtns) {
            const studentId = btn.dataset.studentId;
            const status = btn.dataset.status;
            const reasonField = document.querySelector(`[data-student-id="${studentId}"].leave-reason`);
            const reason = reasonField ? reasonField.value : '';

            await fetch(`${API}/attendance`, {
                method: 'POST',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify({
                    student_id: studentId,
                    attendance_date: date,
                    period,
                    type: 'student',
                    status,
                    leave_reason: reason,
                    marked_by: currentUser.id
                })
            });
        }

        alert('Attendance saved successfully!');
        document.getElementById('attendanceList').innerHTML = '';
        document.getElementById('attendanceClass').value = '';
    } catch (err) {
        alert('Error saving attendance: ' + err.message);
    }
}

// ==================== MARKS ====================
async function loadStudentsForMarks() {
    const classId = document.getElementById('marksClass').value;
    if (!classId) return;

    try {
        const response = await fetch(`${API}/students?class_id=${classId}`);
        const students = await response.json();

        const container = document.getElementById('marksList');
        container.innerHTML = '<div class="marks-row header"><div>Student Name</div><div>Marks Obtained</div></div>';

        students.forEach(student => {
            const row = document.createElement('div');
            row.className = 'marks-row';
            row.innerHTML = `
                <div>${student.name}</div>
                <input type="number" class="marks-input" placeholder="Marks" data-student-id="${student.id}" min="0">
            `;
            container.appendChild(row);
        });
    } catch (err) {
        alert('Error loading students: ' + err.message);
    }
}

async function saveMarks() {
    const classId = document.getElementById('marksClass').value;
    const subject = document.getElementById('marksSubject').value;
    const testName = document.getElementById('marksTestName').value;
    const totalMarks = document.getElementById('marksTotalMarks').value;

    if (!classId || !subject || !testName) {
        alert('Please fill all fields');
        return;
    }

    try {
        const inputs = document.querySelectorAll('.marks-input');

        for (let input of inputs) {
            const marks = input.value;
            if (marks === '') continue;

            await fetch(`${API}/marks`, {
                method: 'POST',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify({
                    student_id: input.dataset.studentId,
                    class_id: classId,
                    subject,
                    test_name: testName,
                    marks_obtained: marks,
                    total_marks: totalMarks,
                    recorded_by: currentUser.id
                })
            });
        }

        alert('Marks saved successfully!');
        document.getElementById('marksClass').value = '';
        document.getElementById('marksSubject').value = '';
        document.getElementById('marksTestName').value = '';
        document.getElementById('marksList').innerHTML = '';
    } catch (err) {
        alert('Error saving marks: ' + err.message);
    }
}

// ==================== TIMETABLE ====================
async function loadTimetable() {
    const classId = document.getElementById('timetableClass').value;
    const url = classId ? `${API}/timetable?class_id=${classId}` : `${API}/timetable`;

    try {
        const response = await fetch(url);
        const timetable = await response.json();

        const container = document.getElementById('timetableDisplay');
        container.innerHTML = '';

        const days = ['Monday', 'Tuesday', 'Wednesday', 'Thursday', 'Friday', 'Saturday', 'Sunday'];

        days.forEach(day => {
            const dayTimetable = timetable.filter(t => t.day === day);
            if (dayTimetable.length === 0) return;

            const dayDiv = document.createElement('div');
            dayDiv.className = 'timetable-day';
            dayDiv.innerHTML = `<h4>${day}</h4>`;

            dayTimetable.forEach(entry => {
                const periodBlock = document.createElement('div');
                periodBlock.className = 'period-block';
                periodBlock.innerHTML = `
                    <strong>Period ${entry.period}: ${entry.subject || 'N/A'}</strong>
                    <p>Class: ${entry.class_name}</p>
                    <p>Teacher: ${entry.teacher_name}</p>
                `;
                dayDiv.appendChild(periodBlock);
            });

            container.appendChild(dayDiv);
        });

        if (container.innerHTML === '') {
            container.innerHTML = '<p style="padding: 20px; text-align: center; font-size: 18px;">No timetable entries found</p>';
        }
    } catch (err) {
        alert('Error loading timetable: ' + err.message);
    }
}

// ==================== MANAGE - TEACHERS ====================
async function loadTeachers() {
    try {
        const response = await fetch(`${API}/teachers`);
        const teachers = await response.json();

        const container = document.getElementById('teachersList');
        container.innerHTML = '';

        teachers.forEach(teacher => {
            const item = document.createElement('div');
            item.className = 'list-item';
            item.innerHTML = `
                <div class="list-item-info">
                    <strong>${teacher.name}</strong>
                    <p style="margin-top: 5px; color: #666;">Email: ${teacher.email} | Phone: ${teacher.phone}</p>
                </div>
                <div class="list-item-actions">
                    <button class="btn btn-danger" onclick="deleteTeacher(${teacher.id})">Delete</button>
                </div>
            `;
            container.appendChild(item);
        });
    } catch (err) {
        alert('Error loading teachers: ' + err.message);
    }
}

async function addTeacher() {
    const name = document.getElementById('teacherName').value;
    const email = document.getElementById('teacherEmail').value;
    const phone = document.getElementById('teacherPhone').value;
    const password = document.getElementById('teacherPassword').value;

    if (!name || !email || !password) {
        alert('Please fill all required fields');
        return;
    }

    try {
        const response = await fetch(`${API}/teachers`, {
            method: 'POST',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify({ name, email, phone, password })
        });

        const data = await response.json();
        if (data.success) {
            alert('Teacher added successfully!');
            document.getElementById('teacherName').value = '';
            document.getElementById('teacherEmail').value = '';
            document.getElementById('teacherPhone').value = '';
            document.getElementById('teacherPassword').value = '';
            loadTeachers();
            loadClassTeachers();
        }
    } catch (err) {
        alert('Error: ' + err.message);
    }
}

async function deleteTeacher(id) {
    if (confirm('Are you sure?')) {
        try {
            const response = await fetch(`${API}/teachers/${id}`, { method: 'DELETE' });
            const data = await response.json();
            if (data.success) {
                alert('Teacher deleted!');
                loadTeachers();
            }
        } catch (err) {
            alert('Error: ' + err.message);
        }
    }
}

async function loadClassTeachers() {
    try {
        const response = await fetch(`${API}/teachers`);
        const teachers = await response.json();
        const select = document.getElementById('classTeacher');
        select.innerHTML = '<option value="">-- Select a Teacher --</option>';
        teachers.forEach(t => {
            const option = document.createElement('option');
            option.value = t.id;
            option.textContent = t.name;
            select.appendChild(option);
        });
    } catch (err) {
        console.error('Error loading teachers:', err);
    }
}

// ==================== MANAGE - CLASSES ====================
async function loadClassesForManage() {
    try {
        const response = await fetch(`${API}/classes`);
        const classes = await response.json();

        const container = document.getElementById('classesList');
        container.innerHTML = '';

        classes.forEach(cls => {
            const item = document.createElement('div');
            item.className = 'list-item';
            item.innerHTML = `
                <div class="list-item-info">
                    <strong>${cls.name}</strong>
                    <p style="margin-top: 5px; color: #666;">Class Teacher: ${cls.class_teacher_name || 'Not assigned'}</p>
                </div>
                <div class="list-item-actions">
                    <button class="btn btn-danger" onclick="deleteClass(${cls.id})">Delete</button>
                </div>
            `;
            container.appendChild(item);
        });
    } catch (err) {
        alert('Error loading classes: ' + err.message);
    }
}

async function addClass() {
    const name = document.getElementById('className').value;
    const classTeacherId = document.getElementById('classTeacher').value;

    if (!name) {
        alert('Please enter a class name');
        return;
    }

    try {
        const response = await fetch(`${API}/classes`, {
            method: 'POST',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify({ name, class_teacher_id: classTeacherId || null })
        });

        const data = await response.json();
        if (data.success) {
            alert('Class created successfully!');
            document.getElementById('className').value = '';
            document.getElementById('classTeacher').value = '';
            loadClassesForManage();
            loadClassesForAttendance();
            loadClassesForMarks();
        }
    } catch (err) {
        alert('Error: ' + err.message);
    }
}

async function deleteClass(id) {
    if (confirm('Are you sure?')) {
        try {
            const response = await fetch(`${API}/classes/${id}`, { method: 'DELETE' });
            const data = await response.json();
            if (data.success) {
                alert('Class deleted!');
                loadClassesForManage();
            }
        } catch (err) {
            alert('Error: ' + err.message);
        }
    }
}

// ==================== MANAGE - STUDENTS ====================
async function loadStudents() {
    try {
        const response = await fetch(`${API}/students`);
        const students = await response.json();

        const container = document.getElementById('studentsList');
        container.innerHTML = '';

        students.forEach(student => {
            const item = document.createElement('div');
            item.className = 'list-item';
            item.innerHTML = `
                <div class="list-item-info">
                    <strong>${student.name}</strong>
                    <p style="margin-top: 5px; color: #666;">Class: ${student.class_name} | Roll: ${student.roll_number} | Contact: ${student.parent_contact || 'N/A'}</p>
                </div>
                <div class="list-item-actions">
                    <button class="btn btn-danger" onclick="deleteStudent(${student.id})">Delete</button>
                </div>
            `;
            container.appendChild(item);
        });
    } catch (err) {
        alert('Error loading students: ' + err.message);
    }
}

async function loadStudentClassSelect() {
    try {
        const response = await fetch(`${API}/classes`);
        const classes = await response.json();
        const select = document.getElementById('studentClass');
        select.innerHTML = '<option value="">-- Select a Class --</option>';
        classes.forEach(c => {
            const option = document.createElement('option');
            option.value = c.id;
            option.textContent = c.name;
            select.appendChild(option);
        });
    } catch (err) {
        console.error('Error loading classes:', err);
    }
}

async function addStudent() {
    const name = document.getElementById('studentName').value;
    const classId = document.getElementById('studentClass').value;
    const rollNumber = document.getElementById('studentRoll').value;
    const parentContact = document.getElementById('studentContact').value;

    if (!name || !classId || !rollNumber) {
        alert('Please fill all required fields');
        return;
    }

    try {
        const response = await fetch(`${API}/students`, {
            method: 'POST',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify({ name, class_id: classId, roll_number: rollNumber, parent_contact: parentContact })
        });

        const data = await response.json();
        if (data.success) {
            alert('Student added successfully!');
            document.getElementById('studentName').value = '';
            document.getElementById('studentClass').value = '';
            document.getElementById('studentRoll').value = '';
            document.getElementById('studentContact').value = '';
            loadStudents();
        }
    } catch (err) {
        alert('Error: ' + err.message);
    }
}

async function deleteStudent(id) {
    if (confirm('Are you sure?')) {
        try {
            const response = await fetch(`${API}/students/${id}`, { method: 'DELETE' });
            const data = await response.json();
            if (data.success) {
                alert('Student deleted!');
                loadStudents();
            }
        } catch (err) {
            alert('Error: ' + err.message);
        }
    }
}

// ==================== MANAGE - TIMETABLE SETUP ====================
async function loadTimetableSetup() {
    await loadTimetableClasses();
    await loadTimetableTeachers();
    await loadTimetableList();
}

async function loadTimetableClasses() {
    try {
        const response = await fetch(`${API}/classes`);
        const classes = await response.json();
        const select = document.getElementById('ttClass');
        select.innerHTML = '<option value="">-- Select a Class --</option>';
        classes.forEach(c => {
            const option = document.createElement('option');
            option.value = c.id;
            option.textContent = c.name;
            select.appendChild(option);
        });
    } catch (err) {
        console.error('Error loading classes:', err);
    }
}

async function loadTimetableTeachers() {
    try {
        const response = await fetch(`${API}/teachers`);
        const teachers = await response.json();
        const select = document.getElementById('ttTeacher');
        select.innerHTML = '<option value="">-- Select a Teacher --</option>';
        teachers.forEach(t => {
            const option = document.createElement('option');
            option.value = t.id;
            option.textContent = t.name;
            select.appendChild(option);
        });
    } catch (err) {
        console.error('Error loading teachers:', err);
    }
}

async function addTimetableEntry() {
    const classId = document.getElementById('ttClass').value;
    const teacherId = document.getElementById('ttTeacher').value;
    const period = document.getElementById('ttPeriod').value;
    const day = document.getElementById('ttDay').value;
    const subject = document.getElementById('ttSubject').value;

    if (!classId || !teacherId || !period || !day || !subject) {
        alert('Please fill all fields');
        return;
    }

    try {
        const response = await fetch(`${API}/timetable`, {
            method: 'POST',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify({ class_id: classId, teacher_id: teacherId, period, day, subject })
        });

        const data = await response.json();
        if (data.success) {
            alert('Timetable entry added!');
            document.getElementById('ttClass').value = '';
            document.getElementById('ttTeacher').value = '';
            document.getElementById('ttSubject').value = '';
            loadTimetableList();
        }
    } catch (err) {
        alert('Error: ' + err.message);
    }
}

async function loadTimetableList() {
    try {
        const response = await fetch(`${API}/timetable`);
        const timetable = await response.json();

        const container = document.getElementById('timetableSetupList');
        container.innerHTML = '';

        timetable.forEach(entry => {
            const item = document.createElement('div');
            item.className = 'list-item';
            item.innerHTML = `
                <div class="list-item-info">
                    <strong>${entry.day} - Period ${entry.period}</strong>
                    <p style="margin-top: 5px; color: #666;">Class: ${entry.class_name} | Teacher: ${entry.teacher_name} | Subject: ${entry.subject}</p>
                </div>
                <div class="list-item-actions">
                    <button class="btn btn-danger" onclick="deleteTimetableEntry(${entry.id})">Delete</button>
                </div>
            `;
            container.appendChild(item);
        });
    } catch (err) {
        alert('Error loading timetable: ' + err.message);
    }
}

async function deleteTimetableEntry(id) {
    if (confirm('Are you sure?')) {
        try {
            const response = await fetch(`${API}/timetable/${id}`, { method: 'DELETE' });
            const data = await response.json();
            if (data.success) {
                alert('Timetable entry deleted!');
                loadTimetableList();
            }
        } catch (err) {
            alert('Error: ' + err.message);
        }
    }
}

// ==================== REPORTS ====================
async function loadStudentReport() {
    const studentId = document.getElementById('reportStudent').value;
    if (!studentId) return;

    try {
        // Load attendance report
        const attendanceResponse = await fetch(`${API}/reports/attendance/${studentId}`);
        const attendanceData = await attendanceResponse.json();

        // Load marks report
        const marksResponse = await fetch(`${API}/reports/marks/${studentId}`);
        const marksData = await marksResponse.json();

        const container = document.getElementById('studentReport');
        container.innerHTML = `
            <div class="report-section">
                <h3>Attendance Report</h3>
                <div class="report-stat">
                    <div class="stat-box success">
                        <div class="stat-value">${attendanceData.present}</div>
                        <div class="stat-label">Present Days</div>
                    </div>
                    <div class="stat-box danger">
                        <div class="stat-value">${attendanceData.absent}</div>
                        <div class="stat-label">Absent Days</div>
                    </div>
                    <div class="stat-box">
                        <div class="stat-value">${attendanceData.onLeave}</div>
                        <div class="stat-label">On Leave</div>
                    </div>
                    <div class="stat-box success">
                        <div class="stat-value">${attendanceData.percentage}%</div>
                        <div class="stat-label">Attendance %</div>
                    </div>
                </div>
            </div>

            <div class="report-section">
                <h3>Marks Report</h3>
                ${marksData.length > 0 ? `
                    <ul class="marks-list">
                        ${marksData.map(m => `
                            <li><strong>${m.test_name} (${m.subject})</strong>: ${m.marks_obtained}/${m.total_marks}</li>
                        `).join('')}
                    </ul>
                ` : '<p style="font-size: 16px; color: #666;">No marks recorded yet</p>'}
            </div>
        `;
    } catch (err) {
        alert('Error loading report: ' + err.message);
    }
}

// Initialize on load
document.addEventListener('DOMContentLoaded', () => {
    // Check if user is logged in from manage section
    document.getElementById('manage-section').addEventListener('click', () => {
        if (!document.getElementById('classes-tab')) return;
        loadClassTeachers();
        loadStudentClassSelect();
    });
});
