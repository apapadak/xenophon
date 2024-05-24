const bcrypt = require('bcrypt');
bcrypt.hash('test', 10, function(err, hash) {
  if (err) {
    return console.error('Error loading bcrypt:', err);
  }
  console.log('Bcrypt hash:', hash);
});
