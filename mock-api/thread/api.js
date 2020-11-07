const { join } = require('path');

const { readTextFile } = require('../../utils');

function fetchThread() {
  return readTextFile(join(__dirname, 'example.html'));
}

module.exports = {
  fetchThread,
};
