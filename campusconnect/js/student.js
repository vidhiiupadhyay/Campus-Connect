initDashboard('student', {
  Overview(user, view) { view.innerHTML = '<h1>Overview</h1><p>Coming in Step 6.</p>'; },
  Courses(user, view)  { view.innerHTML = '<h1>My courses</h1><p>Coming in Step 6.</p>'; },
  Notices(user, view)  { view.innerHTML = '<h1>Notices</h1><p>Coming in Step 6.</p>'; }
});
initDashboard('student', {

  Overview(user, view) {
    const data = getData();

    // One attendance % per course, and one marks value per course
    const attendances = data.courses.map(c => pct(att(data, user.id, c)));
    const marks = data.courses.map(c =>
      (data.marks[user.id] && data.marks[user.id][c]) || 0
    );

    view.innerHTML = `
      <h1>Welcome, ${esc(user.name)}</h1>
      <div class="grid">
        ${stat('Average attendance', avg(attendances) + '%')}
        ${stat('Average marks', avg(marks) + '/100')}
        ${stat('Courses', data.courses.length)}
      </div>
      <h2>Latest notice</h2>
      ${noticeList(data.notices.slice(0, 1))}
    `;
  },

  Courses(user, view) {
    const data = getData();

    const rows = data.courses.map(course => {
      const percent = pct(att(data, user.id, course));
      const mark = data.marks[user.id] && data.marks[user.id][course];

      return [
        course,
        `<span class="${percent >= 75 ? 'ok' : 'low'}">${percent}%</span>`,
        mark === undefined ? 'Not entered' : mark + '/100'
      ];
    });

    view.innerHTML = `
      <h1>My courses</h1>
      ${table(['Course', 'Attendance', 'Marks'], rows)}
      <p><small>Attendance below 75% is shown in red.</small></p>
    `;
  },

  Notices(user, view) {
    const data = getData();
    view.innerHTML = `<h1>Notices</h1>${noticeList(data.notices)}`;
  }

});