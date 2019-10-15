import EventManager from '@jonathanlurie/eventmanager';

/**
 * A store is a place to store 'key:value' tuples. A key is generally a string
 * and unique identifier within the store. The value can be anything.
 *
 * This store provides some events, such as 'valueSet', 'set:{key}', 'valueDeleted',
 * 'del:{key}' and 'reseted'. Those event can be subscribed to with the following:
 * ```js
 * myStoreInstance.on( THE_EVENT_NAME, (val) => {
 *   // do something
 * })
 * ```
 */
class Store extends EventManager {

  constructor(){
    super();
    this._storage = {};
  }


  /**
   * Add or update a value in the store, under the name of the key.
   * Throw the events:
   *   - 'valueDeleted' with the argument {key: string, value: any, previousValue: any}
   *   - 'set:{key}' where {key} is the key as a string, with the argument {key: string, value: any, previousValue: any}
   * @param {string|number} key - identifier of the value
   * @param {any} value - the value
   * @return {string} the key as a string
   */
  set(key, value){
    if(typeof key === 'object'){
      throw new Error('Keys cannot be object')
      return
    }

    let validKey = key.toString();
    let argObj = {
      key: validKey,
      value: value,
      previousValue: this._storage[validKey] // possibly undefined
    };

    this._storage[validKey] = value;

    this.emit('valueSet', [argObj]);
    this.emit(`set:${validKey}`, [argObj]);
    return validKey
  }



  /**
   * Retrieve the value corresponding to the 'key'
   * @param {string|number} key - identifier of the value
   * @return {any|undefined} the value, possibly 'undefined' if not in store
   */
  get(key){
    let validKey = key.toString();
    return this._storage[validKey]
  }


  /**
   * Delete a value from the store, using its key as identifier.
   * Throw the events:
   *   - 'valueDeleted' with the argument {key: string, value: any}
   *   - 'del:{key}' where {key} is the key as a string, with the argument {key: string, value: any}
   * @param {string|number} key - identifier of the value
   * @return {boolean} true if the value was successfully deleted, false if not (because not found)
   */
  delete(key){
    let validKey = key.toString();
    if(validKey in this._storage){
      argObj = {
        key: validKey,
        value: value
      };

      delete this._storage[validKey];
      this.emit('valueDeleted', [argObj]);
      this.emit(`del:${validKey}`, [argObj]);
      return true
    }

    return false
  }


  /**
   * Check if a given key is in the store
   * @param {string|number} key - identifier of the value
   * @return {boolean} true if is in store, false if not
   */
  has(key){
    return (key.toString() in this._storage)
  }


  /**
   * Flush the store, remove everything.
   * Throw the event 'reseted' with no argument.
   */
  reset(){
    this._storage = {};
    this.emit('reseted', []);
  }


  /**
   * Get all the keys in the store
   * @return {Array} array of strings
   */
  keys(){
    return Object.keys(this._storage)
  }

}

export default Store;
//# sourceMappingURL=yetanotherstore.js.map
