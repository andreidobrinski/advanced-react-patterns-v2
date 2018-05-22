// control props primer with state reducer
// Add support for a `type` in the changes so consumers can differentiate the
// different state updates

import React from 'react'
import {Switch} from '../switch'

const callAll = (...fns) => (...args) =>
  fns.forEach(fn => fn && fn(...args))

class Toggle extends React.Component {
  static defaultProps = {
    initialOn: false,
    onReset: () => {},
    onStateChange: () => {},
    onToggle: () => {},
    stateReducer: (state, changes) => changes,
  }
  static stateChangeTypes = {
    reset: '__reset__',
    toggle: '__toggle__',
  }
  initialState = {on: this.props.initialOn}
  state = this.initialState
  isControlled(prop) {
    return this.props[prop] !== undefined
  }
  getState(state = this.state) {
    return Object.entries(state).reduce((newState, [key, value]) => {
      if (this.isControlled(key)) {
        newState[key] = this.props[key]
      } else {
        newState[key] = value
      }
      return newState
    }, {})
  }
  internalSetState(changes, callback) {
    let allChanges
    this.setState(state => {
      const combinedState = this.getState(state)
      const changesObject =
        typeof changes === 'function' ? changes(combinedState) : changes
      allChanges = this.props.stateReducer(state, changesObject)
      const nonControlledChanges = Object.keys(combinedState).reduce((acc, stateKey) => {
        if (!this.isControlled(stateKey)) {
          acc[stateKey] = allChanges[stateKey]
        }
        return acc
      }, {})
      return Object.keys(nonControlledChanges).length ? nonControlledChanges : null
    }, () => {
      this.props.onStateChange(allChanges, this.getStateAndHelpers())
      callback()
    })
  }
  // chipping away allChanges helps to avoid unnecessary re-renders
  // lets the parent decide the state and whether or not to re-render the UI
  reset = () =>
    this.internalSetState(
      {...this.initialState, type: Toggle.stateChangeTypes.reset},
      () => this.props.onReset(this.getState().on)
    )
  toggle = ({type = Toggle.stateChangeTypes.toggle} = {}) =>
    this.internalSetState(
      ({on}) => ({type, on: !on}),
      () => this.props.onToggle(this.getState().on)
    )
  getTogglerProps = ({onClick, ...props} = {}) => ({
    onClick: callAll(onClick, () => this.toggle()),
    'aria-expanded': this.getState().on,
    ...props,
  })
  getStateAndHelpers() {
    return {
      on: this.getState().on,
      toggle: this.toggle,
      reset: this.reset,
      getTogglerProps: this.getTogglerProps,
    }
  }
  render() {
    return this.props.children(this.getStateAndHelpers())
  }
}

class Usage extends React.Component {
  state = {bothOn: false}
  lastWasButton = false
  handleStateChange = changes => {
    const isButtonChange =
      changes.type === Toggle.stateChangeTypes.toggleOn ||
      changes.type === Toggle.stateChangeTypes.toggleOff
    if (
      changes.type === Toggle.stateChangeTypes.toggle ||
      (this.lastWasButton && isButtonChange)
    ) {
      this.setState({bothOn: changes.on})
      this.lastWasButton = false
    } else {
      this.lastWasButton = isButtonChange
    }
  }
  render() {
    const {bothOn} = this.state
    const {toggle1Ref, toggle2Ref} = this.props
    return (
      <div>
        <Toggle
          on={bothOn}
          onStateChange={this.handleStateChange}
          ref={toggle1Ref}
        />
        <Toggle
          on={bothOn}
          onStateChange={this.handleStateChange}
          ref={toggle2Ref}
        />
      </div>
    )
  }
}
Usage.title = 'Control Props'

export {Toggle, Usage as default}
