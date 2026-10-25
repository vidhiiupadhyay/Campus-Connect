initDashboard('faculty', {

  Attendance(user, view) {
    const data = getData();

    view.innerHTML = `
      <h1>Mark attendance</h1>
      <div class="box">
        <label for="course">Course</label>
        <select id="course">${courseOptions(data)}</select>
        <p>Untick students who were absent today.</p>
        ${students(data).map(s => `
          <label class="row">
            <span><input type="checkbox" data-id="${s.id}" checked>${esc(s.name)}</span>
          </label>`).join('')}
        <br>
        <button id="save">Save attendance</button>
        <p id="msg" role="status"></p>
      </div>
    `;

    $('#save').onclick = () => {
      const course = $('#course').value;

      view.querySelectorAll('[data-id]').forEach(box => {
        const id = box.dataset.id;
        const record = att(data, id, course);

        data.attendance[id] = data.attendance[id] || {};   // create the student's object if missing
        data.attendance[id][course] = {
          present: record.present + (box.checked ? 1 : 0), // +1 only if ticked
          total: record.total + 1                          // +1 class held, for everyone
        };
      });

      saveData(data);
      $('#msg').textContent = 'Attendance saved.';
    };
  },

  Marks(user, view) {
    const data = getData();

    view.innerHTML = `
      <h1>Enter marks</h1>
      <div class="box">
        <label for="course">Course</label>
        <select id="course">${courseOptions(data)}</select>
        <div id="list"></div>
        <br>
        <button id="save">Save marks</button>
        <p id="msg" role="status"></p>
      </div>
    `;

    // Draw one number input per student for the selected course
    function drawList() {
      const course = $('#course').value;
      $('#list').innerHTML = students(data).map(s => {
        const existing = data.marks[s.id] && data.marks[s.id][course];
        return `
          <label class="row">${esc(s.name)}
            <input type="number" min="0" max="100" data-id="${s.id}"
                   value="${existing !== undefined ? existing : ''}">
          </label>`;
      }).join('');
    }

    $('#course').onchange = drawList;  // redraw when the course changes
    drawList();

    $('#save').onclick = () => {
      const course = $('#course').value;

      view.querySelectorAll('[data-id]').forEach(input => {
        if (input.value === '') return;                    // skip empty boxes
        const id = input.dataset.id;
        data.marks[id] = data.marks[id] || {};
        data.marks[id][course] = Math.min(100, Math.max(0, Number(input.value))); // clamp to 0..100
      });

      saveData(data);
      $('#msg').textContent = 'Marks saved.';
    };
  },

  Students(user, view) {
    const data = getData();

    const rows = students(data).map(s => [
      esc(s.name),
      esc(s.email),
      avg(data.courses.map(c => pct(att(data, s.id, c)))) + '%'
    ]);

    view.innerHTML = `
      <h1>My students</h1>
      ${table(['Name', 'Email', 'Avg attendance'], rows)}
    `;
  },

  Notices: noticesTab   // reuse the shared function from common.js

});