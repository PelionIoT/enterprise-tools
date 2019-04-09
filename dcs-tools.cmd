@ECHO OFF
REM Copyright (c) 2018, Arm Limited and affiliates.
REM SPDX-License-Identifier: Apache-2.0
REM
REM Licensed under the Apache License, Version 2.0 (the "License");
REM you may not use this file except in compliance with the License.
REM You may obtain a copy of the License at
REM
REM     http://www.apache.org/licenses/LICENSE-2.0
REM
REM Unless required by applicable law or agreed to in writing, software
REM distributed under the License is distributed on an "AS IS" BASIS,
REM WITHOUT WARRANTIES OR CONDITIONS OF ANY KIND, either express or implied.
REM See the License for the specific language governing permissions and
REM limitations under the License.
REM
REM
REM
REM just start node manually in case the .js extension is already used by something 
REM as it was on my box
REM This just changes directory to the directory of this script
REM This assumes node.js is installed in the PATH
cd %~dp0
node .\index.js %*


