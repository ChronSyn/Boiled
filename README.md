# Boiled - Steam game management tool
Boiled is a Windows application that allows users to control where Steam games are installed.

The original version was created in 2011 in Object Pascal (Delphi, Firemonkey/FMX framework). Development of it was postponed in 2012 for numerous reasons.

This version of Boiled is being built upon node.js due to node.js and Javascript having much larger communities, in addition to the simplicity of quickly iterating on development with Javascript when compared with Delphi. Library support is much better in node.js than it is in Delphi and interaction with the system is much easier than using ActiveX or Win32ole \*shudder\*.

## Technology

Boiled utilizes symbolic links to allow users to migrate Steam applications and games between drives which can be useful where drive capacity is limited (such as Solid State Drives). It also displays basic information about games as retrieved from the configuration files provided with a Steam installation.

Boiled may utilize either route-based or websocket-based functionality (i.e. user interaction will be handled through one or both of these methods).

Boiled is meant to be distributed with either node-portable or as an nw.js/node-webkit application. If distributing as an nw.js application, only route-based functionality are available and websockets should not be used unless adding additional functionality to connect to a remote server. A good balance would be to distribute the system-side code along with node-portable and then build an nw.js application to browse to the local server. Alternatively, users can navigate to the interface from a web browser.

## Features
* Automatic detection of Steam installation location, steam libraries, and installed games
* Drive detection and statistics
* Modern UI powered by EJS, jQuery

## Expansion Ideas
 * System information (via WMI)
 * EA Origin support
