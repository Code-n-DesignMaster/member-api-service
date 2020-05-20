const config = require('./helpers/config');
const {
  login,
  logout
} = require('./helpers/hooks');

before((done) => {
  login(config.testLogin, config.testPassword)
    .then(() => done());
});

after((done) => {
  logout()
    .then(() => done());
});
