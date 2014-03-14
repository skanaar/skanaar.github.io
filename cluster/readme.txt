Cluster Platform
================

Site architecture
----------------
The site consists of:
- Three separate landing pages (English, Swedish, Chinese)
- A single page application (platform.html)

The single page application
----------------
Powered by AngularJS that handles routing. It looks like multiple pages but the sub-pages are partials that are loaded and inserted when the #-hash part of the url changes.
- js/webapp.js : contains the entire AngularJS application
- partials/*.partial.html : templates for the sub-pages

Editing data
----------------
Every file in the /data folder is editable. http://pro.jsonlint.com can come in handy when validating the JSON data.

Goals Indicator 
----------------
A Processing.js app that is included in the landing pages. It is also loaded by AngularJS controller LoginCtrl on the login page.
Its data is pulled from data/indicator.txt.

Login page
----------------
The login is just a faked login and the credentials checking is done on the client.
The files /data/users/<username>.json contain the user passwords.

Dashboard
----------------
Most data here is loaded from:

- data/goals/<username>.json
- data/updates/<username>.json
- data/users/<username>.json
- data/user-img/<username>.jpg.

Add new files to these folders to add users.

New Solution
----------------
When you click save a JSON object with all entered information is created and emailed to the address contained in data/adminemail.txt.

Clusters
----------------
Every cluster is defined in a data/clusters/cluster-X.json where X is a number. To add more clusters the clusterCount field in data/clustersearch.json must be updated to match the number of data/cluster-X.json files.

The Cluster display is a HTML5 canvas application not built on AngularJS. It is spread over six files:

- webapp.js : the AngularJS controller 'ClusterCtrl' which handles the filtering UI components
- engine.js : handles mouse interactions, is the Controller
- nodes.js : runs the layout algorithm and is the Model for data manipulation
- visualizer.js : the rendering component, is the View for canvas display
- canvas.js : utility library for canvas rendering
- vector.js : utility library for 2D vector math

Network
----------------
Dummy image

Map
----------------
Loads the file data/map.json and displays this using Google Maps
