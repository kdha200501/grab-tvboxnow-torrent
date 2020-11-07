const { Observable } = require('rxjs');

function fetchAttachment(hostnameOverride, path, cookies, filePath) {
  console.log('>>> downloading URL path:', path);

  return new Observable((subscriber) => {
    setTimeout(() => {
      subscriber.next();
      subscriber.complete();
    }, 500);
  });
}

module.exports = { fetchAttachment };
