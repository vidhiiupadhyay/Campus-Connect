getData(); // makes sure the demo data exists in LocalStorage

// If someone is already logged in, send them straight to their dashboard
if (currentUser()) {
  location.href = currentUser().role + '.html';
}

$('#loginForm').onsubmit = function (event) {
  event.preventDefault(); // stop the browser from reloading the page

  const email = $('#email').value.trim().toLowerCase();
  const password = $('#password').value;

  // Look through all users for one whose email AND password both match
  const user = getData().users.find(
    u => u.email.toLowerCase() === email && u.password === password
  );

  if (!user) {
    $('#error').textContent = 'Wrong email or password. Please try again.';
    return;
  }

  // Remember who logged in (never store the password in the session)
  localStorage.setItem(SESSION, JSON.stringify({
    id: user.id,
    name: user.name,
    role: user.role
  }));

  // Go to student.html, faculty.html or admin.html
  location.href = user.role + '.html';
};