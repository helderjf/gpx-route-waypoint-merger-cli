const fs = require('fs');
const { pathToFileURL } = require('url');
const convert = require('xml-js')

//get file names
const folder = process.argv[2]
const fileNames = fs.readdirSync(folder, 'utf-8')

//convert GPX files to JS Objects
const gpxJson = fileNames
    .filter(file => file.endsWith('.gpx') || file.endsWith('.GPX'))
    .map((file) => {
        return convert.xml2js(fs.readFileSync(appendPath(folder, file)),{compact: true})
    })

//separate route from waypoint objects
const routes = getRoutes(gpxJson)
const waypoints = getWaypoints(gpxJson)

//merge route with waypoint
let updatedRoute = {...waypoints[0]}
updatedRoute.gpx.rte = routes[0].gpx.rte

//convert to xml
const updatedRouteXML = convert.js2xml(updatedRoute,{compact: true})

//write output to file system
const outputFolder = appendPath(folder, 'output')
if (!fs.existsSync(outputFolder)){
    fs.mkdirSync(outputFolder);
}
fs.writeFileSync(outputFolder + '/updatedRoute.gpx', updatedRouteXML)



//helper functions
function appendPath(folder, fileName) {
    if (!folder.endsWith('/')) {
        folder = folder.concat('/');
    }
    return folder.concat(fileName)
}

function getRoutes(jsonObjects) {
    return jsonObjects.filter(obj => obj.gpx.rte)
}

function getWaypoints(jsonObjects) {
    return jsonObjects
        .filter(obj => obj.gpx.wpt)
}
