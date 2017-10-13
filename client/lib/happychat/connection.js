/**
 * External dependencies
 *
 * @format
 */

import IO from 'socket.io-client';
import { v4 as uuid } from 'uuid';
import { isString } from 'lodash';

/**
 * Internal dependencies
 */
import { HAPPYCHAT_MESSAGE_TYPES } from 'state/happychat/constants';
import {
	receiveAccept,
	receiveDisconnect,
	receiveInit,
	receiveMessage,
	receiveUnauthorized,
	requestChatTranscript,
	setConnecting,
	receiveReconnecting,
} from 'state/happychat/connection/actions';
import { receiveStatus } from 'state/happychat/actions';

const debug = require( 'debug' )( 'calypso:happychat:connection' );

const buildConnection = socket =>
	isString( socket )
		? new IO( socket ) // If socket is an URL, connect to server.
		: socket; // If socket is not an url, use it directly. Useful for testing.

class Connection {
	init( url, dispatch, { signer_user_id, jwt, locale, groups, geo_location } ) {
		if ( this.openSocket ) {
			debug( 'socket is already connected' );
			return this.openSocket;
		}

		dispatch( setConnecting() );

		const socket = buildConnection( url );
		this.openSocket = new Promise( ( resolve, reject ) => {
			socket
				.once( 'connect', () => debug( 'connected' ) )
				.on( 'token', handler => handler( { signer_user_id, jwt, locale, groups } ) )
				.on( 'init', () => {
					dispatch( receiveInit( { signer_user_id, locale, groups, geo_location } ) );
					// TODO: There's no need to dispatch a separate action to request a transcript.
					// The HAPPYCHAT_IO_RECEIVE_INIT action should have its own middleware handler that does this.
					dispatch( requestChatTranscript() );
					resolve( socket );
				} )
				.on( 'unauthorized', () => {
					socket.close();
					dispatch( receiveUnauthorized( 'User is not authorized' ) );
					reject( 'User is not authorized' );
				} )
				.on( 'disconnect', reason => dispatch( receiveDisconnect( reason ) ) )
				.on( 'reconnecting', () => dispatch( receiveReconnecting() ) )
				.on( 'status', status => dispatch( receiveStatus( status ) ) )
				.on( 'accept', accept => dispatch( receiveAccept( accept ) ) )
				.on( 'message', message => dispatch( receiveMessage( message ) ) );
		} );

		return this.openSocket;
	}

	typing( message ) {
		this.openSocket.then(
			socket => socket.emit( 'typing', { message } ),
			e => debug( 'failed to send typing', e )
		);
	}

	notTyping() {
		this.openSocket.then(
			socket => socket.emit( 'typing', false ),
			e => debug( 'failed to send typing', e )
		);
	}

	send( message ) {
		this.openSocket.then(
			socket => socket.emit( 'message', { text: message, id: uuid() } ),
			e => debug( 'failed to send message', e )
		);
	}

	sendEvent( message ) {
		this.openSocket.then(
			socket =>
				socket.emit( 'message', {
					text: message,
					id: uuid(),
					type: HAPPYCHAT_MESSAGE_TYPES.CUSTOMER_EVENT,
					meta: { forOperator: true, event_type: HAPPYCHAT_MESSAGE_TYPES.CUSTOMER_EVENT },
				} ),
			e => debug( 'failed to send message', e )
		);
	}

	/**
	 * Update chat preferences (locale and groups)
	 * @param {string} locale representing the user selected locale
	 * @param {array} groups of string happychat groups (wp.com, jpop) based on the site selected
	 */
	setPreferences( locale, groups ) {
		this.openSocket.then(
			socket => socket.emit( 'preferences', { locale, groups } ),
			e => debug( 'failed to send preferences', e )
		);
	}

	sendLog( message ) {
		this.openSocket.then(
			socket =>
				socket.emit( 'message', {
					text: message,
					id: uuid(),
					type: HAPPYCHAT_MESSAGE_TYPES.LOG,
					meta: { forOperator: true, event_type: HAPPYCHAT_MESSAGE_TYPES.LOG },
				} ),
			e => debug( 'failed to send message', e )
		);
	}

	/**
	 * Send customer and browser information
	 * @param { Object } info selected form fields, customer date time, user agent and browser info
	 */
	sendInfo( info ) {
		this.openSocket.then(
			socket =>
				socket.emit( 'message', {
					id: uuid(),
					meta: { ...info, forOperator: true },
					type: HAPPYCHAT_MESSAGE_TYPES.CUSTOMER_INFO,
				} ),
			e => debug( 'failed to send message', e )
		);
	}

	transcript( timestamp ) {
		return this.openSocket.then( socket =>
			Promise.race( [
				new Promise( ( resolve, reject ) => {
					socket.emit( 'transcript', timestamp || null, ( e, result ) => {
						if ( e ) {
							return reject( new Error( e ) );
						}
						resolve( result );
					} );
				} ),
				new Promise( ( resolve, reject ) =>
					setTimeout( () => {
						reject( Error( 'timeout' ) );
					}, 10000 )
				),
			] )
		);
	}
}

export default () => new Connection();
