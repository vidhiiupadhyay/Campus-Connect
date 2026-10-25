// ---------- Data layer (LocalStorage) ----------
const KEY = 'cc_data';

// Starting data. It is copied into LocalStorage the first time the site loads.
const seed = {
  users: [
    { id: 1, name: 'Admin User',       email: 'admin@campus.edu',   password: 'admin123',   role: 'admin' },
    { id: 2, name: 'Dr. Meera Sharma', email: 'faculty@campus.edu', password: 'faculty123', role: 'faculty' },
    { id: 3, name: 'Riya Singh',       email: 'student@campus.edu', password: 'student123', role: 'student' },
    { id: 4, name: 'Aman Verma',       email: 'aman@campus.edu',    password: 'student123', role: 'student' }
  ],
  courses: ['Web Technologies', 'Data Structures', 'DBMS'],

  // attendance[studentId][course] = { present, total }
  attendance: {
    3: {
      'Web Technologies': { present: 18, total: 20 },
      'Data Structures':  { present: 14, total: 20 },
      'DBMS':             { present: 17, total: 20 }
    }
  },

  // marks[studentId][course] = number out of 100
  marks: {
    3: { 'Web Technologies': 82, 'Data Structures': 74, 'DBMS': 68 }
  },

  notices: [
    { id: 1, title: 'Welcome to CampusConnect', body: 'Mid-semester exams begin next month.', date: '2026-10-25' }
  ]
};

// Read all data. If nothing is saved yet, save the seed first.
function getData() {
  try {
    const saved = JSON.parse(localStorage.getItem(KEY));
    if (saved) return saved;
  } catch (e) {
    // saved text was corrupted, so fall through and reset
  }
  localStorage.setItem(KEY, JSON.stringify(seed));
  return JSON.parse(JSON.stringify(seed));
}

// Write all data back
function saveData(data) {
  localStorage.setItem(KEY, JSON.stringify(data));
}

// ---------- Auth (add below your existing code) ----------
const SESSION = 'cc_user';

// Who is logged in? Returns the saved user object, or null.
function currentUser() {
  return JSON.parse(localStorage.getItem(SESSION) || 'null');
}

function logout() {
  localStorage.removeItem(SESSION);
  location.href = 'index.html';
}

// Shortcut so we can write $('#email') instead of document.querySelector('#email')
const $ = selector => document.querySelector(selector);

// ---------- Helpers and dashboard shell (add below your existing code) ----------

// Turns user-supplied text into safe text so it can't inject HTML/JS (XSS protection)
function esc(text) {
  const div = document.createElement('div');
  div.textContent = text;
  return div.innerHTML;
}

// Builds the sidebar + main area, protects the page, and switches tabs.
// role: 'student' | 'faculty' | 'admin'
// tabs: an object like { Overview: function, Courses: function }
function initDashboard(role, tabs) {
  const user = currentUser();

  // Route guard: not logged in, or wrong role for this page, so go back to login
  if (!user || user.role !== role) {
    location.href = 'index.html';
    return;
  }

  const names = Object.keys(tabs); // e.g. ['Overview', 'Courses', 'Notices']

  $('#app').innerHTML = `
    <aside class="sidebar">
      <h2>CampusConnect</h2>
      <div class="who">${esc(user.name)}<br><small>${role}</small></div>
      <nav>
        ${names.map(name => `<a href="#${name}">${name}</a>`).join('')}
      </nav>
      <button id="logout">Log out</button>
    </aside>
    <main id="view"></main>
  `;

  $('#logout').onclick = logout;

  // Show the tab named in the URL hash (#Courses), or the first tab by default
  function showTab() {
    const hash = location.hash.slice(1);
    const tab = names.includes(hash) ? hash : names[0];

    document.querySelectorAll('.sidebar a').forEach(link => {
      link.classList.toggle('active', link.textContent === tab);
    });

    $('#view').innerHTML = '';
    tabs[tab](user, $('#view')); // run that tab's function
  }

  window.onhashchange = showTab; // runs when the user clicks a sidebar link
  showTab();                     // runs once on page load
}

// ---------- Data helpers (add below your existing code) ----------

// Attendance record for one student in one course. Returns zeros if none exists yet.
function att(data, studentId, course) {
  return (data.attendance[studentId] && data.attendance[studentId][course])
    || { present: 0, total: 0 };
}

// Attendance as a whole-number percentage
function pct(record) {
  return record.total ? Math.round(record.present / record.total * 100) : 0;
}

// Average of an array of numbers, rounded
function avg(numbers) {
  if (numbers.length === 0) return 0;
  const sum = numbers.reduce((total, n) => total + n, 0);
  return Math.round(sum / numbers.length);
}

// A summary card: big number on top, label below
function stat(label, value) {
  return `<div class="card"><h3>${value}</h3><p>${label}</p></div>`;
}

// Builds an HTML table from header names and an array of rows
function table(heads, rows) {
  const head = heads.map(h => `<th>${h}</th>`).join('');
  const body = rows
    .map(row => `<tr>${row.map(cell => `<td>${cell}</td>`).join('')}</tr>`)
    .join('');
  return `<table><tr>${head}</tr>${body}</table>`;
}

// Builds HTML for a list of notices. Pass true as the second argument to show Delete buttons.
function noticeList(notices, canDelete) {
  if (notices.length === 0) return '<p>No notices yet.</p>';
  return notices.map(n => `
    <div class="notice">
      <b>${esc(n.title)}</b> <small>${n.date}</small>
      <p>${esc(n.body)}</p>
      ${canDelete ? `<button class="danger" data-del="${n.id}">Delete</button>` : ''}
    </div>`).join('');
}

// ---------- Faculty/admin helpers (add below your existing code) ----------

// Only the users whose role is 'student'
function students(data) {
  return data.users.filter(u => u.role === 'student');
}

// <option> tags for a course dropdown
function courseOptions(data) {
  return data.courses.map(c => `<option>${c}</option>`).join('');
}

// Notices tab, shared by faculty and admin: post a notice, delete a notice
function noticesTab(user, view) {
  function draw() {
    const data = getData();

    view.innerHTML = `
      <h1>Notices</h1>
      <form id="noticeForm" class="box">
        <input name="title" placeholder="Title" required>
        <textarea name="body" placeholder="Message" rows="3" required></textarea>
        <button>Post notice</button>
      </form>
      ${noticeList(data.notices, true)}
    `;

    $('#noticeForm').onsubmit = e => {
      e.preventDefault();
      const form = new FormData(e.target);   // reads fields by their name=""
      data.notices.unshift({                 // unshift adds to the FRONT (newest first)
        id: Date.now(),                      // timestamp works as a unique id
        title: form.get('title').trim(),
        body: form.get('body').trim(),
        date: new Date().toISOString().slice(0, 10)  // e.g. 2026-10-25
      });
      saveData(data);
      draw();                                // redraw the tab to show the change
    };

    view.querySelectorAll('[data-del]').forEach(button => {
      button.onclick = () => {
        data.notices = data.notices.filter(n => n.id != button.dataset.del);
        saveData(data);
        draw();
      };
    });
  }

  draw();
}