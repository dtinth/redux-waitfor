'use strict'

import test from 'tape'
import { combineReducers } from './index'

// This example is adapted from https://github.com/rackt/redux/issues/1315
//
function a (state = 0, action) {
  switch (action.type) {
    case 'increment':
      return state + 1
    case 'decrement':
      return state - 1
    default:
      return state
  }
}

function b (state = 0, action) {
  switch (action.type) {
    case 'increment':
      return state + 10
    case 'decrement':
      return state - 10
    default:
      return state
  }
}

function c (state = 0, action, { a, b }) {
  return state + Math.abs(a - b)
}

// Testing individual reducers...
//
test('Test a', assert => {
  const state = a(void 0, { type: 'increment' })
  assert.equal(state, 1)
  assert.end()
})

test('Test b', assert => {
  const state = b(void 0, { type: 'increment' })
  assert.equal(state, 10)
  assert.end()
})

test('Test c', assert => {
  const state = c(void 0, { type: 'increment' }, { a: 42, b: 420 })
  assert.equal(state, 378)
  assert.end()
})

// Testing the combination.
//
const counters = combineReducers({ a, b, c })

test('Test counters', assert => {
  const state = counters(void 0, { type: 'increment' })
  assert.deepEqual(state, { a: 1, b: 10, c: 9 })
  assert.end()
})
