var data = [];

// Slider Objects
var zValue = document.getElementById("zValue");
var sliderObj = document.getElementById("slideBar");
var xBar = document.getElementById("xBar");
var yBar = document.getElementById("yBar");
var zBar = document.getElementById("zBar");

var projection = d3.select('#rectView');
zValue.innerHTML = sliderObj.value;

// bounds of the data
const bounds = {};
var xScale = d3.scaleLinear().domain([bounds.minX, bounds.maxX])
                                .range([0, 400 ]);
var yScale = d3.scaleLinear().domain([bounds.minY, bounds.maxY])
                                .range([400, 0]);

// color scales
var infernoScale = d3.scaleSequential(d3.interpolateInferno)
                        .domain([0, 40]);
var grayScale = d3.scaleSequential(d3.interpolateGreys)
                    .domain([0, 40]);

// plane
var planeGeo = new THREE.PlaneGeometry(13,13);
var planeMat = new THREE.MeshBasicMaterial({color: 'white', 
                                            side: THREE.DoubleSide, 
                                            transparent: true, 
                                            opacity: 0.6 } );
var plane = new THREE.Mesh(planeGeo, planeMat);
plane.position.set(0,0,5);
scene.add(plane);

// creates Particle system
var particlesGeo = new THREE.BufferGeometry();
var particleMat = new THREE.PointsMaterial({sizeAttenuation: false,
                                            size:0.3,
                                            vertexColors: true, 
                                            opacity:0.5});
var particles = new THREE.Points();
const createParticleSystem = (data) => {
    // draw your particle system here!
    var dataPoints = [];
    var pointColors = [];

    // set attributes for each individual point
    var i=0;
    while(i<data.length) {
        var pointColor = new THREE.Color(infernoScale(data[i].concentration));
        pointColors.push(pointColor.r, pointColor.g, pointColor.b);
        dataPoints.push(data[i].X, data[i].Y, data[i].Z);
        i++;
    };
    
    // Add attributes to particles
    particlesGeo.setAttribute('position', new THREE.Float32BufferAttribute(dataPoints, 3));
    particlesGeo.setAttribute('color', new THREE.Float32BufferAttribute(pointColors, 3));
    
    // Set geometry and material of particles
    particles.geometry = particlesGeo;
    particles.material = particleMat;
    
    // Add particles to scene
    scene.add(particles);
};

const createProjection = (data) => {
    // reset projection
    projection.selectAll('*').remove();
    var projPoints = [];
    var i = 0;
    while(i<data.length) {
        //console.log('point values', data[i].Z, z)
        var planeColor = new THREE.Color();
        if((data[i].Z >= 4.96) && (data[i].Z < 5.04)) {
            var coodArray = {"X": data[i].X , "Y": data[i].Y , "concentration": data[i].concentration};
            projPoints.push(coodArray);
        }

        i++;
    };
    var xScale = d3.scaleLinear().domain([bounds.minX, bounds.maxX])
                                    .range([0, 400 ]);
    var yScale = d3.scaleLinear().domain([bounds.minY, bounds.maxY])
                                    .range([400, 0]);
                    
    

    projection.selectAll("circles")
    .data(projPoints)
    .join("circle")
    .attr("r", 4)
    .attr("cx", d => {return xScale(d.X);})
    .attr("cy", d => {return yScale(d.Y);})
    .style("fill", d => {return infernoScale(d.concentration)});
    
}

function planeSlice(z, data) {
    // reset projection
    projection.selectAll('*').remove();

    var planeColors = [];
    var planePoints = [];
    var i = 0; 
    while(i<data.length) {
        //console.log('point values', data[i].Z, z)
        var planeColor = new THREE.Color();
        if((data[i].Z >= (z - 0.04)) && (data[i].Z < (z + 0.04))){
            var coodArray = {"X": data[i].X , "Y": data[i].Y , "concentration": data[i].concentration};
            planePoints.push(coodArray);
            planeColor.set(infernoScale(data[i].concentration));
            planeColors.push(planeColor.r, planeColor.g, planeColor.b);
        }
        else {
            planeColor.set(grayScale(data[i].concentration));
            planeColors.push(planeColor.r, planeColor.g, planeColor.b);
        }

        i++;
    }
    particlesGeo.setAttribute('color', new THREE.Float32BufferAttribute(planeColors, 3));

    // 2D scale
    var xScale = d3.scaleLinear().domain([bounds.minX, bounds.maxX])
                                    .range([0, 400 ]);
    var yScale = d3.scaleLinear().domain([bounds.minY, bounds.maxY])
                                    .range([400, 0]);
    

    projection.selectAll("circles")
    .data(planePoints)
    .join("circle")
    .attr("r", 4)
    .attr("cx", d => {return xScale(d.X);})
    .attr("cy", d => {return yScale(d.Y);})
    .style("fill", d => {return infernoScale(d.concentration)});
    
};

// Rotate point cloud function
function rotatePoints(cloud, xDeg = 0, yDeg = 0, zDeg = 0) {
    cloud.rotateX(THREE.MathUtils.degToRad(xDeg));
    cloud.rotateY(THREE.MathUtils.degToRad(yDeg));
    cloud.rotateZ(THREE.MathUtils.degToRad(zDeg));
};

// Slider functions
function planeSlider() {
    zValue.innerHTML = sliderObj.value;
    var z_val = parseFloat(sliderObj.value) + 5;
    plane.position.z = z_val;
    console.log('plane pos', plane.position.z, z_val, sliderObj.value+5)
    planeSlice(z_val, data);
};

function xSlider() {
    rotatePoints(particles, parseInt(xBar.value), 0, 0);
};

function ySlider() {
    rotatePoints(particles, 0, parseInt(yBar.value), 0);
};

function zSlider() {
    rotatePoints(particles, 0, 0, parseInt(zBar.value));
};

// Reset function
function reset() {
    zValue.innerHTML = sliderObj.value = 0;
    xBar.value = 0;
    yBar.value = 0;
    zBar.value = 0;
    plane.position.set(0,0,5);
    particles.rotation.set( 0, 0, 0 );
    createParticleSystem(data);
    createProjection(data);

};

const loadData = (file) => {

    // read the csv file
    d3.csv(file).then(function (fileData)
    // iterate over the rows of the csv file
    {
        fileData.forEach(d => {
            // get the min bounds
            bounds.minX = Math.min(bounds.minX || Infinity, d.Points0);
            bounds.minY = Math.min(bounds.minY || Infinity, d.Points1);
            bounds.minZ = Math.min(bounds.minZ || Infinity, d.Points2);

            // get the max bounds
            bounds.maxX = Math.max(bounds.maxX || -Infinity, d.Points0);
            bounds.maxY = Math.max(bounds.maxY || -Infinity, d.Points1);
            bounds.maxZ = Math.max(bounds.maxY || -Infinity, d.Points2);

            // add the element to the data collection
            data.push({
                // concentration density
                concentration: Number(d.concentration),
                // Position
                X: Number(d.Points0),
                Y: Number(d.Points1),
                Z: Number(d.Points2),
                // Velocity
                U: Number(d.velocity0),
                V: Number(d.velocity1),
                W: Number(d.velocity2)
            })
        });
        // draw the containment cylinder
        // TODO: Remove after the data has been rendered
        //createCylinder()
        // create the particle system
        createParticleSystem(data);
        createProjection(data);
    })


};


loadData('data/058.csv');