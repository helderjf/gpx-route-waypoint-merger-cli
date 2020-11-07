const fs = require('fs').promises
const convert = require('xml-js')

const start = Date.now();

//get file names
const folder = process.argv[2]
handle(folder)

async function handle(folder) {
    try {
        //read files
        const fileNames = await fs.readdir(folder, 'utf-8')
        const files = fileNames
            .filter(fileName => fileName.endsWith('.gpx') || fileName.endsWith('.GPX'))
            .map(fileName => appendPath(folder, fileName))
        const gpxData = []
        for (let i = 0; i < files.length; i++) {
            const gpx = await fs.readFile(files[i])
            gpxData.push(gpx)
        }

        //convert GPX data to JS Objects
        const jsData = gpxData.map(gpx => convert.xml2js(gpx, {compact: true}))
        
        //separate route from waypoint objects
        const routes = jsData.filter(obj => obj.gpx.rte)
        if (routes.length > 1) {
            throw new Error('ERROR: found ' + routes.length + ' route files. You can only have 1.')
        }
        const route = routes[0]
        const waypoints = jsData
            .filter(obj => obj.gpx.wpt)
            .map(waypoint => waypoint.gpx.wpt)//save only the wpt element

        //merge route with waypoints
        const updatedRoute = {
            _declaration: route._declaration,
            gpx: {
                _attributes: route._attributes,
                wpt: waypoints,
                rte: route.gpx.rte
            }
        }

        //convert to xml
        const updatedRouteXML = convert.js2xml(updatedRoute, { compact: true })

        //write output to file system
        const outputFolder = appendPath(folder, 'output')
        try {
            await fs.stat(outputFolder)
        } catch (error) {
            await fs.mkdir(outputFolder)
        }
        await fs.writeFile(outputFolder + '/updatedRoute.gpx', updatedRouteXML)

        //log result and time
        console.log('GPX data merged. ' + (Date.now() - start) + 'miliseconds')

    } catch (error) {
        console.log(error)
        process.exit(1)
    }
}


//helper functions
function appendPath(folder, fileNameOrSubDir) {
    if (!folder.endsWith('/')) {
        folder = folder.concat('/');
    }
    return folder.concat(fileNameOrSubDir)
}
