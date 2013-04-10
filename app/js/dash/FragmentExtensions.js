/*
 *
 * Licensed under the Apache License, Version 2.0 (the "License");
 * you may not use this file except in compliance with the License.
 * You may obtain a copy of the License at
 *
 *     http://www.apache.org/licenses/LICENSE-2.0
 *
 * Unless required by applicable law or agreed to in writing, software
 * distributed under the License is distributed on an "AS IS" BASIS,
 * WITHOUT WARRANTIES OR CONDITIONS OF ANY KIND, either express or implied.
 * See the License for the specific language governing permissions and
 * limitations under the License.
 *
 * author Digital Primates
 * copyright dash-if 2012
 */
Dash.dependencies.FragmentExtensions = function () {
    "use strict";

    var parseTFDT = function (ab) {
            var d = new DataView(ab),
                pos = 0,
                base_media_decode_time,
                version,
                size,
                type,
                i,
                c;

            while (type !== "tfdt" && pos < d.byteLength) {
                size = d.getUint32(pos); // subtract 8 for including the size and type
                pos += 4;

                type = "";
                for (i = 0; i < 4; i += 1) {
                    c = d.getInt8(pos);
                    type += String.fromCharCode(c);
                    pos += 1;
                }

                if (type !== "moof" && type !== "traf" && type !== "tfdt") {
                    pos += size - 8;
                }
            }

            if (pos === d.byteLength) {
                throw "Error finding live offset.";
            }

            version = d.getUint8(pos);
            pos += size - 16;

            this.debug.log("position: " + pos);

            if (version === 0) {
                base_media_decode_time = d.getUint32(pos, false);
            } else {
                base_media_decode_time = utils.Math.to64BitNumber(d.getUint32(pos + 4, false), d.getUint32(pos, false));
            }

            return {
                'version' : version,
                'base_media_decode_time' : base_media_decode_time
            };
        },

        loadFragment = function (media) {
            var deferred = Q.defer(),
                request = new XMLHttpRequest(),
                url;

            url = media;

            request.onload = function () {
                var parsed = parseTFDT(request.response);
                deferred.resolve(parsed);
            };

            request.onerror = function () {
                var errorStr = "Error loading fragment: " + url;
                deferred.reject(errorStr);
            };

            request.responseType = "arraybuffer";
            request.open("GET", url);
            request.send(null);

            return deferred.promise;
        };

    return {
        debug : undefined,
        loadFragment : loadFragment,
        parseTFDT : parseTFDT
    };
};

Dash.dependencies.FragmentExtensions.prototype = {
    constructor: Dash.dependencies.FragmentExtensions
};