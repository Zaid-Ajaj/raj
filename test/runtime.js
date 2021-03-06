import test from 'ava'
import {program} from '../runtime'

test('program() should call view() initially', t => {
  const initialState = 1
  return new Promise(resolve => {
    program({
      init: [initialState],
      view (state) {
        t.is(state, initialState)
        resolve()
      }
    })
  })
})

test('program() should call view() after dispatch', t => {
  let count = 0
  return new Promise(resolve => {
    program({
      init: ['init'],
      update (msg) {
        return [msg]
      },
      view (state, dispatch) {
        count++
        if (state === 'init') {
          return dispatch('next')
        }
        if (state === 'next') {
          return dispatch('done')
        }
        if (state === 'done') {
          resolve()
        }
      }
    })
  }).then(() => t.is(count, 3))
})

test('program() should call done() when killed', t => {
  t.plan(1)
  return new Promise(resolve => {
    const initialState = 'state'
    const kill = program({
      init: [initialState],
      update (msg, state) {
        return state
      },
      view () {},
      done (state) {
        t.is(state, initialState, 'the state is passed')
        resolve()
      }
    })

    kill()
  })
})

test('program() should not call update/view if killed', t => {
  t.plan(2)
  let initialRender = true
  const initialState = 'state'
  return new Promise(resolve => {
    const afterKillEffect = dispatch => {
      t.is(typeof dispatch, 'function', 'dispatch is passed')
      setTimeout(() => {
        dispatch()
        resolve()
      }, 10)
    }
    const kill = program({
      init: [initialState, afterKillEffect],
      update () {
        t.fail('update() should not be called')
      },
      view () {
        if (initialRender) {
          initialRender = false
          t.pass('view() is called once')
          return
        }

        t.fail('view() should not be called more than once')
      }
    })

    kill()
  })
})

test('program() should only call done() once', t => {
  let initialCall = true
  const kill = program({
    init: [],
    update () {},
    view () {},
    done () {
      if (initialCall) {
        initialCall = false
        t.pass('done() was called once')
        return
      }

      t.fail('done() should not be called more than once')
    }
  })

  kill()
  kill()
})
