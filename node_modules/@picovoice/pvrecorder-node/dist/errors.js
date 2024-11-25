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
const pv_recorder_status_t_1 = require("./pv_recorder_status_t");
class PvRecorderStatusOutOfMemoryError extends Error {
}
class PvRecorderStatusInvalidArgumentError extends Error {
}
class PvRecorderStatusInvalidStateError extends Error {
}
class PvRecorderStatusBackendError extends Error {
}
class PvRecorderStatusDeviceAlreadyInitializedError extends Error {
}
class PvRecorderStatusDeviceNotInitializedError extends Error {
}
class PvRecorderStatusIOError extends Error {
}
class PvRecorderStatusRuntimeError extends Error {
}
function pvRecorderStatusToException(status, errorMessage) {
    switch (status) {
        case pv_recorder_status_t_1.default.OUT_OF_MEMORY:
            return new PvRecorderStatusOutOfMemoryError(errorMessage);
        case pv_recorder_status_t_1.default.INVALID_ARGUMENT:
            return new PvRecorderStatusInvalidArgumentError(errorMessage);
        case pv_recorder_status_t_1.default.INVALID_STATE:
            return new PvRecorderStatusInvalidStateError(errorMessage);
        case pv_recorder_status_t_1.default.BACKEND_ERROR:
            return new PvRecorderStatusBackendError(errorMessage);
        case pv_recorder_status_t_1.default.DEVICE_ALREADY_INITIALIZED:
            return new PvRecorderStatusDeviceAlreadyInitializedError(errorMessage);
        case pv_recorder_status_t_1.default.DEVICE_NOT_INITIALIZED:
            return new PvRecorderStatusDeviceNotInitializedError(errorMessage);
        case pv_recorder_status_t_1.default.IO_ERROR:
            return new PvRecorderStatusIOError(errorMessage);
        case pv_recorder_status_t_1.default.RUNTIME_ERROR:
            return new PvRecorderStatusRuntimeError(errorMessage);
        default:
            // eslint-disable-next-line
            console.warn(`Unknown error code: ${status}`);
            return new Error(errorMessage);
    }
}
exports.default = pvRecorderStatusToException;
//# sourceMappingURL=errors.js.map