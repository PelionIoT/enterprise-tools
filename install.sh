#!/bin/bash

# Copyright (c) 2018, Arm Limited and affiliates.
# SPDX-License-Identifier: Apache-2.0
#
# Licensed under the Apache License, Version 2.0 (the "License");
# you may not use this file except in compliance with the License.
# You may obtain a copy of the License at
#
#     http://www.apache.org/licenses/LICENSE-2.0
#
# Unless required by applicable law or agreed to in writing, software
# distributed under the License is distributed on an "AS IS" BASIS,
# WITHOUT WARRANTIES OR CONDITIONS OF ANY KIND, either express or implied.
# See the License for the specific language governing permissions and
# limitations under the License.

rm -rf package-lock.json

NOD=$(which node)

# installing node if not in the system
if [ "$NOD" == "" ] ; then
	output "Installing nodejs..."
	sudo apt-get update
	sudo apt-get install curl software-properties-common
	curl -sL https://deb.nodesource.com/setup_8.x | sudo bash -
	sudo apt-get install nodejs
	sudo apt-get install npm
	sudo ln -s $(which nodejs) /usr/bin/node
	nodejs -v
fi

npm install

if [ -d "manifest-tool" ] ; then
    echo "manifest-tool exists." 
else
    if git clone https://github.com/ARMmbed/manifest-tool.git ; then
    	echo "Added manifest-tool"
    else echo "git clone failed"
    fi
fi

if [ ! -d "manifests" ] ; then
    mkdir manifests
fi
