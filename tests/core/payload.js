/*
 * JavaScript tracker for Telligent Data: tests/payload.js
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
	'intern!object',
	'intern/chai!assert',
	'intern/dojo/node!../lib/payload.js'
], function (registerSuite, assert, payload) {

	registerSuite({

		name: 'Payload test',

		'Build a payload': function () {
			var sb = payload.payloadBuilder(false);
			sb.add('e', 'pv');
			sb.add('tv', 'js-2.0.0');

			var expected = {
				events: [{
					e: 'pv',
					tv: 'js-2.0.0'
				}]
			}

			assert.deepEqual(sb.build(), expected, 'Individual name-value pairs should be added to the payload');
		},

		'Do not add undefined values to a payload': function () {
			var sb = payload.payloadBuilder(false);
			sb.add('e', undefined);

			var expected = {
				events: [{}]
			};

			assert.deepEqual(sb.build(), expected, 'Undefined values should not be added to the payload');
		},

		'Do not add null values to a payload': function () {
			var sb = payload.payloadBuilder(false);
			sb.add('e', null);

			var expected = {
				events: [{}]
			};

			assert.deepEqual(sb.build(), expected, 'Null values should not be added to the payload');
		},

		'Add a dictionary of name-value pairs to the payload': function () {
			var sb = payload.payloadBuilder(false);
			sb.copyDict({
				'e': 'pv',
				'tv': 'js-2.0.0'
			});

			var expected = {
				events: [{
					e: 'pv',
					tv: 'js-2.0.0'
				}]
			};

			assert.deepEqual(sb.build(), expected, 'A dictionary of name-value pairs should be added to the payload');
		},





		'Add metadata to the payload': function () {
			var sb = payload.payloadBuilder(false);
			sb.copyDict({
				'e': 'pv',
				'tv': 'js-2.0.0'
			});

			var metadata = {
				userInfo: {
					userName: 'tester',
					userAge: 29
				}
			};

			sb.mergeMetadata(metadata);

			var expected = {
				user_info: {
					user_name: 'tester',
					user_age: 29
				},
				events: [{
					e: 'pv',
					tv: 'js-2.0.0'
				}]
			};

			assert.deepEqual(sb.build(), expected, 'A dictionary of name-value pairs should be added to the payload');
		},


		'Reset metadata to the payload': function () {
			var sb = payload.payloadBuilder(false);
			sb.copyDict({
				'e': 'pv',
				'tv': 'js-2.0.0'
			});

			var badMetadata = {
				bad: 'terrible'
			};

			sb.mergeMetadata(metadata);

			var metadata = {
				userInfo: {
					userName: 'tester',
					userAge: 29
				}
			};

			sb.resetMetadata(metadata);

			var expected = {
				user_info: {
					user_name: 'tester',
					user_age: 29
				},
				events: [{
					e: 'pv',
					tv: 'js-2.0.0'
				}]
			};

			assert.deepEqual(sb.build(), expected, 'Metadata should be resettable to a new dictionary');
		},

		'Test encoding a payload into a JSON string with no Base64 encoding': function () {
			var sb = payload.payloadBuilder(false);
			var dict = {
				'type': 'page_view',
				'ctx': {
					'pageUrl': 'www.test.com',
					'pageStats': {
						'visitCount': 24,
						'sessionLength': 42211
					}
				}
			};

			sb.copyDict(dict);

			var expected = '{"events":[{"type":"page_view","ctx":{"page_url":"www.test.com","page_stats":{"visit_count":24,"session_length":42211}}}]}';
			assert.equal(sb.encode(), expected, 'The payload should be converted into snake cased JSON');
		},

		'Test encoding a payload into a JSON string with Base64 encoding': function () {
			var sb = payload.payloadBuilder(true);
			var dict = {
				'type': 'page_view',
				'ctx': {
					'pageUrl': 'www.test.com',
					'pageStats': {
						'visitCount': 24,
						'sessionLength': 42211
					}
				}
			};

			sb.copyDict(dict);

			var expected = 'eyJldmVudHMiOlt7InR5cGUiOiJwYWdlX3ZpZXciLCJjdHgiOnsicGFnZV91cmwiOiJ3d3cudGVzdC5jb20iLCJwYWdlX3N0YXRzIjp7InZpc2l0X2NvdW50IjoyNCwic2Vzc2lvbl9sZW5ndGgiOjQyMjExfX19XX0=';
			assert.equal(sb.encode(), expected, 'The payload should be converted into snake cased JSON, and then encoded as Base64');
		}

	});
});
