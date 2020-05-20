const config = {
  testLogin: 'nodejs.test@siteplus.com',
  testPassword: 'password1234',
  eventsTest: {
    testLogin: 'nodejs.test.events@siteplus.com',
    testPassword: '12345678',
    testUserId: 1075782,
  },
  partnerTest: {
    testLogin: 'nodejs.test.partner@siteplus.com',
    testPassword: '12345678',
  },
  serviceUrl: `https://member-api-service.siteplus.wtf`,
  memberApiServiceUrl: 'https://member-api-service.siteplus.wtf',
  apiKey: '8d6fc59179ee4d9dbd720fb32726d0f0',
  memberApiUrl: 'https://member-api.dev.siteplus.com/1.1',
  testUserId: 1001610,
  regex: {
    id: new RegExp('^[a-zA-Z0-9]{8}-[a-zA-Z0-9]{4}-[a-zA-Z0-9]{4}-[a-zA-Z0-9]{4}-[a-zA-Z0-9]{12}'),
    date: new RegExp('^\\d{4}-\\d{2}-\\d{2}T\\d{2}:\\d{2}:\\d{2}.\\d{2,4}Z'),
    siteplusSubUrl: new RegExp('^[a-zA-Z0-9\\-]+\\.siteplus\\.wtf'),
    ecwid_sso_admin_panel_url: new RegExp('^https:\\/\\/my\\.shopsettings\\.com\\/cp\\/partner-login\\?ownerid=14594092&t=\\d{10}&login_sha1token=[a-zA-Z0-9]{40}&logout_url=https:\\/\\/siteplus.com\\/login&upgrade_url=https:\\/\\/siteplus.com\\/dashboard'),
    ecwid_sso_profile: new RegExp('^[a-zA-Z0-9]{100}\\s[a-zA-Z0-9]{40}\\s\\d{10}'),
    url: new RegExp('^https:\\/\\/[a-zA-Z0-9\\-]+\\.[a-z]+\\.[a-z]+\\/[a-zA-Z0-9\\-\\/\\.?=]+'),
    defaultUserEmail: new RegExp('^[a-zA-Z0-9_\\-]+@siteplus\\.com'),
    imageApiSrc: new RegExp(`^https:\\/\\/image-api-service\\.siteplus\\.wtf\\/projects\\/[a-zA-Z0-9]{8}-[a-zA-Z0-9]{4}-[a-zA-Z0-9]{4}-[a-zA-Z0-9]{4}-[a-zA-Z0-9]{12}`),
    templateSrc: new RegExp(`^(\\/projects\\/[a-zA-Z0-9]{8}-[a-zA-Z0-9]{4}-[a-zA-Z0-9]{4}-[a-zA-Z0-9]{4}-[a-zA-Z0-9]{12})|(https:\\/\\/[a-zA-Z0-9\\-]+\\.[a-z]+\\.[a-z]+\\/[a-zA-Z0-9\\-\\/\\.?=]+)`),
  },
};

if (process.env.NODE_ENV === "local") {
  config.serviceUrl = "http://localhost:9007";
  config.memberApiServiceUrl = "http://localhost:9007";
}

module.exports = config;
