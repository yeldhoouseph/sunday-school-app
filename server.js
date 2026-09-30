import express from 'express';
import sqlite3 from 'sqlite3';
import bodyParser from 'body-parser';
import cors from 'cors';
import { fileURLToPath } from 'url';
import { dirname } from 'path';
import path from 'path';
import fs from 'fs';

const __filename = fileURLToPath(import.meta.url);
const __dirname = dirname(__filename);

const app = express();
const PORT = process.env.PORT || 3000;

app.use(bodyParser.json());
app.use(cors());
app.use(express.static('public'));

// Initialize SQLite Database
const dbPath = 'sunday_school.db';
const db = new sqlite3.Database(dbPath, (err) => {
  if (err) console.error('Database connection error:', err);
  else console.log('Connected to SQLite database');
});

// Run query helper
const runQuery = (sql, params = []) => {
  return new Promise((resolve, reject) => {
    db.run(sql, params, (err) => {
      if (err) reject(err);
      else resolve();
    });
  });
};

// Get query helper
const getQuery = (sql, params = []) => {
  return new Promise((resolve, reject) => {
    db.get(sql, params, (err, row) => {
      if (err) reject(err);
      else resolve(row);
    });
  });
};

// All query helper
const allQuery = (sql, params = []) => {
  return new Promise((resolve, reject) => {
    db.all(sql, params, (err, rows) => {
      if (err) reject(err);
      else resolve(rows || []);
    });
  });
};

// Initialize database with tables
const initDB = async () => {
  try {
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

    console.log('Database initialized successfully');
  } catch (err) {
    console.error('Database initialization error:', err);
  }
};

initDB();

// ==================== AUTHENTICATION ====================
app.post('/api/login', async (req, res) => {
  try {
    const { email, password } = req.body;
    const teacher = await getQuery('SELECT * FROM teachers WHERE email = ? AND password = ?', [email, password]);

    if (teacher) {
      res.json({ success: true, teacher });
    } else {
      res.status(401).json({ success: false, message: 'Invalid credentials' });
    }
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
});

// ==================== TEACHERS ====================
app.get('/api/teachers', async (req, res) => {
  try {
    const teachers = await allQuery('SELECT * FROM teachers ORDER BY name');
    res.json(teachers);
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
});

app.post('/api/teachers', async (req, res) => {
  try {
    const { name, email, phone, password } = req.body;
    await runQuery(
      'INSERT INTO teachers (name, email, phone, password) VALUES (?, ?, ?, ?)',
      [name, email, phone, password]
    );
    res.json({ success: true, message: 'Teacher added successfully' });
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
});

app.delete('/api/teachers/:id', async (req, res) => {
  try {
    await runQuery('DELETE FROM teachers WHERE id = ?', [req.params.id]);
    res.json({ success: true, message: 'Teacher deleted' });
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
});

// ==================== CLASSES ====================
app.get('/api/classes', async (req, res) => {
  try {
    const classes = await allQuery(`
      SELECT c.*, t.name as class_teacher_name
      FROM classes c
      LEFT JOIN teachers t ON c.class_teacher_id = t.id
      ORDER BY c.name
    `);
    res.json(classes);
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
});

app.post('/api/classes', async (req, res) => {
  try {
    const { name, class_teacher_id } = req.body;
    await runQuery(
      'INSERT INTO classes (name, class_teacher_id) VALUES (?, ?)',
      [name, class_teacher_id]
    );
    res.json({ success: true, message: 'Class created successfully' });
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
});

app.put('/api/classes/:id', async (req, res) => {
  try {
    const { name, class_teacher_id } = req.body;
    await runQuery(
      'UPDATE classes SET name = ?, class_teacher_id = ? WHERE id = ?',
      [name, class_teacher_id, req.params.id]
    );
    res.json({ success: true, message: 'Class updated' });
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
});

app.delete('/api/classes/:id', async (req, res) => {
  try {
    await runQuery('DELETE FROM classes WHERE id = ?', [req.params.id]);
    res.json({ success: true, message: 'Class deleted' });
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
});

// ==================== STUDENTS ====================
app.get('/api/students', async (req, res) => {
  try {
    const classId = req.query.class_id;
    let query = 'SELECT s.*, c.name as class_name FROM students s LEFT JOIN classes c ON s.class_id = c.id';
    let params = [];

    if (classId) {
      query += ' WHERE s.class_id = ?';
      params = [classId];
    }

    query += ' ORDER BY s.class_id, s.roll_number';
    const students = await allQuery(query, params);
    res.json(students);
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
});

app.post('/api/students', async (req, res) => {
  try {
    const { name, class_id, roll_number, parent_contact } = req.body;
    await runQuery(
      'INSERT INTO students (name, class_id, roll_number, parent_contact) VALUES (?, ?, ?, ?)',
      [name, class_id, roll_number, parent_contact]
    );
    res.json({ success: true, message: 'Student added successfully' });
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
});

app.delete('/api/students/:id', async (req, res) => {
  try {
    await runQuery('DELETE FROM students WHERE id = ?', [req.params.id]);
    res.json({ success: true, message: 'Student deleted' });
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
});

// ==================== TIMETABLE ====================
app.get('/api/timetable', async (req, res) => {
  try {
    const classId = req.query.class_id;
    let query = `
      SELECT t.*, c.name as class_name, te.name as teacher_name
      FROM timetable t
      LEFT JOIN classes c ON t.class_id = c.id
      LEFT JOIN teachers te ON t.teacher_id = te.id
    `;
    let params = [];

    if (classId) {
      query += ' WHERE t.class_id = ?';
      params = [classId];
    }

    query += ' ORDER BY t.day, t.period';
    const timetable = await allQuery(query, params);
    res.json(timetable);
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
});

app.post('/api/timetable', async (req, res) => {
  try {
    const { class_id, teacher_id, period, day, subject } = req.body;
    await runQuery(
      'INSERT INTO timetable (class_id, teacher_id, period, day, subject) VALUES (?, ?, ?, ?, ?)',
      [class_id, teacher_id, period, day, subject]
    );
    res.json({ success: true, message: 'Timetable entry added' });
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
});

app.delete('/api/timetable/:id', async (req, res) => {
  try {
    await runQuery('DELETE FROM timetable WHERE id = ?', [req.params.id]);
    res.json({ success: true, message: 'Timetable entry deleted' });
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
});

// ==================== ATTENDANCE ====================
app.post('/api/attendance', async (req, res) => {
  try {
    const { student_id, teacher_id, attendance_date, period, type, status, leave_reason, marked_by } = req.body;

    // Check if already exists
    const existing = await getQuery(
      'SELECT id FROM attendance WHERE (student_id = ? OR teacher_id = ?) AND attendance_date = ? AND period = ?',
      [student_id || null, teacher_id || null, attendance_date, period]
    );

    if (existing) {
      await runQuery(
        'UPDATE attendance SET status = ?, leave_reason = ? WHERE id = ?',
        [status, leave_reason, existing.id]
      );
    } else {
      await runQuery(
        'INSERT INTO attendance (student_id, teacher_id, attendance_date, period, type, status, leave_reason, marked_by) VALUES (?, ?, ?, ?, ?, ?, ?, ?)',
        [student_id, teacher_id, attendance_date, period, type, status, leave_reason, marked_by]
      );
    }
    res.json({ success: true, message: 'Attendance recorded' });
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
});

app.get('/api/attendance', async (req, res) => {
  try {
    const { student_id, teacher_id, attendance_date, class_id } = req.query;
    let query = 'SELECT a.*, s.name as student_name, t.name as teacher_name FROM attendance a LEFT JOIN students s ON a.student_id = s.id LEFT JOIN teachers t ON a.teacher_id = t.id WHERE 1=1';
    let params = [];

    if (student_id) {
      query += ' AND a.student_id = ?';
      params.push(student_id);
    }
    if (teacher_id) {
      query += ' AND a.teacher_id = ?';
      params.push(teacher_id);
    }
    if (attendance_date) {
      query += ' AND a.attendance_date = ?';
      params.push(attendance_date);
    }

    const attendance = await allQuery(query, params);
    res.json(attendance);
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
});

// ==================== MARKS ====================
app.post('/api/marks', async (req, res) => {
  try {
    const { student_id, class_id, subject, test_name, marks_obtained, total_marks, recorded_by } = req.body;
    await runQuery(
      'INSERT INTO marks (student_id, class_id, subject, test_name, marks_obtained, total_marks, recorded_by) VALUES (?, ?, ?, ?, ?, ?, ?)',
      [student_id, class_id, subject, test_name, marks_obtained, total_marks, recorded_by]
    );
    res.json({ success: true, message: 'Marks recorded successfully' });
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
});

app.get('/api/marks', async (req, res) => {
  try {
    const { student_id, class_id, subject } = req.query;
    let query = 'SELECT m.*, s.name as student_name, c.name as class_name FROM marks m LEFT JOIN students s ON m.student_id = s.id LEFT JOIN classes c ON m.class_id = c.id WHERE 1=1';
    let params = [];

    if (student_id) {
      query += ' AND m.student_id = ?';
      params.push(student_id);
    }
    if (class_id) {
      query += ' AND m.class_id = ?';
      params.push(class_id);
    }
    if (subject) {
      query += ' AND m.subject = ?';
      params.push(subject);
    }

    query += ' ORDER BY m.recorded_date DESC';
    const marks = await allQuery(query, params);
    res.json(marks);
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
});

app.delete('/api/marks/:id', async (req, res) => {
  try {
    await runQuery('DELETE FROM marks WHERE id = ?', [req.params.id]);
    res.json({ success: true, message: 'Mark deleted' });
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
});

// ==================== REPORTS ====================
app.get('/api/reports/attendance/:studentId', async (req, res) => {
  try {
    const { studentId } = req.params;
    const records = await allQuery(
      'SELECT * FROM attendance WHERE student_id = ? ORDER BY attendance_date DESC',
      [studentId]
    );
    const present = records.filter(r => r.status === 'present').length;
    const absent = records.filter(r => r.status === 'absent').length;
    const onLeave = records.filter(r => r.status === 'leave').length;
    const percentage = records.length > 0 ? ((present / records.length) * 100).toFixed(2) : 0;

    res.json({ present, absent, onLeave, percentage, total: records.length });
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
});

app.get('/api/reports/marks/:studentId', async (req, res) => {
  try {
    const { studentId } = req.params;
    const marks = await allQuery(
      'SELECT subject, test_name, marks_obtained, total_marks FROM marks WHERE student_id = ? ORDER BY recorded_date DESC',
      [studentId]
    );
    res.json(marks);
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
});

// Start server
app.listen(PORT, () => {
  console.log(`\n✅ Server running at http://localhost:${PORT}`);
  console.log(`📱 Open this URL in your browser to access the app\n`);
});
