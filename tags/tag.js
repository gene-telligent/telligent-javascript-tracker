/*
 * JavaScript tracker for Telligent: tag.js
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

/**
 * Use this function to load Telligent
 *
 * @param object t The window
 * @param object r The document
 * @param string a "script", the tag name of script elements
 * @param string c The source of the Telligent script. Make sure you get the latest version.
 * @param string k The Telligent Data namespace. The Telligent Data user should set this.
 * @param undefined e The new script (to be created inside the function)
 * @param undefined d The first script on the page (to be found inside the function)
 */
;(function(t,r,a,c,k,e,d) {
	"t:nomunge, r:nomunge, a:nomunge, c:nomunge, k:nomunge, e:nomunge, d:nomunge";

	// Stop if the Telligent namespace k already exists
	if (!t[k]) { 
	
		// Initialise the 'GlobalTelligentNamespace' array
		t['GlobalTelligentNamespace'] = t['GlobalTelligentNamespace'] || [];
	
		// Add the new Telligent namespace to the global array so telligent.js can find it
		t['GlobalTelligentNamespace'].push(k);
	
		// Create the initializing function
		t[k] = function() {
			(t[k].q = t[k].q || []).push(arguments);
		};
	
		// Initialise the asynchronous queue
		t[k].q = t[k].q || [];

		// Create a new script element
		e = r.createElement(a);
	
		// Get the first script on the page
		d = r.getElementsByTagName(a)[0];
	
		// The new script should load asynchronously
		e.async = 1;
	
		// Load Telligent script
		e.src = c;
	
		// Insert the Telligent script before every other script so it executes as soon as possible
		d.parentNode.insertBefore(e,d);
	}
} (window, document, 'script', '', 'new_name_here'));
