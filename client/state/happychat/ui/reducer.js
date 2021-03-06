/** @format */

/**
 * Internal dependencies
 */
import {
	SERIALIZE,
	DESERIALIZE,
	HAPPYCHAT_OPEN,
	HAPPYCHAT_MINIMIZING,
	HAPPYCHAT_BLUR,
	HAPPYCHAT_FOCUS,
} from 'state/action-types';
import { combineReducers, isValidStateWithSchema } from 'state/utils';

/**
 * Tracks the last time Happychat had focus. This lets us determine things like
 * whether the user has unread messages. A numerical value is the timestamp where focus
 * was lost, and `null` means HC currently has focus.
 * @param {Object} state Current state
 * @param {Object} action Action payload
 * @return {Object}        Updated state
 */
export const lostFocusAt = ( state = null, action ) => {
	switch ( action.type ) {
		case SERIALIZE:
			// If there's already a timestamp set, use that. Otherwise treat a SERIALIZE as a
			// "loss of focus" since it represents the state when the browser (and HC) closed.
			if ( state === null ) {
				return Date.now();
			}
			return state;
		case DESERIALIZE:
			if ( isValidStateWithSchema( state, { type: 'number' } ) ) {
				return state;
			}
			return null;
		case HAPPYCHAT_BLUR:
			return Date.now();
		case HAPPYCHAT_FOCUS:
			return null;
	}
	return state;
};
lostFocusAt.hasCustomPersistence = true;

const isOpen = ( state = false, action ) => {
	switch ( action.type ) {
		case HAPPYCHAT_OPEN:
			return !! action.isOpen;
	}
	return state;
};

/**
 * Tracks the state of the happychat minimizing process
 *
 * @param  {Object} state  Current state
 * @param  {Object} action Action payload
 * @return {Object}        Updated state
 *
 */
const isMinimizing = ( state = false, action ) => {
	switch ( action.type ) {
		case HAPPYCHAT_MINIMIZING:
			return action.isMinimizing ? true : false;
	}
	return state;
};

export default combineReducers( { isMinimizing, isOpen, lostFocusAt } );
