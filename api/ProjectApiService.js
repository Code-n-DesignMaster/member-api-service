'use strict'; 
 
const { Request } = require('@sp/nodejs-utils').classes; 
const config = require('../config'); 
 
const request = new Request(config.apiUrls.projectService).freezy(); 

module.exports = {
  republish(projectId, userId) {
    return request.exec({ 
      endpoint: `/projects/${projectId}/republish?userId=${userId}`,
      apiKey: config.apiKeys.servicesApiKey,
      method: 'PUT',
    }).then(r => r.body); 
  }
}
