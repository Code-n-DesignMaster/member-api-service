const Mapper = require('./Mapper');
const { Project } = require('@sp/mongoose-models');

module.exports = new class ProjectMapper extends Mapper {
  constructor() {
    super(Project);
  }

  getProjectNextNum(userId, name) {
    return this.collection
      .find({ userId, name })
      .sort('num')
      .select('num')
      .lean()
      .then(projects => getNum(projects.map(project => project.num)));
  }
};

//---------------

function getNum(nums) {
  let num = nums.length ? nums[nums.length - 1] + 1 : 1;
  for (let i = 0; i < nums.length; i++) {
    if (nums[i] != i + 1) {
      num = i + 1;
      break;
    }
  }
  return num;
}
