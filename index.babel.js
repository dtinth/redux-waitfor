
import { combineReducers as reduxCombineReducers } from 'redux'

export function waitFor (key, inject) {
  const reducer = (state, action) => {
    const thunk = combinedState => {
      if (typeof combinedState[key] !== 'undefined' && typeof combinedState[key] !== 'function') {
        const nextState = inject(combinedState[key])(state, action)
        return (typeof nextState === 'function'
          ? nextState(combinedState)
          : nextState
        )
      } else {
        return thunk
      }
    }
    return thunk
  }
  return reducer
}

export function combineReducers (reducers) {
  const combination = reduxCombineReducers(reducers)
  const digest = state => {
    const nextStateAddition = { }
    let digested = false
    let needsFurtherDigest = false
    for (const key of Object.keys(state)) {
      if (typeof state[key] === 'function') {
        const next = nextStateAddition[key] = state[key](state)
        if (next !== state[key]) digested = true
        if (typeof next === 'function') needsFurtherDigest = true
      }
    }
    if (digested) {
      const digestedState = Object.assign({ }, state, nextStateAddition)
      return needsFurtherDigest ? digest(digestedState) : digestedState
    } else if (needsFurtherDigest) {
      throw new Error('Unable to digest! Missing dependency?')
    } else {
      return state
    }
  }
  return (state, action) => digest(combination(state, action))
}
