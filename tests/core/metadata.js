/*
 * JavaScript tracker for Telligent Data: tests/metadata.js
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
    'intern/dojo/node!../lib/metadata.js'
], function (registerSuite, assert, metadata) {
    registerSuite({
        name: 'Metadata test',

        'Merge a valid metadata object into a MetadataCollection': function () {
            var collection = metadata.MetadataCollection();

            var metadataToMerge = {
                app_id: 'web',
                source: 'testing'
            };

            var expected = {
                app_id: 'web',
                source: 'testing'
            };

            collection.merge(metadataToMerge);

            assert.deepEqual(collection.collect(), expected, 'A MetadataCollection should appropriately merge metadata into its dictionary.');
        },

        'Merge two metadata objects into a MetadataCollection': function () {
            var collection = metadata.MetadataCollection();

            var metadataToMerge = {
                user_info: {
                    user_id: 12345,
                    name: 'Tester'
                }
            };

            var secondMetadataToMerge = {
                user_info: {
                    demographics: {
                        country: 'USA',
                        age: 29
                    }
                }
            };

            var expected = {
                user_info: {
                    user_id: 12345,
                    name: 'Tester',
                    demographics: {
                        country: 'USA',
                        age: 29
                    }
                }
            };

            collection.merge(metadataToMerge);
            collection.merge(secondMetadataToMerge);

            assert.deepEqual(collection.collect(), expected, 'A MetadataCollection should appropriately merge two metadata objects into its dictionary.');
        }

    });
});
