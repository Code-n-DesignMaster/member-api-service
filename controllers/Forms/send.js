'use strict';

const _ = require('lodash');
const { ValidationError, NotFound } = require('@sp/nodejs-utils').errors;

const config = require('../../config');
const logger = require('../../helpers/logger');

const Menu = require('../../utils/classes/Menu');
const apiComponent = require('../../api/apiComponent');
const memberApi = apiComponent.getApi('member');
const editorApi = apiComponent.getApi('editor');

const freeSuffix = config.freeDomainSuffix;

const models = require('@sp/mongoose-models');
const Project = models.Project;
const ProjectMenu = models.ProjectTemplateMenu;
const ProjectFormFields = models.ProjectFormFields;

module.exports = function (req, res, next) {
  const { projectId } = req.params;
  const { hash, formName } = req.body;
  const dataToSend = [];
  const dataFromReq = req.body.data;
  let connection;

  ProjectFormFields.findOne({
    projectId,
    'forms.hash': hash
  })
    .select('forms.$')
    .lean()
    .then(doc => {
      if (!doc) return;
      connection = doc.forms[0].connection;
      const fields = doc.forms[0].fields;

      const messages = validateFormFields(dataFromReq, fields);

      if (messages.length > 0) {
        return Promise.reject(new ValidationError(messages));
      }

      const concatedArray = fields
        .reduce((a, b) => {
          const prev = a.type === 'row' ? a.elements : a;
          const curr = b.type === 'row' ? b.elements : b;

          return [].concat(prev, curr);
        }, []);

      concatedArray.forEach((field) => {

        const hash = field.hash;
        const item = req.body.data.find(item => item.key === hash);
        const required = field.options.validationRules && field.options.validationRules.required;

        if (!item.value) return;

        if (required && !item) {
          return Promise.reject(new NotFound('FIELD_REQUIRED'));
        }

        if (item) {
          dataToSend.push({
            key: field.options.label || field.options.uniqName || field.type,
            value: field.options.isSplit ? item.value.join(' ') : item.value
          });
        }
      });
    })
    .then(() => {
      const sendActions = [];
      const googleListId = _.get(connection, 'google.id');
      const mailchimpListId = _.get(connection, 'mailchimp.id');
      const email = _.get(connection, 'email.email') || _.get(connection, 'email');
      const emailDisabled = _.get(connection, 'email.disabled');

      if (!emailDisabled || (!googleListId && !mailchimpListId)) {
        sendToEmail(projectId, dataToSend, req.accessToken, email, formName, req.body.page);
      }

      if (mailchimpListId) {
        sendActions.push(sendToService(dataToSend, {
          projectId,
          vendor: 'mailchimp',
          listId: mailchimpListId,
        }));
      }

      if (googleListId) {
        sendActions.push(sendToService(dataToSend, {
          projectId,
          vendor: 'google',
          listId: googleListId,
        }));
      }

      return Promise.all(sendActions);
    })
    .then((result) => res.send({}))
    .catch(next);

};

function validateFormFields(inputFields, fieldsSchema) {
  const fieldsSchemaMappedByHash = _.groupBy(fieldsSchema, 'hash');

  const messages = [];
  inputFields.forEach((inputField) => {
    const isFieldRequired = _.get(fieldsSchemaMappedByHash, `${inputField.key}.0.options.validationRules.required`);

    if (isFieldRequired && !inputField.value) {
      messages.push({
        field: _.get(fieldsSchemaMappedByHash, `${inputField.key}.0.type`),
        message: `Empty field - ${_.get(fieldsSchemaMappedByHash, `${inputField.key}.0.options.label`)}`,
        code: "FIELD_REQUIRED",
      });
    }
  });

  return messages;
}

function sendToService(dataToSend, { projectId, vendor, listId }) {
  return editorApi.mail.sendToService(projectId, vendor, {
    listId,
    data: dataToSend
  });
}

function sendToEmail(projectId, dataToSend, accessToken, email, formName, pageId) {
  return Promise.all([
    ProjectMenu.findOne({ projectId }).lean(),
    Project
      .findOne({
        _id: projectId,
        published: true
      })
      .populate('domains')
      .select('-_id')
      .lean(),
  ])
  .then(([menuList, project]) => {

    if (!project) {
      return Promise.reject(new NotFound('PROJECT_NOT_FOUND'));
    }

    const page = (new Menu(projectId, menuList)).getPageByHash(pageId)
    
    let domain = project.domains.find(item => item.isPrimary);

    if (!domain) {
      domain = project.domains.find(item => item.type === 'free');
    }

    //TODO update after !free domains would have ssl support
    const siteUrl = domain.type === 'free' ? `https://${ domain.name }.${ freeSuffix }` : 'http://' + domain.name;
    const projectNumber = project.num > 1 ? ` (${ project.num })`: "";

    const body = {
      memberId: project.userId,
      siteName: formName || `${ project.name }${ projectNumber } - ${ page.getName() }`,
      siteUrl: siteUrl,
      fields: dataToSend
    };

    if (email) {
      body.email = email;
    }

    return memberApi.account.enqueEmail(accessToken, body);

  })
}
