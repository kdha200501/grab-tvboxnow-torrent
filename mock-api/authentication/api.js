const { Observable } = require('rxjs');

function signIn() {
  return new Observable((subscriber) => {
    subscriber.next(['foo cookie']);
    subscriber.complete();
  });
}

module.exports = {
  signIn,
};
