const rp = require('request-promise');
const config = require('./config');

process.env.NODE_TLS_REJECT_UNAUTHORIZED = '0';

const login = async (email, password) => {
  global.token = '';

  const options = {
    method: 'POST',
    uri: `${config.memberApiServiceUrl}/auth`,
    body: {
      email: email,
      password: password,
      rememberMe: false,
    },
    json: true,
  };
  const response = await rp(options);
  console.log('Login response', response);
  global.token = response.accessToken;
}

const logout = async () => {
  const options = {
    method: 'DELETE',
    uri: `${config.memberApiServiceUrl}/auth`,
    headers: {
      Authorization: `Bearer ${global.token}`,
    },
  };
  const response = await rp(options);
  console.log('Logout response', response);
  global.token = '';
}

module.exports = {
  login,
  logout,
};
