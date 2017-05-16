/*
 * JavaScript tracker for Telligent Data: metadata.js
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
        object = typeof exports !== 'undefined' ? exports : this,
        util = require('./util.js');

    object.MetadataCollection = function() {
        var _dict = {};

        function merge(dict) {
            _dict = util.mergeDicts(dict, _dict);
        }

        return {
            merge: merge,
            collect: function() {
                return _dict;
            }
        };
    };

    /*
    object.MetadataCollection = function(dict) {
        var _dict = (typeof dict !== 'undefined' ? Object.assign({}, dict) : {});

        function copy(from, to) {
            for (var i in from) {
                if (from.hasOwnProperty(i) && typeof from[i] !== 'undefined'  && from[i] !== null) {
                    to[i] = from[i];
                }
            }
        };

        function merge(metadata) {
            if(!object.isMetadata(metadata)) {return;}
            if (typeof metadata.group !== 'undefined') {
                var group = _dict[metadata.group] || {};

                if (typeof metadata.subGroup !== 'undefined') {
                    var subgroup = group[metadata.subGroup] || {};
                    copy(metadata.data, subgroup);
                    group[metadata.subGroup] = subgroup;
                } else {
                    copy(metadata.data, group);
                }

                _dict[metadata.group] = group;
            } else {
                copy(metadata.data, _dict);
            }
        };

        return {
            merge: merge,
            collect: function() {
                return _dict;
            }
        };
    } */

}());