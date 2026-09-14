const EMAIL_REGEX = /^[\w.-]+@([\w-]+\.)+[\w-]{2,4}$/;

function isValidEmail(email) {
  return typeof email === 'string' && EMAIL_REGEX.test(email.trim());
}

function isStrongEnoughPassword(password, minLength = 6) {
  return typeof password === 'string' && password.length >= minLength;
}

module.exports = { isValidEmail, isStrongEnoughPassword };
