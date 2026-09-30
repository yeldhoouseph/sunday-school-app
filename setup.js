import sqlite3 from 'sqlite3';
import { fileURLToPath } from 'url';
import { dirname } from 'path';

const __filename = fileURLToPath(import.meta.url);
const __dirname = dirname(__filename);

const db = new sqlite3.Database('sunday_school.db', (err) => {
    if (err) {
        console.error('Database error:', err);
        process.exit(1);
    }
    console.log('Connected to database for setup...');
    createTables().then(() => initializeDemoData());
});

const runQuery = (sql, params = []) => {
    return new Promise((resolve, reject) => {
        db.run(sql, params, (err) => {
            if (err) reject(err);
            else resolve();
        });
    });
};

async function createTables() {
    try {
        console.log('Creating database tables...\n');

        // Teachers table
        await runQuery(`
            CREATE TABLE IF NOT EXISTS teachers (
                id INTEGER PRIMARY KEY AUTOINCREMENT,
                name TEXT NOT NULL,
                email TEXT,
                phone TEXT,
                password TEXT NOT NULL,
                created_at DATETIME DEFAULT CURRENT_TIMESTAMP
            )
        `);

        // Classes table
        await runQuery(`
            CREATE TABLE IF NOT EXISTS classes (
                id INTEGER PRIMARY KEY AUTOINCREMENT,
                name TEXT NOT NULL UNIQUE,
                class_teacher_id INTEGER,
                student_count INTEGER DEFAULT 0,
                created_at DATETIME DEFAULT CURRENT_TIMESTAMP,
                FOREIGN KEY (class_teacher_id) REFERENCES teachers(id)
            )
        `);

        // Students table
        await runQuery(`
            CREATE TABLE IF NOT EXISTS students (
                id INTEGER PRIMARY KEY AUTOINCREMENT,
                name TEXT NOT NULL,
                class_id INTEGER NOT NULL,
                roll_number TEXT NOT NULL,
                parent_contact TEXT,
                created_at DATETIME DEFAULT CURRENT_TIMESTAMP,
                FOREIGN KEY (class_id) REFERENCES classes(id)
            )
        `);

        // Timetable table
        await runQuery(`
            CREATE TABLE IF NOT EXISTS timetable (
                id INTEGER PRIMARY KEY AUTOINCREMENT,
                class_id INTEGER NOT NULL,
                teacher_id INTEGER NOT NULL,
                period INTEGER NOT NULL,
                day TEXT NOT NULL,
                subject TEXT,
                created_at DATETIME DEFAULT CURRENT_TIMESTAMP,
                FOREIGN KEY (class_id) REFERENCES classes(id),
                FOREIGN KEY (teacher_id) REFERENCES teachers(id)
            )
        `);

        // Attendance table
        await runQuery(`
            CREATE TABLE IF NOT EXISTS attendance (
                id INTEGER PRIMARY KEY AUTOINCREMENT,
                student_id INTEGER,
                teacher_id INTEGER,
                attendance_date DATE NOT NULL,
                period INTEGER,
                type TEXT NOT NULL,
                status TEXT NOT NULL,
                leave_reason TEXT,
                marked_by INTEGER,
                created_at DATETIME DEFAULT CURRENT_TIMESTAMP,
                FOREIGN KEY (student_id) REFERENCES students(id),
                FOREIGN KEY (teacher_id) REFERENCES teachers(id),
                FOREIGN KEY (marked_by) REFERENCES teachers(id)
            )
        `);

        // Marks table
        await runQuery(`
            CREATE TABLE IF NOT EXISTS marks (
                id INTEGER PRIMARY KEY AUTOINCREMENT,
                student_id INTEGER NOT NULL,
                class_id INTEGER NOT NULL,
                subject TEXT NOT NULL,
                test_name TEXT NOT NULL,
                marks_obtained REAL NOT NULL,
                total_marks REAL NOT NULL,
                recorded_by INTEGER,
                recorded_date DATETIME DEFAULT CURRENT_TIMESTAMP,
                FOREIGN KEY (student_id) REFERENCES students(id),
                FOREIGN KEY (class_id) REFERENCES classes(id),
                FOREIGN KEY (recorded_by) REFERENCES teachers(id)
            )
        `);

        console.log('✓ All tables created\n');
    } catch (err) {
        if (err.code !== 'SQLITE_ERROR') {
            throw err;
        }
    }
}

async function initializeDemoData() {
    try {
        console.log('Adding demo data...\n');

        // Add demo teachers
        const teachers = [
            { name: 'Admin User', email: 'admin@school.com', phone: '9999999999', password: 'admin123' },
            { name: 'John Smith', email: 'john@school.com', phone: '9876543210', password: 'teacher123' },
            { name: 'Sarah Williams', email: 'sarah@school.com', phone: '9876543211', password: 'teacher123' },
            { name: 'Mike Johnson', email: 'mike@school.com', phone: '9876543212', password: 'teacher123' },
            { name: 'Emma Brown', email: 'emma@school.com', phone: '9876543213', password: 'teacher123' },
            { name: 'David Lee', email: 'david@school.com', phone: '9876543214', password: 'teacher123' }
        ];

        console.log('Adding teachers...');
        for (const teacher of teachers) {
            await runQuery(
                'INSERT OR IGNORE INTO teachers (name, email, phone, password) VALUES (?, ?, ?, ?)',
                [teacher.name, teacher.email, teacher.phone, teacher.password]
            );
        }
        console.log(`✓ ${teachers.length} teachers added\n`);

        // Get teacher IDs for classes
        const db_promise = new Promise(resolve => {
            db.all('SELECT id, name FROM teachers', (err, rows) => {
                resolve(rows);
            });
        });
        const teachersData = await db_promise;

        // Add demo classes
        const classes = [
            { name: 'Class 1', class_teacher_id: teachersData[1]?.id || 1 },
            { name: 'Class 2', class_teacher_id: teachersData[2]?.id || 2 },
            { name: 'Class 3', class_teacher_id: teachersData[3]?.id || 3 },
            { name: 'Class 4', class_teacher_id: teachersData[4]?.id || 4 },
            { name: 'Class 5', class_teacher_id: teachersData[5]?.id || 5 }
        ];

        console.log('Adding classes...');
        for (const cls of classes) {
            await runQuery(
                'INSERT OR IGNORE INTO classes (name, class_teacher_id) VALUES (?, ?)',
                [cls.name, cls.class_teacher_id]
            );
        }
        console.log(`✓ ${classes.length} classes added\n`);

        // Get class IDs
        const classes_promise = new Promise(resolve => {
            db.all('SELECT id, name FROM classes', (err, rows) => {
                resolve(rows);
            });
        });
        const classesData = await classes_promise;

        // Add demo students
        console.log('Adding students...');
        const studentNames = [
            'Aarjun Patel', 'Bhavna Singh', 'Chirag Desai', 'Deepika Roy', 'Ethan Kumar',
            'Fiona Sharma', 'Gaurav Verma', 'Harshita Nair', 'Ishaan Gupta', 'Jiya Mishra',
            'Kabir Reddy', 'Lata Rao', 'Manish Chopra', 'Neha Kapoor', 'Omkar Yadav',
            'Priya Sinha', 'Quincy West', 'Ritika Dutta', 'Sanjay Tiwari', 'Tina Mehta',
            'Uday Pandey', 'Veda Singh', 'Wyatt Brown', 'Xena Malik', 'Yash Chatterjee',
            'Zara Khan', 'Aditya Bhat', 'Bhakti Mahajan', 'Chhavi Saxena', 'Divyanka Rao'
        ];

        let studentCount = 0;
        for (const cls of classesData) {
            const studentsInClass = 6; // 6 students per class
            for (let i = 0; i < studentsInClass; i++) {
                if (studentCount >= studentNames.length) break;
                const name = studentNames[studentCount];
                const rollNumber = String(i + 1).padStart(2, '0');
                const parentContact = '98765432' + String(10 + studentCount).padStart(2, '0');

                await runQuery(
                    'INSERT OR IGNORE INTO students (name, class_id, roll_number, parent_contact) VALUES (?, ?, ?, ?)',
                    [name, cls.id, rollNumber, parentContact]
                );
                studentCount++;
            }
        }
        console.log(`✓ ${studentCount} students added\n`);

        // Add demo timetable entries
        console.log('Adding timetable entries...');
        const days = ['Monday', 'Tuesday', 'Wednesday', 'Thursday', 'Friday'];
        const subjects = ['English', 'Math', 'Science', 'History', 'Geography'];

        let ttCount = 0;
        for (const cls of classesData) {
            for (const day of days) {
                for (let period = 1; period <= 3; period++) {
                    const teacher = teachersData[Math.floor(Math.random() * (teachersData.length - 1)) + 1];
                    const subject = subjects[Math.floor(Math.random() * subjects.length)];

                    await runQuery(
                        'INSERT OR IGNORE INTO timetable (class_id, teacher_id, period, day, subject) VALUES (?, ?, ?, ?, ?)',
                        [cls.id, teacher.id, period, day, subject]
                    );
                    ttCount++;
                }
            }
        }
        console.log(`✓ ${ttCount} timetable entries added\n`);

        console.log('===========================================');
        console.log('✅ Demo Data Setup Completed!');
        console.log('===========================================');
        console.log('\n📝 Demo Login Credentials:');
        console.log('   Email: admin@school.com');
        console.log('   Password: admin123');
        console.log('\n   Other teachers can use email and password: teacher123');
        console.log('\n   (Examples: john@school.com, sarah@school.com, etc.)');
        console.log('\n🚀 To start the server, run: npm start\n');

        db.close();
        process.exit(0);
    } catch (err) {
        console.error('Error during setup:', err);
        db.close();
        process.exit(1);
    }
}
