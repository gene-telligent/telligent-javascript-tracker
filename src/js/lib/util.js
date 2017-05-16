/*
 * JavaScript tracker core for Telligent Data: util.js
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

    var object = typeof exports !== 'undefined' ? exports : this;

    object.exists = function (property) {
        return (typeof property !== 'undefined' && property !== null);
    };

    object.isArray = function (property) {
        return (object.exists(property) && property.constructor === [].constructor);
    };

    object.isDict = function (property) {
        return (object.exists(property) && property.constructor === {}.constructor);
    };

    /*
     * Is property a JSON?
     */
    object.isJson = function (property) {
        return (object.isArray(property) || object.isDict(property));
    };

    /*
     * Is property a non-empty JSON?
     */
    object.isNonEmptyJson = function (property) {
        if (!object.isJson(property)) {
            return false;
        }
        for (var key in property) {
            if (property.hasOwnProperty(key)) {
                return true;
            }
        }
        return false;
    };

    object.isNonEmptyJsonDict = function (property) {
        return (object.isNonEmptyJson(property) && object.isDict(property));
    };

    /*
     * Construct a skeleton object with a nesting indicated by path
     * and obj placed at the end.
     *
     * For example, util.placeInPath('test', ['first', 'second']) would
     * return
     * {
     *     first: {
     *         second: test
     *     }
     * }
     * 
     * @param object obj The value to place at the end of the nested dictionary
     * @param array or object path A single key or series of keys
     *
     */
    object.placeInPath = function(obj, path) {
        var key, _val;

        if(!object.isArray(path)) {
            var path = [path];
        }
          
        var val = obj;
        for (var i= path.length -1; i >= 0; i--) {
            key = path[i];
            if (key == undefined) {
                continue;
            }
            _val = {};
            _val[key] = val;
            val = _val;
        }

        return val;
    }

    /*
     * Turn a string from CamelCase to snake_case
     *
     * see http://stackoverflow.com/questions/30521224/javascript-convert-camel-case-to-underscore-case
     */
    object.toSnakeCase = function(s) {
        return s.replace(/([A-Z])/g, function (x,y){return "_" + y.toLowerCase()}).replace(/^_/, "");
    };

    /*
     * Convert the property names of a nested JSON-like object to snake case
     */

    object.sanitizePropertyNames = function(dict) {
        var sanitized = {};

        for (var k in dict) {
            if (dict.hasOwnProperty(k)) {
                var prop = dict[k];
                sanitized[object.toSnakeCase(k)] = (object.isNonEmptyJsonDict(prop) ? object.sanitizePropertyNames(prop) : prop);
            }
        }

        return sanitized;
    };



    object.mergeDicts = function(from, to) {
        if (!object.isNonEmptyJsonDict(from) || !object.isDict(to)) {
            return to;
        }

        var buffer = Object.assign({}, to);
        for (var k in from) {
            if (from.hasOwnProperty(k) && from[k] !== undefined && from[k] !== null) {
                var child = from[k];

                if (object.isNonEmptyJsonDict(child) && buffer.hasOwnProperty(k) && object.isDict(buffer[k])) {
                    buffer[k] = object.mergeDicts(child, buffer[k]);
                } else {
                    buffer[k] = from[k];
                }
            }
        }

        return buffer;
    };


    object.base64encode = function(data) {
        // discuss at: http://phpjs.org/functions/base64_encode/
        // original by: Tyler Akins (http://rumkin.com)
        // improved by: Bayron Guevara
        // improved by: Thunder.m
        // improved by: Kevin van Zonneveld (http://kevin.vanzonneveld.net)
        // improved by: Kevin van Zonneveld (http://kevin.vanzonneveld.net)
        // improved by: Rafał Kukawski (http://kukawski.pl)
        // bugfixed by: Pellentesque Malesuada
        // example 1: base64_encode('Kevin van Zonneveld');
        // returns 1: 'S2V2aW4gdmFuIFpvbm5ldmVsZA=='
        // example 2: base64_encode('a');
        // returns 2: 'YQ=='
        // example 3: base64_encode('✓ à la mode');
        // returns 3: '4pyTIMOgIGxhIG1vZGU='

        var b64 = 'ABCDEFGHIJKLMNOPQRSTUVWXYZabcdefghijklmnopqrstuvwxyz0123456789+/=';
        var o1, o2, o3, h1, h2, h3, h4, bits, i = 0,
            ac = 0,
            enc = '',
            tmp_arr = [];

        if (!data) {
            return data;
        }

        data = unescape(encodeURIComponent(data));

        do {
            // pack three octets into four hexets
            o1 = data.charCodeAt(i++);
            o2 = data.charCodeAt(i++);
            o3 = data.charCodeAt(i++);

            bits = o1 << 16 | o2 << 8 | o3;

            h1 = bits >> 18 & 0x3f;
            h2 = bits >> 12 & 0x3f;
            h3 = bits >> 6 & 0x3f;
            h4 = bits & 0x3f;

            // use hexets to index into b64, and append result to encoded string
            tmp_arr[ac++] = b64.charAt(h1) + b64.charAt(h2) + b64.charAt(h3) + b64.charAt(h4);
        } while (i < data.length);

        enc = tmp_arr.join('');

        var r = data.length % 3;

        return (r ? enc.slice(0, r - 3) : enc) + '==='.slice(r || 3);
    };


}());
