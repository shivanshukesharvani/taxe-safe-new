// services/dbService.js

const records = [];

function saveAnalysis(result) {
  records.push({
    id: records.length + 1,
    riskLevel: result.riskLevel,
    createdAt: new Date().toISOString(),
  });
}

function getAllAnalyses() {
  return records;
}

module.exports = {
  saveAnalysis,
  getAllAnalyses,
};
