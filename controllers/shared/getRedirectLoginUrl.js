'use strict';

module.exports = settingsCategory => {
  let loginUrl;

  settingsCategory.some(category => {
    if (category.categoryTechnicalName === 'general') {
      category.settings.some(setting => {
        if (setting.settingTechnicalName === 'logoutAddress') {
          loginUrl = setting.value;
          return true;
        }
        return false;
      });
      return true;
    }
    return false;
  });

  return loginUrl;
};
