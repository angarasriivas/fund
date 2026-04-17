const { initDb, dbPath } = require('./db');

console.log('Attempting to initialize SQLite database...');

initDb()
  .then(() => {
    console.log(`SUCCESS! SQLite ready at: ${dbPath}`);
    process.exit(0);
  })
  .catch((err) => {
    console.log('FAILED to initialize:', err.message);
    process.exit(1);
  });
