import _ from 'lodash';

function move(arr: any, old_index: any, new_index: any) {
    // Shortcut helper to move item to end of array
  if (-1 === new_index) {
    new_index = arr.length - 1;
  }

  if (new_index >= arr.length) {
    let k = new_index - arr.length;
    while (k-- + 1) {
      arr.push(undefined);
    }
  }
  arr.splice(new_index, 0, arr.splice(old_index, 1)[0]);
  return arr; // for testing purposes
}

export function sortKeysDeepBy(obj: any, order: any, options: any, sortAlgo: any): any {
  order = order || ['asc'];

  if (_.isArray(obj)) {
    return _.map(obj, (value) => {
      if (
          !_.isNumber(value) &&
          !_.isFunction(value) &&
          _.isObject(value)
        ) {
        return sortKeysDeepBy(value, order, options, sortAlgo);
      }
      return value;
    });
  }
  let keys = _.orderBy(_.keys(obj), [], order);

  if (sortAlgo === 'keyLength') {
    let keyLengths = _.map(_.keys(obj), (x) => {
      return { key: x, keyLength: x.length };
    });
    keyLengths = _.orderBy(keyLengths, ['keyLength'], order);
    keys = _.map(keyLengths, 'key');
  }

  let asc = true;
  if (order !== undefined && order.length > 0) {
    asc = order[0] === 'asc';
  }

  if (sortAlgo === 'alphaNum') {
    keys = _.keys(obj).sort((a, b) => {
      return (
        a.localeCompare(b, 'en', { numeric: true }) *
        (asc ? 1 : -1)
      );
    });
  }

  if (!_.isArray(obj) && sortAlgo === 'values') {
    keys = _.keys(obj).sort((a, b) => {
      const v1 = obj[a];
      const v2 = obj[b];

      if (_.isString(v1) && _.isString(v2)) {
        const val = v2.localeCompare(v1, 'en', { numeric: true }) * (asc ? 1 : -1);
        return val;
      }

      if (_.isNumber(v1) && _.isNumber(v2)) {
        const val = (v1 - v2) * (asc ? 1 : -1);
        return val;
      }

      if (_.isNumber(v1) && _.isString(v2)) {
        return -1;
      }

      if (_.isNumber(v2) && _.isString(v1)) {
        return 1;
      }

      return -1;
    });
  }

  if (sortAlgo === 'type') {
    keys = _.keys(obj).sort((a, b) => {
      const v1 = obj[a];
      const v2 = obj[b];

      let t1 = 5;
      t1 = _.isNumber(v1) ? 1 : t1;
      t1 = _.isString(v1) ? 2 : t1;
      t1 = _.isArray(v1) ? 3 : t1;
      t1 = _.isObject(v1) ? 4 : t1;

      let t2 = 5;
      t2 = _.isNumber(v2) ? 1 : t2;
      t2 = _.isString(v2) ? 2 : t2;
      t2 = _.isArray(v2) ? 3 : t2;
      t2 = _.isObject(v2) ? 4 : t2;

              // If the same type then use alpbahetical (i.e. default sort json)
      if (t1 === t2) {
        const val = a.localeCompare(b) * (asc ? 1 : -1);
        return val;
      }

      const val = (t1 - t2) * (asc ? 1 : -1);
      return val;
    });
  }

  if (options && options.orderOverride) {
    const orderOverride = options.orderOverride.slice().reverse();
    orderOverride.forEach((key: any) => {
      const index = _.findIndex(keys, (o) => {
        return o === key;
      });
      if (-1 !== index) {
        move(keys, index, 0);
      }
    });
  }

  if (options && options.orderUnderride) {
    const orderUnderride = options.orderUnderride.slice();
    orderUnderride.forEach((key: any) => {
      const index = _.findIndex(keys, (o) => {
        return o === key;
      });
      if (-1 !== index) {
        move(keys, index, -1);
      }
    });
  }

  return _.zipObject(
          keys,
          _.map(keys, (key) => {
            if (
                  !_.isNumber(obj[key]) &&
                  !_.isFunction(obj[key]) &&
                  _.isObject(obj[key])
              ) {
              obj[key] = sortKeysDeepBy(
                      obj[key],
                      order,
                      options,
                      sortAlgo,
                  );
            }
            return obj[key];
          }),
      );

}
