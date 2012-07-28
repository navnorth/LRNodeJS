Learning Registry Node.js Interface
=========================================================

This is a set of Node.js applications that may be used to view Learning Registry and 
academic standards data stored in couchDB.

## System Requirements
 * nodejs 0.6
 * couchdb >= 1.0

## Installation & Setup of CCSS Browser

 * install node modules
  * `cd ccss`
  * `npm install`
 * configuration
  * couchdb information in `ccss/routes/index.js`
  * data service url in `ccss/config/default.js`
 * create initial couch db and views by running: `ccss/scripts/create_schema.sh`
 * import standards using `ccss/scripts/import.js`
  * to download and import a variety of standards, run: `ccss/scripts/get_standards.sh`
 * to run the app: `node app.js`
 * browse: http://localhost:1337/browser

## Known Issues

 * Resource alignments not loading yet in IE8 due to cross-domain request blocking. Looking for solutions to this.
 * not yet compatible with Express 3.0 (due to removal of the `register` function)
 * not yet compatible with Node.js 0.8 (due to couchdb-api compatibility)
 
## License

Copyright 2012 [Navigation North Learning Solutions LLC](http://navigationnorth.com)

Licensed under the Apache License, Version 2.0 (the "License");	  	
you may not use this file except in compliance with the License.
You may obtain a copy of the License at

    http://www.apache.org/licenses/LICENSE-2.0
	  	
Unless required by applicable law or agreed to in writing, software
distributed under the License is distributed on an "AS IS" BASIS,
WITHOUT WARRANTIES OR CONDITIONS OF ANY KIND, either express or implied.
See the License for the specific language governing permissions and
limitations under the License.

Copyright 2012 [Navigation North Learning Solutions LLC](http://navigationnorth.com)

This project has been funded at least or in part with Federal funds from the U.S. Department of Education under Contract Number ED-04-CO-0040/0010. The content of this publication does not necessarily reflect the views or policies of the U.S. Department of Education nor does mention of trade names, commercial products, or organizations imply endorsement by the U.S. Government.
