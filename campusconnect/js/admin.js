initDashboard('admin', {

  Overview(user, view) {
    const data = getData();
    const facultyCount = data.users.filter(u => u.role === 'faculty').length;

    view.innerHTML = `
      <h1>Campus overview</h1>
      <div class="grid">
        ${stat('Students', students(data).length)}
        ${stat('Faculty', facultyCount)}
        ${stat('Courses', data.courses.length)}
        ${stat('Notices', data.notices.length)}
      </div>
    `;
  },

  Users(user, view) {
    // message is shown under the form after an action, e.g. "User added."
    function draw(message = '') {
      const data = getData();

      const rows = data.users.map(u => [
        esc(u.name),
        esc(u.email),
        u.role,
        // admin accounts get no Delete button, so you can't lock yourself out
        u.role === 'admin' ? '' : `<button class="danger" data-del="${u.id}">Delete</button>`
      ]);

      view.innerHTML = `
        <h1>Manage users</h1>
        <form id="userForm" class="box">
          <input name="name" placeholder="Full name" required>
          <input name="email" type="email" placeholder="Email" required>
          <input name="password" placeholder="Temporary password" required>
          <select name="role">
            <option>student</option>
            <option>faculty</option>
          </select>
          <button>Add user</button>
          <p id="msg" role="status">${message}</p>
        </form>
        ${table(['Name', 'Email', 'Role', ''], rows)}
      `;

      // Add a user
      $('#userForm').onsubmit = e => {
        e.preventDefault();
        const form = new FormData(e.target);
        const email = form.get('email').trim().toLowerCase();

        // Emails must be unique because login looks users up by email
        if (data.users.some(u => u.email.toLowerCase() === email)) {
          draw('That email is already registered.');
          return;
        }

        data.users.push({
          id: Date.now(),
          name: form.get('name').trim(),
          email: email,
          password: form.get('password'),
          role: form.get('role')
        });
        saveData(data);
        draw('User added.');
      };

      // Delete a user
      view.querySelectorAll('[data-del]').forEach(button => {
        button.onclick = () => {
          data.users = data.users.filter(u => u.id != button.dataset.del);
          saveData(data);
          draw('User deleted.');
        };
      });
    }

    draw();
  },

  Notices: noticesTab   // same shared function faculty uses

});