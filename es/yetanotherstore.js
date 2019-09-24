import EventManager from '@jonathanlurie/eventmanager';

class Store extends EventManager {

  constructor(){
    super();
    this._storage = {};
  }

  set(key, value){
    let argObj = {
      key: key,
      value: value,
      previousValue: this._storage[key] // possibly undefined
    };

    this._storage[key] = value;

    this.emit('valueSet', [argObj]);
  }


  get(key){
    return this._storage[key]
  }


  delete(key){
    if(key in this._storage){
      argObj = {
        key: key,
        value: value
      };

      delete this._storage[key];
      this.emit('valueDeleted', [argObj]);
    }
  }


  has(key){
    return (key in this._storage)
  }


  reset(){
    this._storage = {};
    this.emit('reseted', []);
  }


  keys(){
    return Object.keys(this._storage)
  }

}

export default Store;
//# sourceMappingURL=yetanotherstore.js.map
