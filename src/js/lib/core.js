/*
 * JavaScript tracker core for Telligent Data: core.js
 * 
 * Forked from Snowplow Analytics.
 * 
 * Copyright (c) 2016 Telligent Data, LLC. All rights reserved.
 *
 * This program is licensed to you under the Apache License Version 2.0,
 * and you may not use this file except in compliance with the Apache License Version 2.0.
 * You may obtain a copy of the Apache License Version 2.0 at http://www.apache.org/licenses/LICENSE-2.0.
 *
 * Unless required by applicable law or agreed to in writing,
 * software distributed under the Apache License Version 2.0 is distributed on an
 * "AS IS" BASIS, WITHOUT WARRANTIES OR CONDITIONS OF ANY KIND, either express or implied.
 * See the Apache License Version 2.0 for the specific language governing permissions and limitations there under.
 */


;(function() {
	var payload = require('./payload.js');
	var meta = require('./metadata.js');
	var util = require('./util.js');
	var uuid = require('uuid');

	var object = typeof exports !== 'undefined' ? exports : this;

	/**
	 * Create a tracker core object
	 *
	 * @param base64 boolean If the payloads should be base64 encoded
	 * @param callback function Function applied to every payload dictionary object
	 * @return object Tracker core
	 */
	object.newTrackerCore = function(base64, callback) {
		var base64 = (base64 !== undefined ? base64 : true);

		// List of metadata objects which get added to every payload
		var staticMetadataCollection = meta.MetadataCollection();


		function addStaticMetadataObject(object, path) {
			staticMetadataCollection.merge(util.placeInPath(object, path));
		}

		/**
		 * Set a persistent key-value pair to be added to every payload
		 *
		 * @param string key Field name
		 * @param Object value add value
		 * @param string metadataGroup Optional group name to store the static metadata under
		 * @param string metadataSubgroup Optional subgroup to store the static metdata under
		 */
		function addStaticMetadata(key, value, path) {
			path = (util.isArray(path) ? path : [path]);
			path.push(key);
			staticMetadataCollection.merge(util.placeInPath(value, path));
		}

		function resetStaticMetadata(data) {
			staticMetadataCollection = meta.MetadataCollection();
			staticMetadataCollection.merge(data);
		}

		/**
		 * Returns a copy of a JSON with undefined and null properties removed
		 *
		 * @param object eventJson JSON to clean
		 * @param object exemptFields Set of fields which should not be removed even if empty
		 * @return object A cleaned copy of eventJson
		 */
		function removeEmptyProperties(eventJson, exemptFields) {
			var ret = {};
			exemptFields = exemptFields || {};
			for (var k in eventJson) {
				if (exemptFields[k] || (eventJson[k] !== null && typeof eventJson[k] !== 'undefined')) {
					ret[k] = eventJson[k];
				}
			}
			return ret;
		}

		/**
		 * Log an event
		 * Adds metadata and StaticMetadata name-value pairs to the payload
		 * Applies the callback to the built payload 
		 *
		 * @param string eventtype Event name/type to be tracked
		 * @param object ctx Data to be attached to the event
		 * @param array metadata Array of custom metadata (headers, user_info) relating to the event
		 * @param number tstamp Timestamp of the event
		 * @return object Payload after the callback is applied
		 */
		function track(eventType, ctx, metadata, tstamp) {
			var pb = payload.payloadBuilder(base64);

			// Add both the eventType and ctx fields
			pb.add('type', eventType);
			pb.add('ctx', removeEmptyProperties(ctx));

			// Add event ID
			pb.add('eventId', uuid.v4());

			// Add client timestamp
			pb.add('clientTstamp', tstamp || new Date().getTime());

			// Start with the static metadata collection
			pb.mergeMetadataCollection(staticMetadataCollection);

			// Merge in the existing metadata
			for (var i in metadata) {
				pb.mergeMetadata(metadata[i]);
			}

			if (typeof callback === 'function') {
				callback(pb);
			}

			return pb;
		}

		function setBase64Encoding(bool) {
			base64 = bool;
		}

		return {
			addStaticMetadataObject : addStaticMetadataObject,

			addStaticMetadata: addStaticMetadata,

			resetStaticMetadata: resetStaticMetadata,

			setBase64Encoding: setBase64Encoding,

			/**
			 * Set the tracker version
			 *
			 * @param string version
			 */
			setTrackerVersion: function (version) {
				addStaticMetadata('telligentApiVersion', version, ['header', 'versions']);
			},

			setTrackerNamespace: function (trackerNamespace) {
				addStaticMetadata('trackerNamespace', trackerNamespace, 'deviceInfo');
			},

			/**
			 * Set the event source (app or website)
			 *
			 * @param string source
			 */	
			
			setSource: function(source) {
				addStaticMetadata('source', source, 'header');
			},

			/**
			 * Set the environment of the tracker (dev, prod)
			 *
			 * @param string environment
			 */	
			
			setEnvironment: function(environment) {
				addStaticMetadata('env', environment, 'header');
			},

			/**
			 * Set the application ID
			 *
			 * @param string appId
			 */
			setAppId: function (appId) {
				addStaticMetadata('appId', appId, 'header');
			},

			/**
			 * Set the IP address
			 *
			 * @param string appId
			 */
			setIpAddress: function (ip) {
				addStaticMetadata('ip', ip, 'header');
			},

			/**
			 * Set the platform
			 *
			 * @param string value
			 */
			setPlatform: function (platform) {
				addStaticMetadata('platform', platform, 'deviceInfo')
			},

			/**
			 * Set the user ID
			 *
			 * @param string userId
			 */
			setUserId: function (userId) {
				addStaticMetadata('guid', userId, 'userInfo');
			},

			/**
			 * Set the screen resolution
			 *
			 * @param number width
			 * @param number height
			 */
			setScreenResolution: function (width, height) {
				addStaticMetadata('screenResolution', width + 'x' + height, 'deviceInfo');
			},

			/**
			 * Set the viewport dimensions
			 *
			 * @param number width
			 * @param number height
			 */
			setViewport: function (width, height) {
				addStaticMetadata('viewportDimensions', width + 'x' + height, 'deviceInfo');
			},

			/**
			 * Set the color depth
			 *
			 * @param number depth
			 */
			setColorDepth: function (depth) {
				addStaticMetadata('colorDepth', depth, 'deviceInfo');
			},

			/**
			 * Set the timezone
			 *
			 * @param string timezone
			 */
			setTimezone: function (timezone) {
				addStaticMetadata('timezone', timezone, 'deviceInfo');
			},

			/**
			 * Set the language
			 *
			 * @param string lang
			 */
			setLang: function (lang) {
				addStaticMetadata('locale', lang, 'userInfo');
			},

			track: track,

			/**
			 * Log the page view / visit
			 *
			 * @param string pageUrl The url of the page being viewed
			 * @param string customTitle The user-defined page title to attach to this page view
			 * @param string referrer The referring page linked to the page view
			 * @param array metadata Custom metadata relating to the event
			 * @param number tstamp Timestamp of the event
			 * @return object Payload
			 */
			trackPageView: function(pageUrl, pageTitle, referrer, metadata, tstamp) {
				var ctx = {
					url : pageUrl,
					page : pageTitle,
					referrer : referrer
				};
				return track('pageView', ctx, metadata, tstamp);
			},

			/**
			 * Log that a user is still viewing a given page
			 * by sending a page ping.
			 *
			 * @param string pageTitle The page title to attach to this page ping
			 * @param minxoffset Minimum page x offset seen in the last ping period
			 * @param maxXOffset Maximum page x offset seen in the last ping period
			 * @param minYOffset Minimum page y offset seen in the last ping period
			 * @param maxYOffset Maximum page y offset seen in the last ping period
			 * @param array metadata Custom metadata relating to the event
			 * @param number tstamp Timestamp of the event
			 * @return object Payload
			 */
			trackPagePing: function (pageUrl, pageTitle, referrer, minXOffset, maxXOffset, minYOffset, maxYOffset, metadata, tstamp) {
				var ctx = {
					url : pageUrl,
					page : pageTitle,
					referrer : referrer,
					minXOffset : minXOffset,
					maxXOffset : maxXOffset,
					minYOffset : minYOffset,
					maxYOffset : maxYOffset
				};

				return track('pagePing', ctx, metadata, tstamp);
			},

			/**
			 * Track a generic structured event
			 *
			 * @param string category The name you supply for the group of objects you want to track
			 * @param string action A string that is uniquely paired with each category, and commonly used to define the type of user interaction for the web object
			 * @param string label (optional) An optional string to provide additional dimensions to the event data
			 * @param string property (optional) Describes the object or the action performed on it, e.g. quantity of item added to basket
			 * @param int|float|string value (optional) An integer that you can use to provide numerical data about the user event
			 * @param array metadata Custom metadata relating to the event
			 * @param number tstamp Timestamp of the event
			 * @return object Payload
			 */
			trackStructEvent: function (category, action, label, property, value, metadata, tstamp) {
				var ctx = {
					category : category,
					action : action,
					label : label,
					property : property,
					value : value
				};

				return track('structuredEvent', ctx, metadata, tstamp);
			},

			/**
			 * Track an ecommerce transaction
			 *
			 * @param string orderId Required. Internal unique order id number for this transaction.
			 * @param string affiliation Optional. Partner or store affiliation.
			 * @param string total Required. Total amount of the transaction.
			 * @param string tax Optional. Tax amount of the transaction.
			 * @param string shipping Optional. Shipping charge for the transaction.
			 * @param string city Optional. City to associate with transaction.
			 * @param string state Optional. State to associate with transaction.
			 * @param string country Optional. Country to associate with transaction.
			 * @param string currency Optional. Currency to associate with this transaction.
			 * @param array metadata Optional. Metadata relating to the event.
			 * @param number tstamp Optional. Timestamp of the event
			 * @return object Payload
			 */
			trackEcommerceTransaction: function (orderId, affiliation, totalValue, taxValue, shipping, city, state, country, currency, metadata, tstamp) {
				var ctx = {
					orderId: orderId,
					affiliation : affiliation,
					totalValue : totalValue,
					taxValue : taxValue,
					shipping : shipping,
					city : city,
					state : state,
					country : country,
					currency : currency
				};

				return track('ecommerceTransaction', ctx, metadata, tstamp);
			},

			/**
			 * Track an ecommerce transaction item
			 *
			 * @param string orderId Required Order ID of the transaction to associate with item.
			 * @param string sku Required. Item's SKU code.
			 * @param string name Optional. Product name.
			 * @param string category Optional. Product category.
			 * @param string price Required. Product price.
			 * @param string quantity Required. Purchase quantity.
			 * @param string currency Optional. Product price currency.
			 * @param array metadata Optional. Metadata relating to the event.
			 * @param number tstamp Optional. Timestamp of the event
			 * @return object Payload
			 */
			trackEcommerceTransactionItem: function (orderId, sku, name, category, price, quantity, currency, metadata, tstamp) {
				var ctx = {
					orderId : orderId,
					sku : sku,
					name : name,
					category : category,
					price : price,
					quantity : quantity,
					currency : currency
				};

				return track('ecommerceTransactionItem', ctx, metadata, tstamp);
			},

			/**
			 * Track a screen view unstructured event
			 *
			 * @param string name The name of the screen
			 * @param string id The ID of the screen
			 * @param number tstamp Timestamp of the event
			 * @param array metadata Optional. Metadata relating to the event.
			 * @return object Payload
			 */
			trackScreenView: function (name, id, metadata, tstamp) {
				var ctx = {
					name : name,
					id : id
				};

				return track('screenView', ctx, metadata, tstamp);
			},

			/**
			 * Log the link or click with the server
			 *
			 * @param string targetUrl
			 * @param string elementId
			 * @param array elementClasses
			 * @param string elementTarget
			 * @param string elementContent innerHTML of the link
			 * @param array metadata Custom metadata relating to the event
			 * @param number tstamp Timestamp of the event
			 * @return object Payload
			 */
			trackLinkClick:  function (targetUrl, elementId, elementClasses, elementTarget, elementContent, metadata, tstamp) {
				var ctx = {
					targetUrl : targetUrl,
					elementId : elementId,
					elementClasses : elementClasses,
					elementTarget : elementTarget,
					elementContent : elementContent
				};

				return track('linkClick', ctx, metadata, tstamp);
			},

			/**
			 * Track an ad being served
			 *
			 * @param string impressionId Identifier for a particular ad impression
			 * @param string costModel The cost model. 'cpa', 'cpc', or 'cpm'			 
			 * @param number cost Cost
			 * @param string bannerId Identifier for the ad banner displayed
			 * @param string zoneId Identifier for the ad zone
			 * @param string advertiserId Identifier for the advertiser
			 * @param string campaignId Identifier for the campaign which the banner belongs to
			 * @param array Custom metadata relating to the event
			 * @param number tstamp Timestamp of the event
			 * @return object Payload
			 */
			trackAdImpression: function(impressionId, costModel, cost, targetUrl, bannerId, zoneId, advertiserId, campaignId, metadata, tstamp) {
				var ctx = {
					impressionId : impressionId,
					costModel : costModel,
					cost : cost,
					targetUrl : targetUrl,
					bannerId : bannerId,
					zoneId : zoneId,
					advertiserId : advertiserId,
					campaignId : campaignId
				};

				return track('adImpression', ctx, metadata, tstamp);
			},

			/**
			 * Track an ad being clicked
			 *
			 * @param string clickId Identifier for the ad click
			 * @param string costModel The cost model. 'cpa', 'cpc', or 'cpm'			 
			 * @param number cost Cost
			 * @param string targetUrl (required) The link's target URL
			 * @param string bannerId Identifier for the ad banner displayed
			 * @param string zoneId Identifier for the ad zone
			 * @param string impressionId Identifier for a particular ad impression
			 * @param string advertiserId Identifier for the advertiser
			 * @param string campaignId Identifier for the campaign which the banner belongs to
			 * @param array Custom metadata relating to the event
			 * @param number tstamp Timestamp of the event
			 * @return object Payload
			 */
			trackAdClick: function (targetUrl, clickId, costModel, cost, bannerId, zoneId, impressionId, advertiserId, campaignId, metadata, tstamp) {
				var ctx = {
					targetUrl : targetUrl,
					clickId : clickId,
					costModel : costModel,
					cost : cost,
					bannerId : bannerId,
					zoneId : zoneId,
					impressionId : impressionId,
					advertiserId : advertiserId,
					campaignId : campaignId
				};

				return track('adClick', ctx, metadata, tstamp);
			},

			/**
			 * Track an ad conversion event
			 *
			 * @param string conversionId Identifier for the ad conversion event
			 * @param number cost Cost
			 * @param string category The name you supply for the group of objects you want to track
			 * @param string action A string that is uniquely paired with each category
			 * @param string property Describes the object of the conversion or the action performed on it
			 * @param number initialValue Revenue attributable to the conversion at time of conversion
			 * @param string advertiserId Identifier for the advertiser
			 * @param string costModel The cost model. 'cpa', 'cpc', or 'cpm'
			 * @param string campaignId Identifier for the campaign which the banner belongs to
			 * @param array Custom metadata relating to the event
			 * @param number tstamp Timestamp of the event
			 * @return object Payload
			 */
			trackAdConversion: function (conversionId, costModel, cost, category, action, property, initialValue, advertiserId, campaignId, metadata, tstamp) {
				var ctx = {
					conversionId : conversionId,
					costModel : costModel,
					cost : cost,
					category : category,
					action : action,
					property : property,
					initialValue : initialValue,
					advertiserId : advertiserId,
					campaignId : campaignId
				};

				return track('adConversion', ctx, metadata, tstamp);
			},

			/**
			 * Track a social event
			 *
			 * @param string action Social action performed
			 * @param string network Social network
			 * @param string target Object of the social action e.g. the video liked, the tweet retweeted
			 * @param array Custom metadata relating to the event
			 * @param number tstamp Timestamp of the event
			 * @return object Payload
			 */
			trackSocialInteraction: function (action, network, target, metadata, tstamp) {
				var ctx = {
					action : action,
					network : network,
					target : target
				};

				return track('socialInteraction', ctx, metadata, tstamp);
			},

			/**
			 * Track an add-to-cart event
			 *
			 * @param string sku Required. Item's SKU code.
			 * @param string name Optional. Product name.
			 * @param string category Optional. Product category.
			 * @param string unitPrice Optional. Product price.
			 * @param string quantity Required. Quantity added.
			 * @param string currency Optional. Product price currency.
			 * @param array metadata Optional. Metadata relating to the event.
			 * @param number tstamp Optional. Timestamp of the event
			 * @return object Payload
			 */
			trackAddToCart: function (sku, name, category, unitPrice, quantity, currency, metadata, tstamp) {
				var ctx = {
					sku : sku,
					name : name,
					category : category,
					unitPrice : unitPrice,
					quantity : quantity,
					currency : currency
				};

				return track('addToCart', ctx, metadata, tstamp);
			},

			/**
			 * Track a remove-from-cart event
			 *
			 * @param string sku Required. Item's SKU code.
			 * @param string name Optional. Product name.
			 * @param string category Optional. Product category.
			 * @param string unitPrice Optional. Product price.
			 * @param string quantity Required. Quantity removed.
			 * @param string currency Optional. Product price currency.
			 * @param array metadata Optional. Metadata relating to the event.
			 * @param number tstamp Optional. Timestamp of the event
			 * @return object Payload
			 */
			trackRemoveFromCart: function (sku, name, category, unitPrice, quantity, currency, metadata, tstamp) {
				var ctx = {
					sku : sku,
					name : name,
					category : category,
					unitPrice : unitPrice,
					quantity : quantity,
					currency : currency
				};

				return track('removeFromCart', ctx, metadata, tstamp);
			},

			/**
			 * Track the value of a form field changing
			 *
			 * @param string formId The parent form ID
			 * @param string elementId ID of the changed element
			 * @param string nodeName "INPUT", "TEXTAREA", or "SELECT"
			 * @param string type Type of the changed element if its type is "INPUT"
			 * @param array elementClasses List of classes of the changed element
			 * @param string value The new value of the changed element
			 * @param array metadata Optional. Metadata relating to the event.
			 * @param number tstamp Optional. Timestamp of the event
			 * @return object Payload
			 */
			trackFormChange: function(formId, elementId, nodeName, type, elementClasses, value, metadata, tstamp) {
				var ctx = {
					formId : formId,
					elementId : elementId,
					nodeName : nodeName,
					type : type,
					elementClasses : elementClasses,
					value : value
				}

				return track('formChange', ctx, metadata, tstamp);
			},

			/**
			 * Track a form submission event
			 *
			 * @param string formId ID of the form
			 * @param array formClasses Classes of the form
			 * @param array elements Mutable elements within the form
			 * @param array metadata Optional. Metadata relating to the event.
			 * @param number tstamp Optional. Timestamp of the event
			 * @return object Payload
			 */
			trackFormSubmission: function(formId, formClasses, elements, metadata, tstamp) {
				var ctx = {
					formId : formId,
					formClasses : formClasses,
					elements : elements
				};

				return track('formSubmission', ctx, metadata, tstamp);
			},

			/**
			 * Track an internal search event
			 *
			 * @param array terms Search terms
			 * @param object filters Search filters
			 * @param totalResults Number of results
			 * @param pageResults Number of results displayed on page
			 * @param array metadata Optional. Metadata relating to the event.
			 * @param number tstamp Optional. Timestamp of the event
			 * @return object Payload
			 */
			trackSiteSearch: function(terms, filters, totalResults, pageResults, metadata, tstamp) {
				var ctx = {
					terms : terms,
					filters : filters,
					totalResults : totalResults,
					pageResults : pageResults
				};

				return track('siteSearch', ctx, metadata, tstamp);
			}
		};
	};

}());