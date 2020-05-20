// Here placed identical logic of Projects Controller

const _ = require('lodash');
const seekerClass = require('../services/UpdateSeeker');

module.exports = {
  updateSectionsEmbedBlocks,
  updateSectionsAnchors,
  updateSectionsLinks // it replace anchors too
};

function updateSectionsEmbedBlocks(sections, pages, embedBlocks, projectId, createEmbedBlock) {
  const promises = [];
  
  sections.forEach(section => {
    const seeker = new seekerClass([section]);

    seeker.updateElementByNames(['embed_block'], element => {
      const pageId = pages.find(page => page.sections.find(s => s === section.options.hash))
      const block = embedBlocks.find(block => block._id === element.options.options.iframeId);

      const promise = createEmbedBlock({
        type: 'embedCode',
        value: block.code.value,
        projectId, pageId
      }).then(block => {
        element.options.options.src = block.path;
        element.options.options.iframeHash = block.hash;
        element.options.options.iframeId = block.id;
        console.log(element.options.options, block)
      });

      promises.push(promise);
    });
  });

  return Promise.all(promises);
}

function updateSectionsAnchors(sections, IdsMap) {
  const seeker = new seekerClass(sections);
  const searchOptions = {
    elements: {
      redactor: {
        path: ['options', 'entityMap', '<entries-with-check>', 'data'],
        check: { key: 'type', val: 'ELINK' }
      },
      image: { path: ['options', 'dynamic', 'link'], },
      button: { path: ['options', 'dynamic'] },
    },
    keys: {
      required: ['anchor', 'href'],
      optional: ['linkAddress'],
    }
  };

  seeker.updateElementByNames(
    Object.keys(searchOptions.elements),
    updateCallback
  );

  function updateCallback(element) {
    const searchOption = searchOptions.elements[element.name];
    let objectWithAnchor = element;

    // searching for right object
    searchOption.path.forEach(key => {
      if (key === '<entries-with-check>') {
        Object.entries(objectWithAnchor).map(([_key, _value]) => {
          const checkValue = _.get(_value, searchOption.check.key, false);

          if (checkValue === searchOption.check.val) {
            objectWithAnchor = _value
          }
        });

        return;
      }
      objectWithAnchor = objectWithAnchor && _.get(objectWithAnchor, key, false)
    });

    if (!objectWithAnchor)
      return;

    // console.log('Found:', objectWithAnchor);
    const objectWithAnchorKeys = Object.keys(objectWithAnchor);
    const containsRequiredKeys =
      searchOptions.keys.required
        .filter(
          key => objectWithAnchorKeys.includes(key)
        ).length === searchOptions.keys.required.length;

    if (!containsRequiredKeys)
      return;

    if (Object.keys(IdsMap.pages).includes(objectWithAnchor.href)) {
      objectWithAnchor.href = IdsMap.pages[objectWithAnchor.href];
      objectWithAnchor.anchor = IdsMap.sections[objectWithAnchor.anchor];
      if ('linkAddress' in objectWithAnchor) {
        objectWithAnchor.linkAddress = objectWithAnchor.href
      }
    }
    // console.log('Replaced:', objectWithAnchor);
  }
}


function updateSectionsLinks(sections, IdsMap) {
  const seeker = new seekerClass(sections);
  const searchOptions = {
    elements: {
      redactor: {
        path: ['options', 'entityMap', '<entries-with-check>', 'data'],
        check: { key: 'type', val: 'ELINK' }
      },
      image: { path: ['options', 'dynamic', 'link'], },
      button: { path: ['options', 'dynamic'] },
      header_button: { path: ['options', 'dynamic'] },
    },
    keys: {
      required: [],
      optional: ['linkAddress', 'href', 'value', 'anchor'],
    }
  };

  seeker.updateElementByNames(
    Object.keys(searchOptions.elements),
    updateCallback
  );

  function updateCallback(element) {
    const searchOption = searchOptions.elements[element.name];
    let searchTarget = element;

    // searching for right object
    searchOption.path.forEach(key => {
      if (key === '<entries-with-check>') {
        Object.entries(searchTarget).map(([_key, _value]) => {
          const checkValue = _.get(_value, searchOption.check.key, false);

          if (checkValue === searchOption.check.val) {
            searchTarget = _value
          }
        });

        return;
      }
      searchTarget = searchTarget && _.get(searchTarget, key, false)
    });

    if (!searchTarget)
      return;

    if (searchOptions.keys.required.length) {
      const objectWithAnchorKeys = Object.keys(searchTarget);
      const containsRequiredKeys =
        searchOptions.keys.required
          .filter(
            key => objectWithAnchorKeys.includes(key)
          ).length === searchOptions.keys.required.length;

      if (!containsRequiredKeys)
        return;
    }

    // console.log('Found:', searchTarget);
    searchOptions.keys.optional.map(linkedKey => {
      if (linkedKey in searchTarget) {
        const IdsMapTarget =
          linkedKey === 'anchor'
            ? IdsMap.sections
            : IdsMap.pages;
        if (Object.keys(IdsMapTarget).includes(searchTarget[linkedKey])) {
          searchTarget[linkedKey] = IdsMapTarget[searchTarget[linkedKey]];
        }
      }
    });
    // console.log('Replaced:', searchTarget);
  }
}
