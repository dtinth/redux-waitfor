'use strict'

import test from 'tape'
import { combineReducers } from './index'

// First, I need a function that helps me create a reducer quickly.
const createReducer = (spec) => (
  (state = spec.initialState, action, siblings) => (
    (handler => handler ? handler(state, action, siblings) : state)(spec['on' + action.type])
  )
)

// Next, I create the country reducer and test it.
const country = createReducer({
  initialState: { country: null },
  onCountryUpdate: (state, action) => (
    Object.assign({ }, state, { country: action.country })
  ),
})
test('country << CountryUpdate', assert => {
  const state = country({ country: 'Thailand' }, { type: 'CountryUpdate', country: 'Japan' })
  assert.deepEqual(state, { country: 'Japan' })
  assert.end()
})

// Next is the city reducer. This is where we use `waitFor`.
const defaultCityFor = country => {
  if (country === 'Japan') return 'Tokyo'
  throw new Error('??!!?')
}
const city = createReducer({
  initialState: { city: null },
  onCityUpdate: (state, action) => (
    Object.assign({ }, state, { city: action.city })
  ),
  onCountryUpdate: (state, action, { country }) => (
    Object.assign({ }, state, { city: defaultCityFor(country.country) })
  ),
})
test('city << CityUpdate', assert => {
  const state = city({ city: 'Bangkok' }, { type: 'CityUpdate', city: 'Chiang Mai' })
  assert.deepEqual(state, { city: 'Chiang Mai' })
  assert.end()
})

// Now, for CountryUpdate to work with city store, it needs some data from the
// city store. What that data requirement is not fulfilled, the reducer will
// return a thunk instead of the next state.
test('city << CountryUpdate', assert => {
  const action = { type: 'CountryUpdate', country: 'Japan' }
  const state = city({ city: 'Bangkok' }, action, { country: country(void 0, action) })
  assert.deepEqual(state, { city: 'Tokyo' })
  assert.end()
})

// Finally, our flight price reducer.
const getFlightPrice = (country, city) => `Hypothetical price for ${city}, ${country}`
const updateFlightPrice = (
  (state, action, { country, city }) => Object.assign({ }, state, { price: getFlightPrice(country.country, city.city) })
)
const flightPrice = createReducer({
  initialState: { price: null },
  onCityUpdate: updateFlightPrice,
  onCountryUpdate: updateFlightPrice,
})
test('flightPrice << CountryUpdate', assert => {
  const action = { type: 'CountryUpdate', country: 'Japan' }
  const state = flightPrice(void 0, action, {
    country: { country: 'Japan' },
    city: { city: 'Tokyo' },
  })
  assert.deepEqual(state, { price: 'Hypothetical price for Tokyo, Japan' })
  assert.end()
})
test('flightPrice << CountryUpdate (multiple steps)', assert => {
  const action = { type: 'CountryUpdate', country: 'Japan' }
  const state = flightPrice(void 0, action, {
    country: { country: 'Japan' },
    city: { city: 'Tokyo' },
  })
  assert.deepEqual(state, { price: 'Hypothetical price for Tokyo, Japan' })
  assert.end()
})

// Now that we have these reducers, let’s combine them all:
const reducer = combineReducers({
  country,
  city,
  flightPrice,
})
test('reducer << CountryUpdate', assert => {
  const state = reducer(void 0, { type: 'CountryUpdate', country: 'Japan' })
  assert.deepEqual(state, {
    country: { country: 'Japan' },
    city: { city: 'Tokyo' },
    flightPrice: { price: 'Hypothetical price for Tokyo, Japan' },
  })
  assert.end()
})

// Let's test combineReducers in more detail!
test('combineReducers should work with complex dependency', assert => {
  const testReducer = combineReducers({
    a: (state = 0, action) => action,
    b: (state = 0, action, { a }) => a * 2,
    c: (state = 0, action, { b }) => b + 1,
    d: (state = 0, action, { a }) => a * a,
    r: (state, action, { a, b, c, d }) => a + b + c + d,
  })
  const state = testReducer(void 0, 123)
  assert.deepEqual(state, {
    a: 123,
    b: 246,
    c: 247,
    d: 15129,
    r: 15745,
  })
  assert.end()
})

test('combineReducers should throw on circular dependency', assert => {
  const testReducer = combineReducers({
    b: (state = 0, action, { b }) => state + 1,
  })
  assert.throws(() => testReducer(void 0, 123))
  assert.end()
})
