const bcrypt = require('bcryptjs');

bcrypt.hash('123456', 10).then(hash => {
  console.log('Password: 123456');
  console.log('Hash:', hash);
  console.log('\nCopy hash này vào seed.sql');
});
