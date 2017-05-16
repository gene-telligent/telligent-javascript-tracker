/*
 * JavaScript tracker core for Telligent Data: payload.js
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

	var 
		meta = require('./metadata.js'),
		util = require('./util.js'),
		object = typeof exports !== 'undefined' ? exports : this;

	/**
	 * A helper to build a Telligent request string from
	 * an a set of individual key value pairs, Javascript dictionaries,
	 * and JSON text.
	 *
	 * @param boolean b64 Whether or not the request should be
	 * Base64-URL-safe-encoded
	 *
	 * @return object The request string builder, with add, addRaw and build methods
	 */
	object.payloadBuilder = function(base64Encode) {
		var data = {},
			metadataCollection = meta.MetadataCollection(),
			base64Encode = (base64Encode !== undefined ? base64Encode : true);

		var add = function (key, value) {
			if (value !== undefined && value !== null && value !== '') {
				data[key] = value;
			}
		};

		var remove = function(key) {
			if (data.hasOwnProperty(key)) {
				delete data[key];
			}
		}

		var mergeMetadata = function(dict) {
			metadataCollection.merge(dict);
		};

		var mergeMetadataCollection = function(collection) {
			metadataCollection.merge(collection.collect());
		}

		var resetMetadata = function(dict) {
			metadataCollection = meta.MetadataCollection();
			metadataCollection.merge(dict);
		};

		var copyDict = function (dict) {
			for (var key in dict) {
				if (dict.hasOwnProperty(key)) {
					add(key, dict[key]);
				}
			}
		};

		var sanitize = function() {
			var sanitizedData = util.sanitizePropertyNames(data);
			if (sanitizedData.hasOwnProperty('type')) {
				sanitizedData.type = util.toSnakeCase(sanitizedData.type);
			}
			return {
				metadata: util.sanitizePropertyNames(metadataCollection.collect()),
				data: sanitizedData
			};
		}

		var build = function() {
			var sanitized = sanitize();
			var built = Object.assign({}, sanitized.metadata);
			built['events'] = [sanitized.data];
			return built;
		}

		var encode = function() {
			encoded = JSON.stringify(build());
			if (base64Encode) {
				encoded = util.base64encode(encoded);
			}
			return encoded;
		}

		return {
			add: add,
			remove: remove,
			copyDict: copyDict,
			mergeMetadata: mergeMetadata,
			mergeMetadataCollection: mergeMetadataCollection,
			resetMetadata: resetMetadata,
			build: build,
			encode: encode
		};
	}

}());
