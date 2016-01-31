
import { combineReducers as reduxCombineReducers } from 'redux'

class DispatchContext {
  constructor (state = { }, action, reducers) {
    this.state = state
    this.action = action
    this.reducers = reducers
    this._result = { }
    this._lock = { }
    this._magicalObject = createMagicalObject(this)
  }
  resultOf (key) {
    const result = this._result[key] || (this._result[key] = this._run(key))
    return result.value
  }
  _run (key) {
    if (this._lock[key]) {
      throw new Error('Circular dependency detected!')
    }
    this._lock[key] = true
    try {
      return {
        value: this.reducers[key].call(null, this.state[key], this.action, this._magicalObject)
      }
    } finally {
      this._lock[key] = false
    }
  }
}

function createMagicalObject (context) {
  const out = { }
  for (const key of Object.keys(context.reducers)) {
    Object.defineProperty(out, key, {
      enumerable: true,
      get: () => context.resultOf(key)
    })
  }
  return out
}

function createProxyOf (reducers) {
  const out = { }
  for (const key of Object.keys(reducers)) {
    out[key] = (state, context) => (context instanceof DispatchContext
      ? context.resultOf(key)
      : reducers[key](state, context, { })
    )
  }
  return out
}

export function combineReducers (reducers) {
  const combination = reduxCombineReducers(createProxyOf(reducers))
  return (state, action) => {
    const context = new DispatchContext(state, action, reducers)
    return combination(state, context)
  }
}
