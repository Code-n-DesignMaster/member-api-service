'use strict';

const {
  get,
  cloneDeep,
  set,
  isString,
  isNil,
  isEmpty,
  keys,
  values
} = require('lodash');

const REDACTOR = {
  TEXT: 'options.blocks.0.text',
  ENTITY: 'options.blocks.0.text',
  BLOCK_STYLE: 'options.blocks.0.blockInlineStyle',
  ENTITY_RANGES: 'options.blocks.0.entityRanges'
};

const TYPES = {
  EMAIL: 'email',
  PHONE: 'phone',
  BUSINESS_NAME: 'businessName',
  ADDRESS: 'address',
  MAP_ADDRESS: 'mapAddress',
  CITY: 'city',
  LOGO: 'logo'
};

/**
 * Connect DIFY types fo link views
 * @type {{}}
 */
const LINK_VIEWS = {
  [TYPES.EMAIL]: 'Email',
  [TYPES.PHONE]: 'Phone'
};

const HANDLER_TYPES = {
  ONE_TEXT: 'oneText',
  TEXT_WITH_LINK: 'textWithLink',
  COPYRIGHT: 'copyright',
  COLOR_TEXT: 'colorText'
};

/**
 * Convert redactor block to one text block with saving inline styles
 * @param element
 * @param formData
 * @param type
 * @return {*}
 */
const oneText = (element, formData, type) => {
  const text = formData[type];
  if (isEmpty(text)) return element;
  const blockInlineStyle = cloneDeep(get(element, REDACTOR.BLOCK_STYLE));

  element.options = Object.assign({}, element.options, {
    blocks: [
      {
        text,
        blockInlineStyle
      }
    ]
  });

  return element;
};

/**
 * Convert redactor block to one text block saving inline styles and add link entity map
 * @param element
 * @param formData
 * @param type
 * @return {*}
 */
const textWithLink = (element, formData, type) => {
  const text = formData[type];
  if (isEmpty(text)) return element;
  const blockInlineStyle = cloneDeep(get(element, REDACTOR.BLOCK_STYLE));

  const entityMap = {
    '0': {
      type: 'ELINK',
      data: {
        href: text
      },
      linkView: LINK_VIEWS[type]
    }
  };

  element.options = Object.assign({}, element.options, {
    entityMap,
    blocks: [
      {
        text,
        blockInlineStyle,
        entityRanges: [
          {
            key: 0,
            length: text.length,
            offset: 0
          }
        ]
      }
    ]
  });

  return element;
};

const mergeEntityMaps = (draftObject, templateEntityMap) => {
  let newDraftObject = { ...draftObject };
  const { entityMap = {}, blocks } = newDraftObject;
  const colorObjects = values(templateEntityMap).filter(
    ({ type }) => type === 'COLOR'
  );
  // no reason to shift indexes of existing draftObject with no color settings
  if (isEmpty(colorObjects)) return draftObject;
  const startKey = colorObjects.length;
  // building entity ranges for color
  const colorEntityRanges = colorObjects.map((obj, index) => ({
    offset: 0,
    length: get(newDraftObject, 'blocks[0].text', '').length,
    key: index
  }));
  // moving indexes starting right after last color object
  const shiftedEntityMap = keys(entityMap)
    .map(key => ({ [startKey + parseInt(key)]: entityMap[key] }))
    .reduce((prev, curr) => ({ ...prev, ...curr }), {});
  // getting only color settings  from template existing entity mape
  const colorObjectsWithKeys = colorObjects
    .map((obj, index) => ({ [index]: obj }))
    .reduce((prev, curr) => ({ ...prev, ...curr }), {});
  // merging color with link
  newDraftObject.entityMap = { ...colorObjectsWithKeys, ...shiftedEntityMap };
  // maping new entity ranges
  newDraftObject.blocks = blocks.map(block => ({
    ...block,
    entityRanges: [
      ...colorEntityRanges,
      ...block.entityRanges.map((er, index) => ({
        ...er,
        key: startKey + index
      }))
    ]
  }));
  return newDraftObject;
};

const copyright = (element, formData, type) => {
  let draftObject = JSON.parse(formData[type]);
  if (
    !draftObject.blocks ||
    isEmpty(
      draftObject.blocks.reduce(
        (previousBlock, currentBlock) =>
          previousBlock.concat(currentBlock.text),
        ''
      )
    )
  )
    return element;
  const { entityMap: elementEntityMap } = element.options;
  if (!isEmpty(elementEntityMap)) {
    draftObject = mergeEntityMaps(draftObject, elementEntityMap);
  }
  let { blocks, entityMap } = draftObject;
  const blockInlineStyle = cloneDeep(get(element, REDACTOR.BLOCK_STYLE));
  // different version of draft in crms (inlineStyleRanges) and custom-made in sitplus (blockInlineStyle)
  blocks = blocks.map(blockObj => ({ ...blockObj, blockInlineStyle }));
  // same for entity map link -> elink with data.url -> data.href
  for (let key in entityMap) {
    if (entityMap[key].type === 'LINK') {
      const entity = entityMap[key];
      const { url } = entity.data;
      entity.type = 'ELINK';
      entity.data = {
        href: url,
        target: null,
        type: 'link',
        linkView: 'URL'
      };
    }
  }
  element.options = Object.assign({}, element.options, {
    entityMap,
    blocks
  });
  return element;
};

const colorText = (element, formData, type) => {
  const text = formData[type];
  if (!isString(text)) return element;

  element = cloneDeep(element);
  const lengthPath = REDACTOR.ENTITY_RANGES + '.0.length';
  const entityLength = get(element, lengthPath);

  if (!isNil(entityLength)) {
    // Mutate cloned element
    set(element, lengthPath, text.length);
  }
  set(element, REDACTOR.TEXT, text);

  return element;
};

module.exports = Object.assign({}, HANDLER_TYPES, {
  [HANDLER_TYPES.ONE_TEXT]: oneText,
  [HANDLER_TYPES.TEXT_WITH_LINK]: textWithLink,
  [HANDLER_TYPES.COPYRIGHT]: copyright,
  [HANDLER_TYPES.COLOR_TEXT]: colorText
});
