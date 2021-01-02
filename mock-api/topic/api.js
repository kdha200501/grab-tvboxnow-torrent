const { join } = require('path');

const { readTextFile } = require('../../utils');

function fetchTopic() {
  return readTextFile(join(__dirname, 'example.html'));
}

module.exports = {
  fetchTopic,
};
