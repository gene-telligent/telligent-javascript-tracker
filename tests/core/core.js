/*
 * JavaScript tracker core for Telligent Data: tests/integration.js
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

define([
	"intern!object",
	"intern/chai!assert",
	"intern/dojo/node!../lib/core.js",
], function (registerSuite, assert, core, JSON) {

	var tracker = core(false);

	function checkRequiredFields(result) {
		var built = result.build();
		assert.isArray(built.events, 'An event array should be attached to all submitted payloads.');
		
		var e = built.events[0];
		assert.ok(e['event_id'], 'A UUID should be attached to all events');
		result.remove('eventId');
		assert.ok(e['client_tstamp'], 'A timestamp should be attached to all events');
		result.remove('clientTstamp');
		return result;
	}

	function compare(result, expected, message) {
		result = checkRequiredFields(result);
		assert.deepEqual(result.build(), expected, message);
	}

	function compareEncoded(result, expected, message) {
		result = checkRequiredFields(result);
		assert.deepEqual(result.encode(), expected, message);
	}

	registerSuite({
		name: "Tracking events",

		"Track a generic unstructured event": function () {
			var type = 'signupSuccess';
			var inputCtx = {
				signupSource : 'fb' 
			};
			var expected = {
				events: [{
					type : 'signup_success',
					ctx : {
						signup_source : 'fb'
					}
				}]
			};

			compare(tracker.track(type, inputCtx), expected, 'An unstructured event should be tracked correctly');
		},

		"Track a generic unstructured event as raw JSON": function () {
			var tracker = core(false);
			var type = 'signupSuccess';
			var inputCtx = {
				signupSource : 'fb' 
			};


			var expected = '{"events":[{"type":"signup_success","ctx":{"signup_source":"fb"}}]}'
			compareEncoded(tracker.track(type, inputCtx), expected, 'An event should be properly encoded into a JSON string');
		},


		"Track a generic unstructured event as Base64-encoded JSON": function () {
			var tracker = core(true);
			var type = 'signupSuccess';
			var inputCtx = {
				signupSource : 'fb' 
			};

			var expected = 'eyJldmVudHMiOlt7InR5cGUiOiJzaWdudXBfc3VjY2VzcyIsImN0eCI6eyJzaWdudXBfc291cmNlIjoiZmIifX1dfQ==';
			compareEncoded(tracker.track(type, inputCtx), expected, 'An event should be properly encoded into a Base64 string');
		},


		"Toggle Base64 encoding on the tracker core": function () {
			var tracker = core(false);
			var type = 'signupSuccess';
			var inputCtx = {
				signupSource : 'fb' 
			};

			var expected = '{"events":[{"type":"signup_success","ctx":{"signup_source":"fb"}}]}';
			compareEncoded(tracker.track(type, inputCtx), expected, 'An event should be properly encoded into a JSON string when a boolean of true is passed to the core constructor');

			tracker.setBase64Encoding(true);
			expected = 'eyJldmVudHMiOlt7InR5cGUiOiJzaWdudXBfc3VjY2VzcyIsImN0eCI6eyJzaWdudXBfc291cmNlIjoiZmIifX1dfQ==';
			compareEncoded(tracker.track(type, inputCtx), expected, 'An unstructured event should be tracked correctly');
		},

		"Track a page view": function () {
			var url = 'http://www.example.com';
			var page = 'title page';
			var referer = 'http://www.google.com';

			var expected = {
				events:[{
					type: 'page_view',
					ctx : {
						url: url,
						page: page,
						referrer: referer
					}
				}]
			};
			compare(tracker.trackPageView(url, page, referer), expected, 'A page view should be tracked correctly');
		},

		"Track a page ping": function () {
			var url = 'http://www.example.com';
			var referer = 'http://www.google.com';
			var expected = {
				events:[{
					type: 'page_ping',
					ctx: {
						url: url,
						referrer: referer,
						min_x_offset : 1,
						max_x_offset : 2,
						min_y_offset : 3,
						max_y_offset : 4
					}
				}]
			};

			compare(tracker.trackPagePing(url, null, referer, 1, 2, 3, 4), expected, 'A page ping should be tracked correctly');
		},

		"Track a structured event": function () {
			var expected = {
				events:[{
					type: 'structured_event',
					ctx : {
						category : 'cat',
						action: 'act',
						label: 'lab',
						property: 'prop',
						value: 'val'
					}
				}]
			};

			compare(tracker.trackStructEvent('cat', 'act', 'lab', 'prop', 'val'), expected, 'A structured event should be tracked correctly');
		},

		"Track an ecommerce transaction event": function () {
			var orderId = 'ak0008';
			var totalValue = 50;
			var taxValue = 6;
			var shipping = 0;
			var city = 'Phoenix';
			var state = 'Arizona';
			var country = 'USA';
			var currency = 'USD';
			var expected = {
				events:[{
					type : 'ecommerce_transaction',
					ctx : {
						order_id : orderId,
						total_value : totalValue,
						tax_value : taxValue,
						shipping : shipping,
						city : city,
						state : state,
						country : country,
						currency: currency
					}
				}]
			};

			compare(tracker.trackEcommerceTransaction(orderId,  null, totalValue, taxValue, shipping, city, state, country, currency), expected, 'A transaction event should be tracked correctly');
		},

		"Track an ecommerce transaction item event": function () {
			var orderId = 'ak0008';
			var sku = '4q345';
			var price = 17;
			var quantity = 2;
			var name = 'red shoes';
			var category = 'clothing';
			var currency = 'USD';
			var expected = {
				events:[{
					type : 'ecommerce_transaction_item', 
					ctx : {
						order_id : orderId,
						sku : sku,
						name : name,
						category : category,
						price : price,
						quantity : quantity,
						currency : currency
					}
				}]
			};

			compare(tracker.trackEcommerceTransactionItem(orderId, sku, name, category, price, quantity, currency), expected, 'A transaction item event should be tracked correctly');
		},

		"Track a link click": function () {
			var targetUrl = 'http://www.example.com';
			var elementId = 'first header';
			var elementClasses = ['header'];
			var elementContent = 'link';

			var expected = {
				events:[{
					type : 'link_click',
					ctx : {
						target_url: targetUrl,
						element_id: elementId,
						element_classes: elementClasses,
						element_content: elementContent
					}
				}]
			};

			compare(tracker.trackLinkClick(targetUrl, elementId, elementClasses, null, elementContent), expected, 'A link click should be tracked correctly');
		},

		"Track a screen view": function () {
			var name = 'intro';
			var id = '7398-4352-5345-1950';

			var expected = {
				events: [{
					type: 'screen_view',
					ctx : {
						name : name,
						id : id
					}
				}]
			};

			compare(tracker.trackScreenView(name, id), expected, 'A screen view should be tracked correctly');
		},

		"Track an ad impression": function () {
			var impressionId = 'a0e8f8780ab3';
			var costModel = 'cpc';
			var cost = 0.5;
			var targetUrl = 'http://adsite.com';
			var bannerId = '123';
			var zoneId = 'zone-14';
			var advertiserId = 'ad-company';
			var campaignId = 'campaign-7592';

			var expected = {
				events:[{
					type : 'ad_impression',
					ctx: {
						impression_id: impressionId,
						cost_model: costModel,						
						cost: cost,
						target_url: targetUrl,
						banner_id: bannerId,
						zone_id: zoneId,
						advertiser_id: advertiserId,
						campaign_id: campaignId
					}
				}]
			};

			compare(tracker.trackAdImpression(impressionId, costModel, cost, targetUrl, bannerId, zoneId, advertiserId, campaignId), expected, 'An ad impression should be tracked correctly');
		},

		"Track an ad click": function () {
			var targetUrl = 'http://adsite.com';
			var clickId = 'click-321';
			var costModel = 'cpc';
			var cost = 0.5;
			var bannerId = '123';
			var zoneId = 'zone-14';
			var impressionId = 'a0e8f8780ab3';
			var advertiserId = 'ad-company';
			var campaignId = 'campaign-7592';

			var expected = {
				events:[{
					type : 'ad_click',
					ctx : {
						target_url: targetUrl,
						click_id: clickId,
						cost_model: costModel,
						cost: cost,
						banner_id: bannerId,
						zone_id: zoneId,
						impression_id: impressionId,
						advertiser_id: advertiserId,
						campaign_id: campaignId
					}
				}]
			};

			compare(tracker.trackAdClick(targetUrl, clickId, costModel, cost, bannerId, zoneId, impressionId, advertiserId, campaignId), expected, 'An ad click should be tracked correctly');
		},

		"Track an ad conversion": function () {
			var conversionId = 'conversion-59';
			var costModel = 'cpc';
			var cost = 0.5;
			var category = 'cat';
			var action = 'act';
			var property = 'prop';
			var initialValue = 7;
			var advertiserId = 'ad-company';
			var campaignId = 'campaign-7592';

			var expected = {
				events:[{
					type : 'ad_conversion',
					ctx : {
						conversion_id: conversionId,
						cost_model: costModel,					
						cost: cost,
						category: category,
						action: action,
						property: property,
						initial_value: initialValue,
						advertiser_id: advertiserId,
						campaign_id: campaignId			
					}
				}]
			};

			compare(tracker.trackAdConversion(conversionId, costModel, cost, category, action, property, initialValue, advertiserId, campaignId), expected, 'An ad conversion should be tracked correctly');
		},

		"Track a social interaction": function () {
			var action = 'like';
			var network = 'facebook';
			var target = 'status-0000345345';

			var expected = {
				events: [{
					type : 'social_interaction',
					ctx : {
						action: action,
						network: network,
						target: target
					}
				}]
			};

			compare(tracker.trackSocialInteraction(action, network, target), expected);
		},


		"Track an add-to-cart event": function () {
			var sku = '4q345';
			var unitPrice = 17;
			var quantity = 2;
			var name = 'red shoes';
			var category = 'clothing';
			var currency = 'USD';

			var expected = {
				events:[{
					type: 'add_to_cart',
					ctx: {
						sku: sku,
						name: name,
						category: category,
						unit_price: unitPrice,
						quantity: quantity,
						currency: currency
					}
				}]
			};

			compare(tracker.trackAddToCart(sku, name, category, unitPrice, quantity, currency), expected);
		},

		"Track a remove-from-cart event": function () {
			var sku = '4q345';
			var unitPrice = 17;
			var quantity = 2;
			var name = 'red shoes';
			var category = 'clothing';
			var currency = 'USD';

			var expected = {
				events: [{
					type: 'remove_from_cart',
					ctx: {
						sku: sku,
						name: name,
						category: category,
						unit_price: unitPrice,
						quantity: quantity,
						currency: currency
					}
				}],
			};

			compare(tracker.trackRemoveFromCart(sku, name, category, unitPrice, quantity, currency), expected);
		},

		"Track a form change event": function () {
			var formId = "parent";
			var elementId = "child";
			var nodeName = "INPUT";
			var type = "text";
			var elementClasses = ["important"];
			var value = "male";

			var expected = {
				events:[{
					type: 'form_change',
					ctx: {
						form_id: formId,
						element_id: elementId,
						node_name: nodeName,
						type: type,
						element_classes: elementClasses,
						value: value
					}
				}]
			};

			compare(tracker.trackFormChange(formId, elementId, nodeName, type, elementClasses, value), expected);
		},

		"Track a form submission event": function () {
			var formId = "parent";
			var formClasses = ["formclass"];
			var elements = [{
				name: "gender",
				value: "male",
				nodeName: "INPUT",
				type: "text"
			}];

			var expected = {
				events:[{
					type: 'form_submission',
					ctx: {
						form_id: formId,
						form_classes: formClasses,
						elements: elements
					}
				}]
			};

			compare(tracker.trackFormSubmission(formId, formClasses, elements), expected);
		},

		"Track a site seach event": function () {
			var terms = ["javascript", "development"];
			var filters = {
				"safeSearch": true,
				"category": "books"
			};
			var totalResults = 35;
			var pageResults = 10;

			var expected = {
				events:[{
					type: 'site_search',
					ctx: {
						terms: terms,
						filters: {
							safe_search: true,
							category: 'books'
						},
						total_results: totalResults,
						page_results: pageResults
					}
				}]
			};

			compare(tracker.trackSiteSearch(terms, filters, totalResults, pageResults), expected);
		},

		"Track a page view with custom metadata": function () {
			var url = 'http://www.example.com';
			var page = 'title page';

			var inputMetadata = [{
				userInfo: {
					userType: 'tester',
					userName: 'Jon',
				}
			}];

			var expected = {
				events: [{
					type: 'page_view',
					ctx: {
						url: url,
						page: page,
					}
				}],
				user_info: {
					user_type: 'tester',
					user_name: 'Jon'
				}
			};
			compare(tracker.trackPageView(url, page, null, inputMetadata), expected, 'A custom context should be attached correctly');
		},

		"Track a page view with multiple metadata fields": function () {
			var url = 'http://www.example.com';
			var page = 'title page';

			var inputMetadata = [
			{
				userInfo: {
					userType: 'tester',
					userName: 'Jon'
				}
			},
			{
				deviceInfo: {
					browser: 'testingBrowser',
					os: 'Test OS'
				}
			}
			];

			var expected = {
				events: [{				
					type: 'page_view',
					ctx: {
						url: url,
						page: page,
					}
				}],
				user_info: {
					user_type: 'tester',
					user_name: 'Jon'
				},
				device_info: {
					browser: 'testingBrowser',
					os: 'Test OS'
				}
			};
			compare(tracker.trackPageView(url, page, null, inputMetadata), expected, 'A custom context should be attached correctly');
		},

		"Track a page view with multiple metadata fields of the same group": function () {
			var url = 'http://www.example.com';
			var page = 'title page';

			var inputMetadata = [
			{
				userInfo: {
					userType: 'tester',
					userName: 'Jon'
				}
			},
			{
				userInfo: {
					userAge: 24,
					userEmail: 'tester@testing.com'
				}
			}
			];

			var expected = {
				events: [{
					type: 'page_view',
					ctx: {
						url: url,
						page: page,
					}
				}],
				user_info: {
					user_type: 'tester',
					user_name: 'Jon',
					user_age: 24,
					user_email: 'tester@testing.com'
				}
			};
			compare(tracker.trackPageView(url, page, null, inputMetadata), expected, 'A custom context should be attached correctly');
		},

		"Track a page view with a timestamp": function () {
			var tstamp = 1000000000000;

			assert.strictEqual(tracker.trackPageView('http://www.example.com', null, null, null, tstamp).build()['events'][0]['client_tstamp'], tstamp, 'A timestamp should be attached correctly');
		},

		"Add individual name-value pairs to the top level of the payload": function () {
			var tracker = core();
			var url = 'http://www.example.com';
			var expected = {
				events: [{
					type: 'page_view',
					ctx: {
						url: url,
					}
				}],
				tna: 'cf',
				tv: 'js-2.0.0'
			};
			tracker.addStaticMetadata('tna', 'cf');
			tracker.addStaticMetadata('tv', 'js-2.0.0');

			compare(tracker.trackPageView(url), expected, 'Payload name-value pairs should be set correctly');
		},

		"Add a dictionary of name-value pairs to the payload": function () {
			var tracker = core();
			var url = 'http://www.example.com';
			var expected = {
				events: [{
					type: 'page_view',
					ctx: {
						url: url
					}
				}],
				tna: 'cf',
				aid: 'cf325'
			};

			tracker.addStaticMetadataObject({
				tna: 'cf',
				aid: 'cf325'
			});

			compare(tracker.trackPageView(url), expected, 'Payload name-value pairs should be set correctly');
		},


		"Reset payload name-value pairs": function () {
			var tracker = core();
			var url = 'http://www.example.com';
			var expected = {
				events: [{
					type: 'page_view',
					ctx: {
						url: url
					}
				}],
				tna: 'cf'	
			};
			tracker.addStaticMetadata('tna', 'mistake');
			tracker.resetStaticMetadata({'tna': 'cf'});

			compare(tracker.trackPageView(url), expected, 'Payload name-value pairs should be reset correctly');
		},

		"Execute a callback": function () {
			var callbackTarget;
			var tracker = core(false, function (payload) {
				callbackTarget = payload;
			});
			var url = 'http://www.example.com';
			var expected = {
					events: [{
					type: 'page_view',
					ctx: {
						url: url
					}
				}]
			};
			tracker.trackPageView(url);

			compare(callbackTarget, expected, 'The callback should be executed correctly');
		},

		"Use setter methods": function () {
			
			var tracker = core(false);
			tracker.setTrackerVersion('js-3.0.0');
			tracker.setAppId('my-app');
			tracker.setPlatform('web');
			tracker.setUserId('jacob');
			tracker.setScreenResolution(400, 200);
			tracker.setViewport(500, 800);
			tracker.setColorDepth(24);
			tracker.setTimezone('Europe London');
			tracker.setIpAddress('37.151.33.154');
			tracker.setSource('web');
			tracker.setEnvironment('prod');
			tracker.setLang('EN-US');
			tracker.setTrackerNamespace('telligent');


			var url = 'http://www.example.com';
			var page = 'title page';
			var expected = {
				events: [{
					type: 'page_view',
					ctx: {
						url: url,
						page: page
					}
				}],
				header: {
					versions: {
						telligent_api_version: 'js-3.0.0'	
					},
					app_id: 'my-app',
					ip: '37.151.33.154',
					source: 'web',
					env: 'prod',
				},
				device_info: {
					platform: 'web',
					screen_resolution: "400x200",
					viewport_dimensions: "500x800",
					color_depth: 24,
					timezone: "Europe London",
					tracker_namespace: "telligent"
				},
				user_info: {
					guid: 'jacob',
					locale: 'EN-US'
				}
			};

			compare(tracker.trackPageView(url, page), expected, 'setXXX methods should work correctly');

			
		}
		

	});
	
});
