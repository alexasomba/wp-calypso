/** @format */
/**
 * External dependencies
 */
import { find, get, reduce } from 'lodash';

/**
 * Get the total for the discount value
 *
 * @param {Object} order An order as returned from API
 * @return {Float} Total amount as a decimal number
 */
export function getOrderDiscountTotal( order ) {
	const coupons = get( order, 'coupon_lines', [] );
	const total = reduce( coupons, ( sum, value ) => sum + parseFloat( value.discount ), 0 );
	return parseFloat( total ) || 0;
}

/**
 * Get the individual price for a given item, pre-discounts.
 *
 * @param {Object} order An order as returned from API
 * @param {Number} id The ID of the line_item
 * @return {Float} Total amount as a decimal number
 */
export function getOrderItemCost( order, id ) {
	const item = find( get( order, 'line_items', [] ), { id } );
	const subtotal = parseFloat( get( item, 'subtotal', 0 ) ) || 0;
	const qty = parseFloat( get( item, 'quantity', 1 ) ) || 1;
	return subtotal / qty;
}

/**
 * Get the refund value on a given order
 *
 * @param {Object} order An order as returned from API
 * @return {Float} The refund amount as a decimal number
 */
export function getOrderRefundTotal( order ) {
	const refunds = get( order, 'refunds', [] );
	return reduce( refunds, ( sum, value ) => sum + parseFloat( value.total ), 0 );
}

/**
 * Get the total for the shipping value
 *
 * @param {Object} order An order as returned from API
 * @return {Float} Total amount as a decimal number
 */
export function getOrderShippingTotal( order ) {
	const shipping = get( order, 'shipping_lines', [] );
	return reduce( shipping, ( sum, value ) => sum + parseFloat( value.total ), 0 );
}

/**
 * Get the total for the subtotal value (total of all line items)
 *
 * @param {Object} order An order as returned from API
 * @return {Float} Total amount as a decimal number
 */
export function getOrderSubtotal( order ) {
	const items = get( order, 'line_items', [] );
	return reduce( items, ( sum, value ) => sum + parseFloat( value.subtotal ), 0 );
}

/**
 * Get the total value on a given order
 *
 * @param {Object} order An order as returned from API
 * @return {Float} The total amount as a decimal number
 */
export function getOrderTotal( order ) {
	const discount = getOrderDiscountTotal( order );
	const refunds = getOrderRefundTotal( order );
	const shipping = getOrderShippingTotal( order );
	const subtotal = getOrderSubtotal( order );
	// Refunds are negative, but discounts are not
	return subtotal - discount + shipping + refunds;
}
