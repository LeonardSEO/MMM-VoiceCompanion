//
// Copyright 2021-2022 Picovoice Inc.
//
// You may not use this file except in compliance with the license. A copy of the license is located in the "LICENSE"
// file accompanying this source.
//
// Unless required by applicable law or agreed to in writing, software distributed under the License is distributed on
// an "AS IS" BASIS, WITHOUT WARRANTIES OR CONDITIONS OF ANY KIND, either express or implied. See the License for the
// specific language governing permissions and limitations under the License.
//
"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
var PvRecorderStatus;
(function (PvRecorderStatus) {
    PvRecorderStatus[PvRecorderStatus["SUCCESS"] = 0] = "SUCCESS";
    PvRecorderStatus[PvRecorderStatus["OUT_OF_MEMORY"] = 1] = "OUT_OF_MEMORY";
    PvRecorderStatus[PvRecorderStatus["INVALID_ARGUMENT"] = 2] = "INVALID_ARGUMENT";
    PvRecorderStatus[PvRecorderStatus["INVALID_STATE"] = 3] = "INVALID_STATE";
    PvRecorderStatus[PvRecorderStatus["BACKEND_ERROR"] = 4] = "BACKEND_ERROR";
    PvRecorderStatus[PvRecorderStatus["DEVICE_ALREADY_INITIALIZED"] = 5] = "DEVICE_ALREADY_INITIALIZED";
    PvRecorderStatus[PvRecorderStatus["DEVICE_NOT_INITIALIZED"] = 6] = "DEVICE_NOT_INITIALIZED";
    PvRecorderStatus[PvRecorderStatus["IO_ERROR"] = 7] = "IO_ERROR";
    PvRecorderStatus[PvRecorderStatus["RUNTIME_ERROR"] = 8] = "RUNTIME_ERROR";
})(PvRecorderStatus || (PvRecorderStatus = {}));
exports.default = PvRecorderStatus;
//# sourceMappingURL=pv_recorder_status_t.js.map