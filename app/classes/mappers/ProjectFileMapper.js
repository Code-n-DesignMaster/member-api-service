const { ProjectFile, Project } = require('@sp/mongoose-models');

module.exports = class ProjectFileMapper {
  static getStorageInfo(userId) {
    return Project
      .aggregate([
        { $match: { userId, deleted: false } },
        { 
          $lookup: {
            from: "project_files",
            localField: "_id",
            foreignField: "project",
            as: "files"
          }
        },
        { $project: { 'files.size': 1 } }
      ])
      .then(projects => {
        const storageInfo = {
          used: 0,
          fileCount: 0,
        }

        projects.forEach(p => {
          storageInfo.fileCount += p.files.length;
          p.files.forEach(f => {
            storageInfo.used += f.size;
          });
        });

        return storageInfo;
      });
  }

  static getFilesStats(projectId) {
    return new Promise((resolve, reject) => {
      ProjectFile
        .aggregate([
          {
            $match: {
              project: projectId,
              deleted: { $ne: true },
            },
          },
          {
            $group: {
              _id: '$project',
              size: {
                $sum: '$size',
              },
              count: {
                $sum: 1,
              }
            }
          }
        ])
        .exec((err, result) => {
          if (err) reject(err);

          resolve(result && result.length ? result[0] : {
            size: 0,
            count: 0,
          });
        });
    });
  }
};
