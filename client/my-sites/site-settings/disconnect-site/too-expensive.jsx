/** @format */
/**
 * External dependencies
 */
import React from 'react';
import { connect } from 'react-redux';
import { localize } from 'i18n-calypso';

/**
 * Internal dependencies
 */
import Button from 'components/button';
import Card from 'components/card';
import Placeholder from 'my-sites/site-settings/placeholder';
import QuerySitePlans from 'components/data/query-site-plans';
import SectionHeader from 'components/section-header';
import { getCurrentPlanPurchaseId } from 'state/selectors';
import { getSiteSlug } from 'state/sites/selectors';
import { getSelectedSiteId } from 'state/ui/selectors';

const TooExpensive = ( { confirmHref, planPurchaseId, siteId, siteSlug, translate } ) => {
	if ( ! siteSlug || ! planPurchaseId ) {
		return (
			<div>
				<QuerySitePlans siteId={ siteId } />
				<Placeholder />
			</div>
		);
	}
	return (
		<div>
			<SectionHeader label={ translate( 'Would you like to downgrade your plan?' ) } />
			<Card>
				<QuerySitePlans siteId={ siteId } />
				<div>
					<Button compact primary href={ `/me/purchases/${ siteSlug }/${ planPurchaseId }` }>
						{ translate( 'Yes' ) }
					</Button>
					<Button compact href={ confirmHref }>
						{ translate( 'No' ) }
					</Button>
				</div>
			</Card>
		</div>
	);
};

export default connect( state => {
	const siteId = getSelectedSiteId( state );
	return {
		planPurchaseId: getCurrentPlanPurchaseId( state, siteId ),
		siteId,
		siteSlug: getSiteSlug( state, siteId ),
	};
} )( localize( TooExpensive ) );
