'use strict';

function _interopDefault (ex) { return (ex && (typeof ex === 'object') && 'default' in ex) ? ex['default'] : ex; }

var EventManager = _interopDefault(require('@jonathanlurie/eventmanager'));

let storage = {};

class Store extends EventManager {

  constructor(){
    super();
  }

  set(key, value){
    let argObj = {
      key: key,
      value: value,
      previousValue: storage[key] // possibly undefined
    };

    storage[key] = value;

    this.emit('valueSet', [argObj]);
  }


  get(key){
    return storage[key]
  }


  delete(key){
    if(key in storage){
      argObj = {
        key: key,
        value: value
      };

      delete storage[key];
      this.emit('valueDeleted', [argObj]);
    }
  }


  has(key){
    return (key in storage)
  }


  reset(){
    storage = {};
    this.emit('reseted', []);
  }


  keys(){
    return Object.keys(storage)
  }

}

let singletonStore = new Store();

module.exports = singletonStore;
//# sourceMappingURL=yetanotherstore.js.map
