const { Observable } = require('rxjs');

function bufferUntilChanged(comparator) {
  return function (source$) {
    return new Observable((subscriber) => {
      // stack (FILO)
      const buffer = [];

      function _pushToStack(value) {
        buffer.unshift(value);
      }

      function _popEntireStack() {
        return buffer.splice(0, buffer.length).reverse();
      }

      function _popEntireStackAndPush(value) {
        return buffer.splice(0, buffer.length, value).reverse();
      }

      function _sameAsTop(value) {
        const [prev] = buffer;
        return comparator &&
          [prev, value].every((val) => val !== undefined && val !== null)
          ? comparator(prev, value)
          : prev === value;
      }

      const subscription = source$.subscribe({
        next: (curr) =>
          buffer.length === 0 || _sameAsTop(curr)
            ? _pushToStack(curr)
            : subscriber.next(_popEntireStackAndPush(curr)),
        error: (err) => subscriber.error(err),
        complete: () => {
          if (buffer.length > 0) {
            subscriber.next(_popEntireStack());
          }
          subscriber.complete();
        },
      });

      return () => subscription.unsubscribe();
    });
  };
}

module.exports = {
  bufferUntilChanged,
};
