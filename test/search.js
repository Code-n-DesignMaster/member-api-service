const config = require('./helpers/config');
let request = require('supertest');
request = request(config.serviceUrl);

const {
  search,
} = require('./mocks/index');

// describe('Search controller', () => {
//   describe('Search adress', () => {
//     it('adresses list', (done) => {
//       request.get(`/search/geo?value=Martin%20Pl%201&accessToken=${global.token}`)
//         .expect(200, search, done);
//     });
//   });
// });
