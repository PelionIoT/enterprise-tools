/*
 * Copyright (c) 2018, Arm Limited and affiliates.
 * SPDX-License-Identifier: Apache-2.0
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
 */

module.exports = {
    atEndOfPageable : function(body) {
        if (typeof body == 'object' && body._links && body._links.next && body._links.next.href) {
            if (body._links.self && body._links.self.href) {
                if (body._links.self.href == body._links.next.href) {
                    return true;
                }
            } else {
                // invalid - so don't call again
                return true;
            }
            return false;
        }
        // invalid - so don't call again
        return true;
    },
    cleanupCSVText : function(s) {
        //  var ret = s;
        var ret = "";
        if (typeof s == "string") {
            for (var n = 0; n < s.length; n++) {
                switch (s[n]) {
                    case '\n':
                    case '\r':
                    case '\t':
                        ret += " ";
                        break;
                    case '\'':
                        ret += '\"';
                        break;
                    case ',':
                        ret += " | ";
                        break;
                    default:
                        ret += s[n];
                }
            }
        }
        return ret;
    },
    cleanupCSVJson : function(s) {
        //  var ret = s;
        var ret = "";
        if (typeof s == "string") {
            for (var n = 0; n < s.length; n++) {
                switch (s[n]) {
                    case '{':
                    case '}':
                        if (n == 0 || n == s.length - 1)
                            continue;
                        else
                            ret += s[n];
                        break;
                    case '\n':
                    case '\r':
                    case '\t':
                        ret += " ";
                        break;
                    case '\'':
                        ret += '\"';
                        break;
                    case ',':
                        ret += " | ";
                        break;
                    default:
                        ret += s[n];
                }
            }
        }
        return ret;
    }    
}