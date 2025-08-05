// Password management logic
function getPassword() {
  return localStorage.getItem('userPassword') || '';
}

function setPassword(newPass) {
  localStorage.setItem('userPassword', newPass);
}

document.addEventListener('DOMContentLoaded', function() {
  const form = document.getElementById('password-form');
  const msg = document.getElementById('password-message');
  form.addEventListener('submit', function(e) {
    e.preventDefault();
    const current = document.getElementById('current-password').value;
    const next = document.getElementById('new-password').value;
    if (!next) {
      msg.textContent = 'New password cannot be empty.';
      msg.style.color = 'red';
      return;
    }
    if (getPassword() && current !== getPassword()) {
      msg.textContent = 'Current password is incorrect.';
      msg.style.color = 'red';
      return;
    }
    setPassword(next);
    msg.textContent = 'Password updated!';
    msg.style.color = 'green';
    form.reset();
  });
});
