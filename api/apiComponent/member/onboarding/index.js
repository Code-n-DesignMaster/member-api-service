'use strict';

module.exports = (components) => {
  return {
    getOnboardings: require('./getOnboardings')(components),
    getOnboarding: require('./getOnboarding')(components),
    getOnboardingStep: require('./getOnboardingStep')(components),
    saveOnboardingStep: require('./saveOnboardingStep')(components)
  };
};
