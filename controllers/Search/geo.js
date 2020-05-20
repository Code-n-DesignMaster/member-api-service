'use strict';

const _ = require('lodash');
const geoip = require('geoip-lite');
const querystring = require('querystring');

const logger = require('../../helpers/logger');
const request = require('../../utils/request');

const models = require('@sp/mongoose-models');
const Keys = models.AutocompleteKeys;

const tr = require('transliteration').transliterate;

const placeUrl = 'https://maps.googleapis.com/maps/api/place/';

module.exports = (req, res) => {
  const fields = [
    'country',
    'locality',
    'route',
    'street_number',
    'administrative_area_level_1',
    'postal_code'
  ];
  let count = 0;
  Keys
    .find({ 'date_expired': { $exists: false } })
    .sort({ count: 1 })
    .limit(1)
    .exec()
    .then(response => {

      if (!response || !response.length) {
        return Promise.reject({
          internalStatusCode: 403,
          internalData: {
            type: 'validation',
            message: 'Usable google keys is not exist'
          }
        });
      }


      const objKey = response[0];
      const key = objKey.key;

      count = objKey.count;

      const query = {
        input: _.get(req.query, 'value'),
        key,
        language: 'en'
      };
      const lookup = geoip.lookup(req.realIP);
      if (lookup && lookup.ll) {
        query.location = lookup.ll.join(',');
        query.radius = 1000;
      }

      const url = toUri(query, 'autocomplete/json?');
      request(url)
        .then(result => {
          if (['OVER_QUERY_LIMIT', 'REQUEST_DENIED'].includes(result.body.status)) {
            const date_expired = (new Date()).toISOString();
            Keys.updateOne({ _id: objKey._id }, {
              $set: {
                count,
                date_expired
              }
            })
              .exec();
            //TODO Notify admin
            return Promise.reject({
              internalStatusCode: 451,
              internalData: {
                type: 'validation',
                message: 'Can not access Google autocomplte API'
              },
              details: 'Wrong keys to Google autocomplete'
            });
          }

          if (!result.body.predictions || !result.body.predictions.length) {
            return false;
          }

          count++;

          return Promise.all(result.body.predictions.map(prediction => {

            count++;

            const url = toUri({
              placeid: prediction.place_id,
              key,
              language: 'en'
            }, 'details/json?');

            return request(url, { method: 'GET' });
          }));

        })
        .then(results => {

          Keys.updateOne({ _id: objKey._id }, { $set: { count } })
            .exec();

          if (typeof results == 'boolean') {
            return [];
          }

          if (req.query.getRaw) {
            const data = [];
            results.map(r => {
              if (r.body) {
                if (r.body.status === 'OK') {
                  data.push(r.body.result);
                }
              }
            });

            return data;
          }

          return results.map(o => {
            const p = {};
            let countryName = '';
            o.body.result.address_components.map(ac => {
              if (fields.includes(ac.types[0])) {
                if (ac.short_name && /[^\u0000-\u007F]+/.test(ac.short_name)) {
                  ac.short_name = tr(ac.short_name);
                }
                if (ac.types[0] == 'country') {
                  p[`${ac.types[0]}Code`] = ac.short_name ? ac.short_name.toLowerCase() : undefined;
                  countryName = ac.long_name;
                } else if (ac.types[0] == 'administrative_area_level_1') {
                  p['state'] = ac.short_name;
                } else {
                  p[ac.types[0]] = ac.short_name;
                }
              }
            });
            p.id = o.body.result.id;
            if (!p.locality) {
              p.locality = countryName;
            }
            return p;
          })
            .slice(0, 10);


        })
        .then(results => res.send(results))
        .catch(error => {
          logger.error(error);
          res
            .status(error.internalStatusCode || 400)
            .send(error.internalData || []);
        });
    });


};

function toUri(data, part) {
  return placeUrl + part + querystring.stringify(data, '&', '=');
}
