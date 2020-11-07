const fs = require('fs')
const convert = require('xml-js')

//get file names
const folder = process.argv[2]
const start = Date.now();

const fileNames = fs.readdirSync(folder, 'utf-8')

//convert GPX files to JS Objects
const gpxJson = fileNames
    .filter(file => file.endsWith('.gpx') || file.endsWith('.GPX'))
    .map((file) => {
        return convert.xml2js(fs.readFileSync(appendPath(folder, file)),{compact: true})
    })

//separate route from waypoint objects
const routes = getRoutes(gpxJson)
if(routes.length > 1){
    console.log('ERROR: found ' + routes.length + ' route files. You can only have 1.')
    return 1
}
const route = routes[0]
const waypoints = getWaypoints(gpxJson)
const stripedWaypoints = stripWaypoints(waypoints)


//merge route with waypoints
const updatedRoute = {
        _declaration: route._declaration,
        gpx: {
            _attributes: route._attributes,
            wpt: stripedWaypoints,
            rte: route.gpx.rte
        }
    }

//convert to xml
const updatedRouteXML = convert.js2xml(updatedRoute,{compact: true})

//write output to file system
const outputFolder = appendPath(folder, 'output')
if (!fs.existsSync(outputFolder)){
    fs.mkdirSync(outputFolder)
}
fs.writeFileSync(outputFolder + '/updatedRoute.gpx', updatedRouteXML)

//log result and time
console.log('GPX data merged. ' + (Date.now() - start) + 'miliseconds')



//helper functions
function appendPath(folder, fileNameOrSubDir) {
    if (!folder.endsWith('/')) {
        folder = folder.concat('/')
    }
    return folder.concat(fileNameOrSubDir)
}

function getRoutes(jsonObjects) {
    return jsonObjects.filter(obj => obj.gpx.rte)
}

function getWaypoints(jsonObjects) {
    return jsonObjects
        .filter(obj => obj.gpx.wpt)
}

function stripWaypoints(waypoints) {
    return waypoints.map(waypoint => waypoint.gpx.wpt)
}
