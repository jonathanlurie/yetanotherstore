import EventManager from '@jonathanlurie/eventmanager';

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

export default singletonStore;
//# sourceMappingURL=yetanotherstore.js.map
