/*
 * JavaScript tracker for Telligent: out_queue.js
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
		uuid = require('uuid'),
		isArray = require('lodash.isarray'),
		isEmpty = require('lodash.isempty'),
		isString = require('lodash.isstring'),
		localStorageAccessible = require('./lib/detectors').localStorageAccessible,
		helpers = require('./lib/helpers'),
		object = typeof exports !== 'undefined' ? exports : this; // For eventual node.js environment support

	/**
	 * Object handling sending events to a collector.
	 * Instantiated once per tracker instance.
	 *
	 * @param string functionName The Telligent function name (used to generate the localStorage key)
	 * @param string namespace The tracker instance's namespace (used to generate the localStorage key)
	 * @param object mutTelligentState Gives the pageUnloadGuard a reference to the outbound queue
	 *                                so it can unload the page when all queues are empty
	 * @param boolean useLocalStorage Whether to use localStorage at all
	 * @param string apiVersion Version of the payload API being submitted. Currently at v1.
	 * @param string environment Environment in which this script is being deployed (ie production/development/staging)
	 * @return object OutQueueManager instance
	 */
	object.OutQueueManager = function (functionName, namespace, mutTelligentState, useLocalStorage, apiVersion, environment) {
		var	queueName,
			executingQueue = false,
			configCollectorUrl,
			outQueue;

		var path = '/log/' + apiVersion + '/' + environment;

		// Overriding bufferSize to 1 until batching is better implemented
		bufferSize = 1;
		// bufferSize = (localStorageAccessible() && useLocalStorage && bufferSize) || 1;

		queueName = ['telligentOutQueue', functionName, namespace].join('_');

		if (useLocalStorage) {
			// Catch any JSON parse errors or localStorage that might be thrown
			try {
				// TODO: backward compatibility with the old version of the queue for POST requests
				outQueue = JSON.parse(localStorage.getItem(queueName));
			}
			catch(e) {}
		}

		// Initialize to and empty array if we didn't get anything out of localStorage
		if (!isArray(outQueue)) {
			outQueue = [];
		}

		// Used by pageUnloadGuard
		mutTelligentState.outQueues.push(outQueue);

		if (bufferSize > 1) {
			mutTelligentState.bufferFlushers.push(function () {
				if (!executingQueue) {
					executeQueue();
				}
			});
		}

		/**
		 * Count the number of bytes a string will occupy when UTF-8 encoded
		 * Taken from http://stackoverflow.com/questions/2848462/count-bytes-in-textarea-using-javascript/
		 *
		 * @param string s
		 * @return number Length of s in bytes when UTF-8 encoded
		 */
		function getUTF8Length(s) {
			var len = 0;
			for (var i = 0; i < s.length; i++) {
				var code = s.charCodeAt(i);
				if (code <= 0x7f) {
					len += 1;
				} else if (code <= 0x7ff) {
					len += 2;
				} else if (code >= 0xd800 && code <= 0xdfff) {
					// Surrogate pair: These take 4 bytes in UTF-8 and 2 chars in UCS-2
					// (Assume next char is the other [valid] half and just skip it)
					len += 4; i++;
				} else if (code < 0xffff) {
					len += 3;
				} else {
					len += 4;
				}
			}
			return len;
		}

		/*
		 * Queue an image beacon for submission to the collector.
		 * If we're not processing the queue, we'll start.
		 */
		function enqueueRequest (request, url) {
			configCollectorUrl = url + path;
			outQueue.push(request);
			/*
			var encoded = attachBatchInfoToEvent(request).encode();
			var bytes = getUTF8Length(encoded);
			if (bytes >= maxPostBytes) {
				helpers.warn("Event of size " + bytes + " is too long - the maximum size is " + maxPostBytes);
				var xhr = initializeXMLHttpRequest(configCollectorUrl);
				xhr.send(attachBatchInfoToEvent([encoded])));
				return;
			} else {
				outQueue.push({data: encoded, bytes:bytes});
			}

			*/
			
			var savedToLocalStorage = false;
			if (useLocalStorage) {
				savedToLocalStorage = helpers.attemptWriteLocalStorage(queueName, JSON.stringify(outQueue));
			}

			if (!executingQueue && (!savedToLocalStorage || outQueue.length >= bufferSize)) {
				executeQueue();
			}
		}

		/*
		 * Run through the queue of image beacons, sending them one at a time.
		 * Stops processing when we run out of queued requests, or we get an error.
		 */
		function executeQueue () {
			// Failsafe in case there is some way for a bad value like "null" to end up in the outQueue
			while (outQueue.length && typeof outQueue[0] !== 'string' && (typeof outQueue[0] !== 'object' || isEmpty(outQueue[0]))) {
				outQueue.shift();
			}

			if (outQueue.length < 1) {
				executingQueue = false;
				return;
			}

			// Let's check that we have a Url to ping
			if (!isString(configCollectorUrl)) {
				throw "No Telligent collector configured, cannot track";
			}

			executingQueue = true;

			var nextRequest = outQueue[0];

			var xhr = initializeXMLHttpRequest(configCollectorUrl);

			// Time out POST requests after 5 seconds
			var xhrTimeout = setTimeout(function () {
				xhr.abort();
				executingQueue = false;
			}, 5000);

			xhr.onreadystatechange = function () {
				if (xhr.readyState === 4 && xhr.status >= 200 && xhr.status < 400) {

					/*
					for (var deleteCount = 0; deleteCount < numberToSend; deleteCount++) {
						outQueue.shift();
					} */
					outQueue.shift();
					if (useLocalStorage) {
						helpers.attemptWriteLocalStorage(queueName, JSON.stringify(outQueue));
					}
					clearTimeout(xhrTimeout);
					executeQueue();
				} else if (xhr.readyState === 4 && xhr.status >= 400) {
					clearTimeout(xhrTimeout);
					executingQueue = false;
				}
			};

			/*
			var ev = lodash.map(outQueue.slice(0, numberToSend), function (x) {
				return attachBatchInfoToEvent(x).encode();
			});
			*/

			xhr.send(attachBatchInfoToEvent(nextRequest).encode());
		}

		/**
		 * Open an XMLHttpRequest for a given endpoint with the correct credentials and header
		 *
		 * @param string url The destination URL
		 * @return object The XMLHttpRequest
		 */
		function initializeXMLHttpRequest(url) {
			var xhr = new XMLHttpRequest();
			xhr.open('POST', url, true);
			xhr.withCredentials = true;
			//xhr.setRequestHeader('Content-Type', 'application/json; charset=UTF-8');
			xhr.setRequestHeader('Content-Type', 'text/plain');
			return xhr;
		}

		/**
		 * Attaches the batchInfo metadata to an outbound POST payload.
		 *
		 * @param payload the payload to attach the batchInfo to
		 */
		function attachBatchInfoToEvent(payload) {
			var stm = new Date().getTime().toString();
			payload.mergeMetadata({
				batchInfo: {
					batchId: uuid.v4(),
					totalEvents: 1,
					source: 'client',
					serverTime: stm
				}
			});
			return payload;
		}

		return {
			enqueueRequest: enqueueRequest,
			executeQueue: executeQueue
		};
	};

}());
