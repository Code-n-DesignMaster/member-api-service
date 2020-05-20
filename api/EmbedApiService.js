'use strict'; 
 
const { Request } = require('@sp/nodejs-utils').classes; 
const { AccessTokenGenerator } = require('../app/classes/generators');
const config = require('../config'); 

 
const request = new Request(config.apiUrls.embedService).freezy(); 

module.exports = {
  async create(userId, block) {
    return request.exec({ 
      endpoint: `/embed`, 
      method: 'POST',
      bearer: await new AccessTokenGenerator(userId).generate(),
      body: block,
    }).then(r => r.body); 
  },
}
