/*
 * JavaScript tracker for Telligent: in_queue.js
 * 
 * Significant portions copyright 2010 Anthon Pang. Other portions copyright 
 * 2012-2014 Snowplow Analytics Ltd. Remainder copyright 2016 Telligent Data, 
 * LLC. All rights reserved. 
 * 
 * Redistribution and use in source and binary forms, with or without 
 * modification, are permitted provided that the following conditions are 
 * met: 
 *
 * * Redistributions of source code must retain the above copyright 
 *   notice, this list of conditions and the following disclaimer. 
 *
 * * Redistributions in binary form must reproduce the above copyright 
 *   notice, this list of conditions and the following disclaimer in the 
 *   documentation and/or other materials provided with the distribution. 
 *
 * * Neither the names of Anthon Pang, Snowplow Analytics Ltd, nor Telligent
 *   Data, LLC, nor the names of their contributors, may be used to endorse 
 *   or promote products derived from this software without specific prior
 *   written permission. 
 *
 * THIS SOFTWARE IS PROVIDED BY THE COPYRIGHT HOLDERS AND CONTRIBUTORS 
 * "AS IS" AND ANY EXPRESS OR IMPLIED WARRANTIES, INCLUDING, BUT NOT 
 * LIMITED TO, THE IMPLIED WARRANTIES OF MERCHANTABILITY AND FITNESS FOR 
 * A PARTICULAR PURPOSE ARE DISCLAIMED. IN NO EVENT SHALL THE COPYRIGHT 
 * OWNER OR CONTRIBUTORS BE LIABLE FOR ANY DIRECT, INDIRECT, INCIDENTAL, 
 * SPECIAL, EXEMPLARY, OR CONSEQUENTIAL DAMAGES (INCLUDING, BUT NOT 
 * LIMITED TO, PROCUREMENT OF SUBSTITUTE GOODS OR SERVICES; LOSS OF USE, 
 * DATA, OR PROFITS; OR BUSINESS INTERRUPTION) HOWEVER CAUSED AND ON ANY 
 * THEORY OF LIABILITY, WHETHER IN CONTRACT, STRICT LIABILITY, OR TORT 
 * (INCLUDING NEGLIGENCE OR OTHERWISE) ARISING IN ANY WAY OUT OF THE USE 
 * OF THIS SOFTWARE, EVEN IF ADVISED OF THE POSSIBILITY OF SUCH DAMAGE.
 */

;(function() {

	var
		map = require('lodash.map'),
		isFunction = require('lodash.isfunction'),
		helpers = require('./lib/helpers'),
		uuid = require('uuid'),

		object = typeof exports !== 'undefined' ? exports : this; // For eventual node.js environment support

	/************************************************************
	 * Proxy object
	 * - this allows the caller to continue push()'ing to _teaq
	 *   after the Tracker has been initialized and loaded
	 ************************************************************/

	object.InQueueManager = function(TrackerConstructor, version, mutTelligentState, asyncQueue, functionName) {

		// Page view ID should be shared between all tracker instances
		var pageViewId = uuid.v4(),
			trackerDictionary = {}

		/**
		 * Get an array of trackers to which a function should be applied.
		 *
		 * @param array names List of namespaces to use. If empty, use all namespaces.
		 */
		function getNamedTrackers(names) {
			var namedTrackers = [];

			if (!names || names.length === 0) {
				namedTrackers = map(trackerDictionary);
			} else {
				for (var i = 0; i < names.length; i++) {
					if (trackerDictionary.hasOwnProperty(names[i])) {
						namedTrackers.push(trackerDictionary[names[i]]);
					} else {
						helpers.warn('Warning: Tracker namespace "' + names[i] + '" not configured');
					}
				}
			}

			if (namedTrackers.length === 0) {
				helpers.warn('Warning: No tracker configured');
			}

			return namedTrackers;
		}

		/**
		 * Initiate a new tracker namespace
		 *
		 * @param string namespace
		 * @param string endpoint hostname
		 */
		function createNewNamespace(namespace, endpoint, argmap) {
			argmap = argmap || {};

			if (!trackerDictionary.hasOwnProperty(namespace)) {
				trackerDictionary[namespace] = new TrackerConstructor(functionName, namespace, version, pageViewId, mutTelligentState, argmap);
				trackerDictionary[namespace].setCollectorUrl(endpoint);
			} else {
				helpers.warn('Tracker namespace ' + namespace + ' already exists.');
			}
		}

		/**
		 * Output an array of the form ['functionName', [trackerName1, trackerName2, ...]]
		 *
		 * @param string inputString
		 */
		function parseInputString(inputString) {
			var separatedString = inputString.split(':'),
				extractedFunction = separatedString[0],
				extractedNames = (separatedString.length > 1) ? separatedString[1].split(';') : [];

			return [extractedFunction, extractedNames];
		}

		/**
		 * apply wrapper
		 *
		 * @param array parameterArray An array comprising either:
		 *      [ 'methodName', optional_parameters ]
		 * or:
		 *      [ functionObject, optional_parameters ]
		 */
		function applyAsyncFunction() {
			var i, j, f, parameterArray, input, parsedString, names, namedTrackers;

			// Outer loop in case someone push'es in zarg of arrays
			for (i = 0; i < arguments.length; i += 1) {
				parameterArray = arguments[i];

				// Arguments is not an array, so we turn it into one
				input = Array.prototype.shift.call(parameterArray);

				// Custom callback rather than tracker method, called with trackerDictionary as the context
				if (isFunction(input)) {
					input.apply(trackerDictionary, parameterArray);
					continue;
				}

				parsedString = parseInputString(input);
				f = parsedString[0];
				names = parsedString[1];

				if (f === 'newTracker') {
					createNewNamespace(parameterArray[0], parameterArray[1], parameterArray[2]);
					continue;
				}

				namedTrackers = getNamedTrackers(names);

				for (j = 0; j < namedTrackers.length; j++) {
					if (namedTrackers[j].hasOwnProperty(f)) {
						namedTrackers[j][f].apply(namedTrackers[j], parameterArray);
					}
				}
			}
		}

		// We need to manually apply any events collected before this initialization
		for (var i = 0; i < asyncQueue.length; i++) {
			applyAsyncFunction(asyncQueue[i]);
		}

		return {
			push: applyAsyncFunction
		};
	};

}());
