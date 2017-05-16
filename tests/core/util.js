/*
 * JavaScript tracker core for Telligent: tests/util.js
 * 
 * Copyright (c) Telligent Data 2016. All rights reserved.
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
    "intern/dojo/node!../lib/util.js"
], function (registerSuite, assert, util) {

    registerSuite({
        name: 'Utility testing suite',

        'Base64 Encoding testing': {
            "Encode a string": function () {
                assert.strictEqual(util.base64encode('my_string'), 'bXlfc3RyaW5n', 'Base64-encode a string');
            },

            "Encode a string containing special characters": function () {
                assert.strictEqual(util.base64encode('™®字'), '4oSiwq7lrZc=', 'Base64-encode a containing TM, Registered Trademark, and Chinese characters');
            },

            "Encode an undefined object": function() {
                assert.strictEqual(util.base64encode(), undefined, 'Base64-encode should return undefined for an empty call.');
            }
        },

        'Object identification testing': {
            'Identify a JSON': function () {
                var json = {
                    'name': 'john',
                    'properties': {
                        'age': 30,
                        'languages': ['English', 'French']
                    }
                };

                assert.strictEqual(util.isJson(json), true, 'JSON should be identified');

                assert.strictEqual(util.isNonEmptyJson(json), true, 'JSON should be identified as non empty');
            },

            'Identify a non-JSON': function () {
                var nonJson = function () {};

                assert.strictEqual(util.isJson(nonJson), false, 'Non-JSON should be rejected');
            },

            'Identify an empty JSON': function () {
                var emptyJson = {};

                assert.strictEqual(util.isNonEmptyJson(emptyJson), false, '{} should be identified as empty');
            },

            'Identify a non-JSON as not a non-empty JSON': function () {
                var nonJson = function() {};

                assert.strictEqual(util.isNonEmptyJson(nonJson), false, 'Non-JSON should be identified as a not non-empty JSON');
            }
        },

        'Snake case conversion testing': {
            'Test converting a string to snake case': function () {
                var s = "TestStringName";
                var expected = "test_string_name";
                assert.equal(util.toSnakeCase(s), expected, 'A string should properly be converted to snake case from CamelCase');
            },

            'Test snake casing the property names of a dictionary': function () {
                var dict = {
                    'eventType': 'page_view',
                    'ctx': {
                        'pageUrl': 'www.test.com',
                        'pageStats': {
                            'visitCount': 24,
                            'sessionLength': 42211
                        }
                    }
                };

                var expected = {
                    event_type: 'page_view',
                    ctx: {
                        page_url: 'www.test.com',
                        page_stats: {
                            visit_count: 24,
                            session_length: 42211
                        }
                    }
                };

                assert.deepEqual(util.sanitizePropertyNames(dict), expected, 'The properties of a dictionary should be converted to snake case');
            }
        },

        'Merge testing': {
            'Test merging two dictionaries': function () {
                var to = {
                    mergedKey: {
                        toStringKey: 'to',
                        toIntKey: 420
                    },
                    extraToKey: 'extraTo'
                };

                var from = {
                    mergedKey: {
                        fromStringKey: 'from',
                        toStringKey: 'new'
                    },
                    extraFromKey: {
                        extraNestedFromKey: 'nested'
                    }
                };

                var expected = {
                    mergedKey: {
                        toStringKey: 'new',  //should be overwritten
                        toIntKey: 420, // should be unchanged
                        fromStringKey: 'from'
                    },
                    extraToKey: 'extraTo',
                    extraFromKey: {
                        extraNestedFromKey: 'nested'
                    }
                };

                assert.deepEqual(util.mergeDicts(from, to), expected, 'Two dictionaries should be properly deeply merged.');
            },

            'Test merging a dictionary and an empty dictionary': function () {
                var to = {};

                var from = {
                    mergedKey: {
                        fromStringKey: 'from',
                    },
                    extraFromKey: {
                        extraNestedFromKey: 'nested'
                    }
                };

                var expected = {
                    mergedKey: {
                        fromStringKey: 'from'
                    },
                    extraFromKey: {
                        extraNestedFromKey: 'nested'
                    }
                };

                assert.deepEqual(util.mergeDicts(from, to), expected, 'A merge from a nested dictionary to an empty dictionary should result in a copy');
            },

            'Test merging with a non-dictionary': function () {
                var to = {test: 'test'};

                var from = function() {};

                var expected = {test: 'test'};

                assert.deepEqual(util.mergeDicts(from, to), expected, 'A merge from a non dictionary should just return the object it was merged into');
            }
        }
    });
});
