var grid = [];
var cellSize = 24;
var wallColor = [30,30,60];
var visitedColor = [0,225,245];
var preVisitedColor = [0,200,220];

var dijkColor = [240,110,110];
var preDijkColor = [200,90,90];

var pathColor = [240,240,0];
var sourceColor = [0,80,240];
var destinationColor = [220,30,30];
var canvasResized = true;
var currAction = 'Wall';
var currAlgorithm = undefined;
var sourcePos = {i: null, j: null};
var destinationPos = {i: null, j: null};
var sourceDragging = false;
var destinationDragging = false;
var timeouts = [];
var speed = 9;
var algoInProgress = false;
var cellsExplored = 0;
var pathLength = 0;

var infos = {
    'Dijkstras': 'Dijkstras Algorithm for an unweighted graph can be understood as a fire spreading evenly on the graph. Guarantees the shortest path.',
    'Bi-Directional Dijkstras': 'Meet-in-the-middle Dijkstras Algorithm. Guarantees the shortest path.',
    'DFS': 'The idea behind DFS is to go as deep into the graph as possible and then backtrack. DOES NOT guarantee the shortest path.',
    'A-star' : 'A* Search Algorithm is a heuristic informed search algorithm. Guarantees the shortest path.',
    'Greedy Best-First': 'Greedy Best-first search prioritizes paths that appear to be the most promising, regardless of whether or not they are actually the shortest path. '
}

class Cell{
    constructor(isWall) {
        this.isSource = false;
        this.isDestination = false;
        this.isWall = isWall;
        this.isPath = false;
        this.distFromSource = 99999;
        this.distFromDestination = 99999;
        this.preVisited = false;
        this.visited = false;
        this.preDijk = false;
        this.dijk = false;
    }
};

class Queue {
    constructor() {
      this.elements = {};
      this.head = 0;
      this.tail = 0;
    }
    enqueue(element) {
      this.elements[this.tail] = element;
      this.tail++;
    }
    dequeue() {
      const item = this.elements[this.head];
      delete this.elements[this.head];
      this.head++;
      return item;
    }
    peek() {
      return this.elements[this.head];
    }
    get length() {
      return this.tail - this.head;
    }
    get isEmpty() {
      return this.length === 0;
    }
};

class QueueElement {
    constructor(elem, priNo) {
        this.element = elem;
        this.priority = priNo;
    }
 }

class PriorityQueue {
    constructor() {
        this.queArr = [];
    }
    enqueue(elem, priNo) {
        let queueElem = new QueueElement(elem, priNo);
        let contain = false;
        for (let i = 0; i < this.queArr.length; i++) {
            if (this.queArr[i].priority > queueElem.priority) {
                this.queArr.splice(i, 0, queueElem);
                contain = true;
                break;
            }
        }
        if (!contain) {
            this.queArr.push(queueElem);
        }
    }
    dequeue() {
        if (this.isEmpty()) return false;
        return this.queArr.shift();
    }
    front() {
        if (this.isEmpty()) return false;
        return this.queArr[0];
    }
    rear() {
        if (this.isEmpty()) return false;
        return this.queArr[this.queArr.length - 1];
    }
    isEmpty() {
        return this.queArr.length == 0;
    }
}

window.addEventListener("load", (event) => {});

function setup() {

    this.algoInProgress = false;
    this.pathLength = 0;
    this.cellsExplored = 0;
    document.getElementById('pathLength').innerHTML = this.pathLength;
    document.getElementById('cellsExplored').innerHTML = this.cellsExplored;
    this.clearTimeouts();
    let iMax = Math.round((window.innerHeight-200)/cellSize);
    let jMax = Math.round(window.innerWidth/cellSize);

    this.sourcePos = {i: Math.floor(iMax/2), j: Math.floor(jMax/4) };
    this.destinationPos = {i: Math.floor(iMax/2), j: 3*Math.floor(jMax/4) };

    let canvas = createCanvas(window.innerWidth, window.innerHeight-200);
    canvas.parent('#canvasContainer');
    
    this.grid = [];
    for(let i=0; i < iMax; i++){
        this.grid.push([]);
        for(let j=0; j < jMax; j++){
            let x = new Cell(false);
            this.grid[i].push(x);
        }
    }
    this.grid[this.sourcePos.i][this.sourcePos.j].isSource = true;
    this.grid[this.destinationPos.i][this.destinationPos.j].isDestination = true;
    this.canvasResized = true;
} 

function draw() {
    if(this.canvasResized) this.displayGrid();
}

function displayGrid(){
    let iMax = Math.round((window.innerHeight-200)/cellSize);
    let jMax = Math.round(window.innerWidth/cellSize);

    for(let i=0; i < iMax; i++){
        for(let j=0; j < jMax; j++){
            this.grid[i][j].isSource  = (i === this.sourcePos.i && j === this.sourcePos.j)? true: false;
            this.grid[i][j].isDestination = (i === this.destinationPos.i && j === this.destinationPos.j)? true: false;

            this.grid[i][j]?.isSource? fill(sourceColor): this.grid[i][j]?.isDestination? fill(destinationColor) : this.grid[i][j]?.isWall? fill(wallColor): this.grid[i][j].isPath? fill(pathColor) : this.grid[i][j].dijk? fill(dijkColor) : this.grid[i][j].preDijk? fill(preDijkColor) : this.grid[i][j].visited? fill(visitedColor): this.grid[i][j].preVisited? fill(preVisitedColor) : fill(250,250,255);
            this.grid[i][j]?.isSource? stroke(wallColor): this.grid[i][j]?.isDestination? stroke(wallColor) : this.grid[i][j]?.isWall? stroke(wallColor): this.grid[i][j].isPath? stroke(230,230,180) : this.grid[i][j].dijk? stroke(255,140,140) : this.grid[i][j].visited? stroke(180,250,255) : stroke(190,200,210);
            square(j*cellSize, i*cellSize, cellSize);
        }
    }
}

function mousePressed() {
    let i = Math.floor((mouseY)/cellSize);
    let j = Math.floor((mouseX)/cellSize);

    if(i>=0 && j>=0 && i<this.grid.length && j<this.grid[0].length){
        if(this.sourceDragging){
            this.sourcePos.i = i;
            this.sourcePos.j = j;
            return;
        }
        else if(this.destinationDragging){
            this.destinationPos.i = i;
            this.destinationPos.j = j;
            return;
        }
        if(this.grid[i][j].isSource){
            this.sourceDragging = true;
            return;
        }
        else if(this.grid[i][j].isDestination){
            this.destinationDragging = true;
            return;
        }

        if(this.currAction === 'Wall') this.grid[i][j].isWall = true;
        else this.grid[i][j].isWall = false;
        
        if(this.algoInProgress){
            this.clearTimeouts();
            switch(this.currAlgorithm){
                case 'Dijkstras':
                    this.dijk(true);
                    break;
                case 'DFS':
                    this.dfs(true);
                    break;
                case 'A-star':
                    this.aStar(true);
                    break;
                case 'Greedy Best-First':
                    this.greedy(true);
                    break;
                case 'Bi-Directional Dijkstras':
                    this.biDijk(true);
                    break;
                default:
                    return;
            }
        }
    }
}

function mouseReleased(){
    let i = Math.floor((mouseY)/cellSize);
    let j = Math.floor((mouseX)/cellSize);

    if(i>=0 && j>=0 && i<this.grid.length && j<this.grid[0].length){
        if(this.sourceDragging){
            this.grid[i][j].isSource = true;
            this.sourceDragging = false;
        }
        else if(this.destinationDragging){
            this.grid[i][j].isDestination = true;
            this.destinationDragging = false;
        }
        if(this.algoInProgress){
            this.clearTimeouts();
            switch(this.currAlgorithm){
                case 'Dijkstras':
                    this.dijk(true);
                    break;
                case 'DFS':
                    this.dfs(true);
                    break;
                case 'A-star':
                    this.aStar(true);
                    break;
                case 'Greedy Best-First':
                    this.greedy(true);
                    break;
                case 'Bi-Directional Dijkstras':
                    this.biDijk(true);
                    break;
                default:
                    return;
            }
        }
    }
    else{
        if(this.sourceDragging) this.sourceDragging = false;
        if(this.destinationDragging) this.destinationDragging = false;
    }
}

function mouseDragged() {
    let i = Math.floor((mouseY)/cellSize);
    let j = Math.floor((mouseX)/cellSize);

    if(i>=0 && j>=0 && i<this.grid.length && j<this.grid[0].length){
        if(this.algoInProgress){
            this.clearTimeouts();
            switch(this.currAlgorithm){
                case 'Dijkstras':
                    this.dijk(true);
                    break;
                case 'DFS':
                    this.dfs(true);
                    break;
                case 'A-star':
                    this.aStar(true);
                    break;
                case 'Greedy Best-First':
                    this.greedy(true);
                    break;
                case 'Bi-Directional Dijkstras':
                    this.biDijk(true);
                    break;
                default:
                    return;
            }
        }
    }
    this.mousePressed();
}

function logslider(position) {
    var minp = 100;
    var maxp = 0;

    var minv = Math.log(1);
    var maxv = Math.log(80);
  
    var scale = (maxv-minv) / (maxp-minp);
    return Math.exp(minv + scale*(position-minp));
}

function changeSpeed(val){
    this.speed = logslider(val);
}

function clearBoard(){
    this.algoInProgress = false;
    this.cellsExplored = 0;
    this.pathLength = 0;
    document.getElementById('cellsExplored').innerHTML = this.cellsExplored;
    document.getElementById('pathLength').innerHTML = this.pathLength;
    this.clearTimeouts();
    for(let i=0; i< this.grid.length; i++){
        for(let j=0; j<grid[i].length; j++){
            this.grid[i][j].isWall = false;
            this.grid[i][j].isPath = false;
            this.grid[i][j].visited = false;
            this.grid[i][j].preVisited = false;
            this.grid[i][j].preDijk = false;
            this.grid[i][j].dijk = false;
        } 
    }
}

function clearTimeouts(){
    for(let i=0; i<timeouts.length; i++) clearTimeout(timeouts[i]);
}

async function dfs(instantFlag = false){
    this.algoInProgress = false;
    this.pathLength = 0;
    this.cellsExplored = 0;
    document.getElementById('pathLength').innerHTML = this.pathLength;
    document.getElementById('cellsExplored').innerHTML = this.cellsExplored;
    this.clearTimeouts();
    for(let i=0; i<this.grid.length;i++){
        for(let j=0;j<this.grid[0].length;j++){
            this.grid[i][j].preVisited = false;
            this.grid[i][j].visited = false;
            this.grid[i][j].isPath = false;
            this.grid[i][j].distFromSource = 99999;
            this.grid[i][j].preDijk = false;
            this.grid[i][j].dijk = false;
            this.grid[i][j].distFromDestination = 99999;
        }
    }

    this.grid[this.sourcePos.i][this.sourcePos.j].preVisited = true;
    this.grid[this.sourcePos.i][this.sourcePos.j].visited = true;
    this.grid[this.sourcePos.i][this.sourcePos.j].distFromSource = 0;
    this.recursiveDFS(this.sourcePos.i, this.sourcePos.j, 0, instantFlag);
}

async function aStar(instantFlag = false){
    this.algoInProgress = false;
    this.pathLength = 0;
    this.cellsExplored = 0;
    document.getElementById('pathLength').innerHTML = this.pathLength;
    document.getElementById('cellsExplored').innerHTML = this.cellsExplored;
    this.clearTimeouts();
    for(let i=0; i<this.grid.length;i++){
        for(let j=0;j<this.grid[0].length;j++){
            this.grid[i][j].preVisited = false;
            this.grid[i][j].visited = false;
            this.grid[i][j].isPath = false;
            this.grid[i][j].distFromSource = 99999;
            this.grid[i][j].preDijk = false;
            this.grid[i][j].dijk = false;
            this.grid[i][j].distFromDestination = 99999;
        }
    }
    let pQue = new PriorityQueue();
    this.grid[this.sourcePos.i][this.sourcePos.j].preVisited = true;
    this.grid[this.sourcePos.i][this.sourcePos.j].visited = true;
    this.grid[this.sourcePos.i][this.sourcePos.j].distFromSource = 0;
    pQue.enqueue(this.sourcePos, this.getDistanceFromDestination(this.sourcePos.i,this.sourcePos.j));
    this.recursiveAStar(pQue, instantFlag);
}


async function recursiveAStar(pQue, instantFlag){
    if(pQue.isEmpty()){
        this.algoInProgress = true;
        return;
    }
    let i = pQue.front().element.i;
    let j = pQue.front().element.j;
    pQue.dequeue();

    if(grid[i][j].isDestination){
        this.tracePath(instantFlag);
        return;trace
    }

    this.grid[i][j].visited = true;
    await new Promise((resolve) => {
        if(!instantFlag){
            this.timeouts.push(setTimeout(async () => {
                this.recursiveAStarUtil(i,j,pQue, instantFlag);
                resolve();
            }, this.speed));
        }
        else recursiveAStarUtil(i,j,pQue,instantFlag);
        
    });
}

function getHeuristicDistance(i,j){
    let a1 = Math.abs(this.destinationPos.i - i);
    let b1 = Math.abs(this.destinationPos.j - j);
    var distFromDestination = Math.sqrt(a1*a1 + b1*b1);
    var distFromSource = this.grid[i][j].distFromSource;
    return distFromDestination + 0.5*distFromSource;
}

async function recursiveAStarUtil(i,j, pQue, instantFlag){
    if(i-1 >=0 && (( (!this.grid[i-1][j].preVisited || this.grid[i][j].preVisited && this.grid[i-1][j].distFromSource > this.grid[i][j].distFromSource + 1 ) && !this.grid[i-1][j].isWall) || this.grid[i-1][j].isDestination)){
        this.grid[i-1][j].distFromSource = Math.min(this.grid[i-1][j].distFromSource, this.grid[i][j].distFromSource+1);
        this.grid[i-1][j].preVisited = true;
        this.cellsExplored++;
        document.getElementById('cellsExplored').innerHTML = this.cellsExplored;
        pQue.enqueue({i:i-1, j:j},  this.getHeuristicDistance(i-1,j));
    }
    if(j+1 < this.grid[0].length && (( (!this.grid[i][j+1].preVisited || this.grid[i][j+1].preVisited && this.grid[i][j+1].distFromSource > this.grid[i][j].distFromSource + 1 ) && !this.grid[i][j+1].isWall) || this.grid[i][j+1].isDestination)){
        this.grid[i][j+1].distFromSource = Math.min(this.grid[i][j+1].distFromSource, this.grid[i][j].distFromSource+1);
        this.grid[i][j+1].preVisited = true;
        this.cellsExplored++;
        document.getElementById('cellsExplored').innerHTML = this.cellsExplored;
        pQue.enqueue({i: i, j:j+1}, this.getHeuristicDistance(i,j+1));
    } 
    if(i+1 < this.grid.length && (( (!this.grid[i+1][j].preVisited || this.grid[i+1][j].preVisited && this.grid[i+1][j].distFromSource > this.grid[i][j].distFromSource + 1 ) && !this.grid[i+1][j].isWall) || this.grid[i+1][j].isDestination)){
        this.grid[i+1][j].distFromSource = Math.min(this.grid[i+1][j].distFromSource, this.grid[i][j].distFromSource+1);
        this.grid[i+1][j].preVisited = true;
        this.cellsExplored++;
        document.getElementById('cellsExplored').innerHTML = this.cellsExplored;
        pQue.enqueue({i: i+1, j:j}, this.getHeuristicDistance(i+1,j));
    }
    if(j-1 >=0 && (( (!this.grid[i][j-1].preVisited || this.grid[i][j-1].preVisited && this.grid[i][j-1].distFromSource > this.grid[i][j].distFromSource + 1 ) && !this.grid[i][j-1].isWall) || this.grid[i][j-1].isDestination)){
        this.grid[i][j-1].distFromSource = Math.min(this.grid[i][j-1].distFromSource, this.grid[i][j].distFromSource+1);
        this.grid[i][j-1].preVisited = true;
        this.cellsExplored++;
        document.getElementById('cellsExplored').innerHTML = this.cellsExplored;
        pQue.enqueue({i: i, j: j-1}, this.getHeuristicDistance(i,j-1));
    }

    if(!instantFlag){
        this.timeouts.push(setTimeout(async () => {
            recursiveAStar(pQue, instantFlag);
        }, this.speed));
    }
    else recursiveAStar(pQue, instantFlag);
}

async function greedy(instantFlag = false){
    this.algoInProgress = false;
    this.pathLength = 0;
    this.cellsExplored = 0;
    document.getElementById('pathLength').innerHTML = this.pathLength;
    document.getElementById('cellsExplored').innerHTML = this.cellsExplored;
    this.clearTimeouts();
    for(let i=0; i<this.grid.length;i++){
        for(let j=0;j<this.grid[0].length;j++){
            this.grid[i][j].preVisited = false;
            this.grid[i][j].visited = false;
            this.grid[i][j].isPath = false;
            this.grid[i][j].distFromSource = 99999;
            this.grid[i][j].preDijk = false;
            this.grid[i][j].dijk = false;
            this.grid[i][j].distFromDestination = 99999;
        }
    }
    let pQue = new PriorityQueue();
    this.grid[this.sourcePos.i][this.sourcePos.j].preVisited = true;
    this.grid[this.sourcePos.i][this.sourcePos.j].visited = true;
    this.grid[this.sourcePos.i][this.sourcePos.j].distFromSource = 0;
    pQue.enqueue(this.sourcePos, this.getDistanceFromDestination(this.sourcePos.i,this.sourcePos.j));
    this.recursiveGreedy(pQue, instantFlag);
}

async function recursiveGreedy(pQue, instantFlag){
    if(pQue.isEmpty()){
        this.algoInProgress = true;
        return;
    }
    let i = pQue.front().element.i;
    let j = pQue.front().element.j;
    pQue.dequeue();

    if(grid[i][j].isDestination){
        this.tracePath(instantFlag);
        return;
    }

    this.grid[i][j].visited = true;
    await new Promise((resolve) => {
        if(!instantFlag){
            this.timeouts.push(setTimeout(async () => {
                this.recursiveGreedyUtil(i,j,pQue, instantFlag);
                resolve();
            }, this.speed));
        }
        else recursiveGreedyUtil(i,j,pQue,instantFlag);
        
    });
}

function getDistanceFromDestination(i,j){
    let x =  Math.abs(this.destinationPos.i - i) + Math.abs(this.destinationPos.j - j);
    return x;
}

async function recursiveGreedyUtil(i,j, pQue, instantFlag){
    if(i-1 >=0 && ((!this.grid[i-1][j].preVisited && !this.grid[i-1][j].isWall) || this.grid[i-1][j].isDestination)){
        this.grid[i-1][j].distFromSource = Math.min(this.grid[i-1][j].distFromSource, this.grid[i][j].distFromSource+1);
        this.grid[i-1][j].preVisited = true;
        this.cellsExplored++;
        document.getElementById('cellsExplored').innerHTML = this.cellsExplored;
        pQue.enqueue({i:i-1, j:j}, this.getDistanceFromDestination(i-1,j));
    }
    if(j+1 < this.grid[0].length && ((!this.grid[i][j+1].preVisited && !this.grid[i][j+1].isWall) || this.grid[i][j+1].isDestination)){
        this.grid[i][j+1].distFromSource = Math.min(this.grid[i][j+1].distFromSource, this.grid[i][j].distFromSource+1);
        this.grid[i][j+1].preVisited = true;
        this.cellsExplored++;
        document.getElementById('cellsExplored').innerHTML = this.cellsExplored;
        pQue.enqueue({i: i, j:j+1}, this.getDistanceFromDestination(i,j+1));
    } 
    if(i+1 < this.grid.length && ((!this.grid[i+1][j].preVisited && !this.grid[i+1][j].isWall) || this.grid[i+1][j].isDestination)){
        this.grid[i+1][j].distFromSource = Math.min(this.grid[i+1][j].distFromSource, this.grid[i][j].distFromSource+1);
        this.grid[i+1][j].preVisited = true;
        this.cellsExplored++;
        document.getElementById('cellsExplored').innerHTML = this.cellsExplored;
        pQue.enqueue({i: i+1, j:j}, this.getDistanceFromDestination(i+1,j));
    }
    if(j-1 >=0 && ((!this.grid[i][j-1].preVisited && !this.grid[i][j-1].isWall) || this.grid[i][j-1].isDestination)){
        this.grid[i][j-1].distFromSource = Math.min(this.grid[i][j-1].distFromSource, this.grid[i][j].distFromSource+1);
        this.grid[i][j-1].preVisited = true;
        this.cellsExplored++;
        document.getElementById('cellsExplored').innerHTML = this.cellsExplored;
        pQue.enqueue({i: i, j: j-1}, this.getDistanceFromDestination(i,j-1));
    }
    if(!instantFlag){
        this.timeouts.push(setTimeout(async () => {
            recursiveGreedy(pQue, instantFlag);
        }, this.speed));
    }
    else recursiveGreedy(pQue, instantFlag);
    

}

async function recursiveDFS(i,j, dist,instantFlag){
    let x = await new Promise((resolve) => {
        if(grid[i][j].isDestination){
            this.tracePath(instantFlag);
            return false;
        }
        this.grid[i][j].visited = true;
        this.cellsExplored++;
        document.getElementById('cellsExplored').innerHTML = this.cellsExplored;
        if(!instantFlag){
            this.timeouts.push(setTimeout(async () => {
                this.recursiveDFSUtil(i,j,dist,instantFlag).then((val)=>{
                    resolve();
                    if(val) return true;
                })
            }, this.speed));
        }
        else{
            this.recursiveDFSUtil(i,j,dist,instantFlag).then((val)=>{
                resolve();
                if(val) return true;
            })
        }
    }).then(()=>{
        this.algoInProgress = true;
    })
}


async function recursiveDFSUtil(i,j,dist,instantFlag){
    if( (i-1 >=0 && ((!this.grid[i-1][j].preVisited && !this.grid[i-1][j].isWall) || this.grid[i-1][j].isDestination))){
        this.grid[i-1][j].distFromSource = dist+1;
        this.grid[i-1][j].preVisited = true;
        await new Promise(async (resolve) => { 
            if(!instantFlag){
                this.timeouts.push(setTimeout(async () => {
                    await recursiveDFS(i-1,j, dist+1, instantFlag).then(()=>{
                        resolve();
                    })
                }, this.speed));
            }
            else{
                await recursiveDFS(i-1,j, dist+1, instantFlag).then(()=>{
                    resolve();
                })
            } 
        });
    }
    if(j+1 < this.grid[0].length && ((!this.grid[i][j+1].preVisited && !this.grid[i][j+1].isWall) || this.grid[i][j+1].isDestination)){

        this.grid[i][j+1].distFromSource = dist+1;
        this.grid[i][j+1].preVisited = true;
        await new Promise(async (resolve) => { 
            if(!instantFlag){
                this.timeouts.push(setTimeout(async () => {
                    await recursiveDFS(i,j+1, dist+1, instantFlag).then(()=>{
                        resolve();
                    })
                }, this.speed));
            }
            else{ 
                await recursiveDFS(i,j+1, dist+1, instantFlag).then(()=>{
                    resolve();
                })
            }
        });
    } 
    if(i+1 < this.grid.length && ((!this.grid[i+1][j].preVisited && !this.grid[i+1][j].isWall) || this.grid[i+1][j].isDestination)){
        this.grid[i+1][j].distFromSource = dist+1;
        this.grid[i+1][j].preVisited = true;
        await new Promise(async (resolve) => { 
            if(!instantFlag){
                this.timeouts.push(setTimeout(async () => {
                    await recursiveDFS(i+1,j, dist+1, instantFlag).then(()=>{
                        resolve();
                    })
                }, this.speed));
            }
            else{
                await recursiveDFS(i+1,j, dist+1, instantFlag).then(()=>{
                    resolve();
                })
            } 
        });
    }
    if(j-1 >=0 && ((!this.grid[i][j-1].preVisited && !this.grid[i][j-1].isWall) || this.grid[i][j-1].isDestination)){

        this.grid[i][j-1].distFromSource = dist+1;
        this.grid[i][j-1].preVisited = true;
        await new Promise(async (resolve) => { 
            if(!instantFlag){
                this.timeouts.push(setTimeout(async () => {
                    await recursiveDFS(i,j-1, dist+1, instantFlag).then(()=>{
                        resolve();
                    })
                }, this.speed));
            }
            else{
                await recursiveDFS(i,j-1, dist+1, instantFlag).then(()=>{
                    resolve();
                })
            } 
        });
    }
    return false;
}


async function dijk(instantFlag = false){
    this.algoInProgress = false;
    this.pathLength = 0;
    this.cellsExplored = 0;
    document.getElementById('pathLength').innerHTML = this.pathLength;
    document.getElementById('cellsExplored').innerHTML = this.cellsExplored;
    this.clearTimeouts();
    for(let i=0; i<this.grid.length;i++){
        for(let j=0;j<this.grid[0].length;j++){
            this.grid[i][j].preVisited = false;
            this.grid[i][j].visited = false;
            this.grid[i][j].isPath = false;
            this.grid[i][j].distFromSource = 99999;
            this.grid[i][j].preDijk = false;
            this.grid[i][j].dijk = false;
            this.grid[i][j].distFromDestination = 99999;
        }
    }
    let que = new Queue();
    this.grid[this.sourcePos.i][this.sourcePos.j].preVisited = true;
    this.grid[this.sourcePos.i][this.sourcePos.j].visited = true;
    this.grid[this.sourcePos.i][this.sourcePos.j].distFromSource = 0;
    que.enqueue(this.sourcePos);
    this.recursiveDijk(que, instantFlag);
}

async function recursiveDijk(que, instantFlag){
    if(que.isEmpty){
        this.algoInProgress = true;
        return;
    }
    let i = que.peek().i;
    let j = que.peek().j;
    if(grid[i][j].isDestination){
        this.tracePath(instantFlag);
        return false;
    }
    this.grid[i][j].visited = true;
    await new Promise((resolve) => {
        if(!instantFlag){
            this.timeouts.push(setTimeout(async () => {
                resolve();
                this.recursiveDijkUtil(i,j,que, instantFlag);
            }, this.speed));
        }
        else recursiveDijkUtil(i,j,que,instantFlag);
        
    });
}

async function recursiveDijkUtil(i,j,que, instantFlag){
    if( (i-1 >=0 && ((!this.grid[i-1][j].preVisited && !this.grid[i-1][j].isWall) || this.grid[i-1][j].isDestination))){
        this.grid[i-1][j].distFromSource = this.grid[i][j].distFromSource+1;
        this.grid[i-1][j].preVisited = true;
        this.cellsExplored++;
        document.getElementById('cellsExplored').innerHTML = this.cellsExplored;
        que.enqueue({i: i-1, j:j});
    }
    if(j+1 < this.grid[0].length && ((!this.grid[i][j+1].preVisited && !this.grid[i][j+1].isWall) || this.grid[i][j+1].isDestination)){
        this.grid[i][j+1].distFromSource = this.grid[i][j].distFromSource+1;
        this.grid[i][j+1].preVisited = true;
        this.cellsExplored++;
        document.getElementById('cellsExplored').innerHTML = this.cellsExplored;
        que.enqueue({i: i, j: j+1});
    } 
    if(i+1 < this.grid.length && ((!this.grid[i+1][j].preVisited && !this.grid[i+1][j].isWall) || this.grid[i+1][j].isDestination)){
        this.grid[i+1][j].distFromSource = this.grid[i][j].distFromSource+1;
        this.grid[i+1][j].preVisited = true;
        this.cellsExplored++;
        document.getElementById('cellsExplored').innerHTML = this.cellsExplored;
        que.enqueue({i: i+1, j:j});
    }
    if(j-1 >=0 && ((!this.grid[i][j-1].preVisited && !this.grid[i][j-1].isWall) || this.grid[i][j-1].isDestination)){
        this.grid[i][j-1].distFromSource = this.grid[i][j].distFromSource+1;
        this.grid[i][j-1].preVisited = true;
        this.cellsExplored++;
        document.getElementById('cellsExplored').innerHTML = this.cellsExplored;
        que.enqueue({i: i, j:j-1});
    }
    que.dequeue();
    recursiveDijk(que, instantFlag);
}




async function biDijk(instantFlag = false){
    this.algoInProgress = false;
    this.pathLength = 0;
    this.cellsExplored = 0;
    document.getElementById('pathLength').innerHTML = this.pathLength;
    document.getElementById('cellsExplored').innerHTML = this.cellsExplored;
    this.clearTimeouts();
    for(let i=0; i<this.grid.length;i++){
        for(let j=0;j<this.grid[0].length;j++){
            this.grid[i][j].preVisited = false;
            this.grid[i][j].visited = false;

            this.grid[i][j].preDijk = false;
            this.grid[i][j].dijk = false;

            this.grid[i][j].isPath = false;
            this.grid[i][j].distFromSource = 99999;
            this.grid[i][j].distFromDestination = 99999;
        }
    }
    let que = new Queue();
    this.grid[this.sourcePos.i][this.sourcePos.j].preVisited = true;
    this.grid[this.sourcePos.i][this.sourcePos.j].visited = true;
    this.grid[this.sourcePos.i][this.sourcePos.j].distFromSource = 0;
    que.enqueue(this.sourcePos);

    let destinationQue = new Queue();
    this.grid[this.destinationPos.i][this.destinationPos.j].preDijk = true;
    this.grid[this.destinationPos.i][this.destinationPos.j].dijk = true;
    this.grid[this.destinationPos.i][this.destinationPos.j].distFromDestination = 0;
    destinationQue.enqueue(this.destinationPos);

    this.recursiveBiDijk(que, destinationQue, instantFlag);
}

async function recursiveBiDijk(que, destinationQue, instantFlag){
    if(que.isEmpty && destinationQue.isEmpty){
        this.algoInProgress = true;
        return;
    }
    if(!que.isEmpty){
        let i = que.peek().i;
        let j = que.peek().j;
        if(grid[i][j].isDestination || grid[i][j].preDijk){
            this.tracePathBiDijk(i,j,instantFlag);
            return false;
        }
        this.grid[i][j].visited = true;
    }
    if(!destinationQue.isEmpty){
        let i1 = destinationQue.peek().i;
        let j1 = destinationQue.peek().j;
        if(grid[i1][j1].isSource || grid[i1][j1].preVisited){
            this.tracePathBiDijk(i1,j1,instantFlag);
            return false;
        }
        this.grid[i1][j1].dijk = true;
    }
    
    await new Promise((resolve) => {

        let i = !que.isEmpty? que.peek().i : -200;
        let j = !que.isEmpty? que.peek().j : -200;
        let i1 = !destinationQue.isEmpty? destinationQue.peek().i : -200;
        let j1 = !destinationQue.isEmpty? destinationQue.peek().j : -200;

        if(!instantFlag){
            this.timeouts.push(setTimeout(async () => {
                resolve();
                this.recursiveBiDijkUtil(i,j,i1,j1,que,destinationQue,instantFlag);
            }, this.speed));
        }
        else recursiveBiDijkUtil(i,j,i1,j1,que,destinationQue,instantFlag);
        
    });
}

async function recursiveBiDijkUtil(i,j,i1,j1,que,destinationQue,instantFlag){
    if(!(i == -200 && j == -200)){
        if( (i-1 >=0 && ((!this.grid[i-1][j].preVisited && !this.grid[i-1][j].isWall) || this.grid[i-1][j].isDestination))){
            this.grid[i-1][j].distFromSource = this.grid[i][j].distFromSource+1;
            this.grid[i-1][j].preVisited = true;
            this.cellsExplored++;
            document.getElementById('cellsExplored').innerHTML = this.cellsExplored;
            que.enqueue({i: i-1, j:j});
        }
        if(j+1 < this.grid[0].length && ((!this.grid[i][j+1].preVisited && !this.grid[i][j+1].isWall) || this.grid[i][j+1].isDestination)){
            this.grid[i][j+1].distFromSource = this.grid[i][j].distFromSource+1;
            this.grid[i][j+1].preVisited = true;
            this.cellsExplored++;
            document.getElementById('cellsExplored').innerHTML = this.cellsExplored;
            que.enqueue({i: i, j: j+1});
        } 
        if(i+1 < this.grid.length && ((!this.grid[i+1][j].preVisited && !this.grid[i+1][j].isWall) || this.grid[i+1][j].isDestination)){
            this.grid[i+1][j].distFromSource = this.grid[i][j].distFromSource+1;
            this.grid[i+1][j].preVisited = true;
            this.cellsExplored++;
            document.getElementById('cellsExplored').innerHTML = this.cellsExplored;
            que.enqueue({i: i+1, j:j});
        }
        if(j-1 >=0 && ((!this.grid[i][j-1].preVisited && !this.grid[i][j-1].isWall) || this.grid[i][j-1].isDestination)){
            this.grid[i][j-1].distFromSource = this.grid[i][j].distFromSource+1;
            this.grid[i][j-1].preVisited = true;
            this.cellsExplored++;
            document.getElementById('cellsExplored').innerHTML = this.cellsExplored;
            que.enqueue({i: i, j:j-1});
        }
        que.dequeue();
    }

    if(!(i1 == -200 && j1 == -200)){

        if( (i1-1 >=0 && ((!this.grid[i1-1][j1].preDijk && !this.grid[i1-1][j1].isWall) || this.grid[i1-1][j1].isSource))){
            this.grid[i1-1][j1].distFromDestination = this.grid[i1][j1].distFromDestination+1;
            this.grid[i1-1][j1].preDijk = true;
            this.cellsExplored++;
            document.getElementById('cellsExplored').innerHTML = this.cellsExplored;
            destinationQue.enqueue({i: i1-1, j:j1});
        }
        if(j1+1 < this.grid[0].length && ((!this.grid[i1][j1+1].preDijk && !this.grid[i1][j1+1].isWall) || this.grid[i1][j1+1].isSource)){
            this.grid[i1][j1+1].distFromDestination = this.grid[i1][j1].distFromDestination+1;
            this.grid[i1][j1+1].preDijk = true;
            this.cellsExplored++;
            document.getElementById('cellsExplored').innerHTML = this.cellsExplored;
            destinationQue.enqueue({i: i1, j: j1+1});
        } 
        if(i1+1 < this.grid.length && ((!this.grid[i1+1][j1].preDijk && !this.grid[i1+1][j1].isWall) || this.grid[i1+1][j1].isSource)){
            this.grid[i1+1][j1].distFromDestination = this.grid[i1][j1].distFromDestination+1;
            this.grid[i1+1][j1].preDijk = true;
            this.cellsExplored++;
            document.getElementById('cellsExplored').innerHTML = this.cellsExplored;
            destinationQue.enqueue({i: i1+1, j:j1});
        }
        if(j1-1 >=0 && ((!this.grid[i1][j1-1].preDijk && !this.grid[i1][j1-1].isWall) || this.grid[i1][j1-1].isSource)){
            this.grid[i1][j1-1].distFromDestination = this.grid[i1][j1].distFromDestination+1;
            this.grid[i1][j1-1].preDijk = true;
            this.cellsExplored++;
            document.getElementById('cellsExplored').innerHTML = this.cellsExplored;
            destinationQue.enqueue({i: i1, j:j1-1});
        }
        destinationQue.dequeue();
    }


    recursiveBiDijk(que, destinationQue, instantFlag);
}



async function tracePathBiDijk(i,j,instantFlag){

    this.clearTimeouts();
    let currI = i;
    let currJ = j;

    let currI2 = i;
    let currJ2 = j;

    let currI3 = i;
    let currJ3 = j;

    let k = this.grid[currI][currJ].distFromSource;
    let k2 = this.grid[currI2][currJ2].distFromDestination;
    let path = [];
    let path2 = [];

    while(k > 1){
        if(currI-1 >=0 && this.grid[currI-1][currJ].distFromSource == k-1) currI = currI-1;
        else if(currJ-1 >=0 && this.grid[currI][currJ-1].distFromSource == k-1)  currJ = currJ-1;
        else if(currI+1 < this.grid.length && this.grid[currI+1][currJ].distFromSource == k-1) currI = currI+1;
        else if(currJ+1 < this.grid[0].length && this.grid[currI][currJ+1].distFromSource == k-1) currJ = currJ+1;
        path.push({i:currI, j:currJ});
        k = k-1;
    }
    while(k2 > 1){
        if(currI2-1 >=0 && this.grid[currI2-1][currJ2].distFromDestination == k2-1) currI2 = currI2-1;
        else if(currJ2-1 >=0 && this.grid[currI2][currJ2-1].distFromDestination == k2-1)  currJ2 = currJ2-1;
        else if(currI2+1 < this.grid.length && this.grid[currI2+1][currJ2].distFromDestination == k2-1) currI2 = currI2+1;
        else if(currJ2+1 < this.grid[0].length && this.grid[currI2][currJ2+1].distFromDestination == k2-1) currJ2 = currJ2+1;
        path2.push({i:currI2, j:currJ2});
        k2 = k2-1;
    }
    path2 = path2.reverse();
    path2.push({i:currI3, j:currJ3});
    path2 = path2.concat(path);
    for(let x = path2.length-1; x>=0; x--){
        if(!instantFlag){
            await new Promise((resolve) => {
                this.timeouts.push(setTimeout(() => {
                  this.grid[path2[x].i][path2[x].j].isPath = true;
                  this.pathLength++;
                  document.getElementById('pathLength').innerHTML = this.pathLength; 
                  resolve();
                }, this.speed*3));
            });
        }
        else{
            this.grid[path2[x].i][path2[x].j].isPath = true;
            this.pathLength++;
            document.getElementById('pathLength').innerHTML = this.pathLength; 
        }
    }

    this.algoInProgress = true;
}



async function tracePath(instantFlag){

    this.clearTimeouts();
    let currI = this.destinationPos.i;
    let currJ = this.destinationPos.j;
    let k = this.grid[currI][currJ].distFromSource;
    let path = [];
    while(k > 1){
        if(currI-1 >=0 && this.grid[currI-1][currJ].distFromSource == k-1) currI = currI-1;
        else if(currJ-1 >=0 && this.grid[currI][currJ-1].distFromSource == k-1)  currJ = currJ-1;
        else if(currI+1 < this.grid.length && this.grid[currI+1][currJ].distFromSource == k-1) currI = currI+1;
        else if(currJ+1 < this.grid[0].length && this.grid[currI][currJ+1].distFromSource == k-1) currJ = currJ+1;
        path.push({i:currI, j:currJ});
        k = k-1;
    }
    for(let x = path.length-1; x>=0; x--){
        if(!instantFlag){
            await new Promise((resolve) => {
                this.timeouts.push(setTimeout(() => {
                  this.grid[path[x].i][path[x].j].isPath = true;
                  this.pathLength++;
                  document.getElementById('pathLength').innerHTML = this.pathLength; 
                  resolve();
                }, this.speed*3));
            });
        }
        else{
            this.grid[path[x].i][path[x].j].isPath = true;
            this.pathLength++;
            document.getElementById('pathLength').innerHTML = this.pathLength; 
        }
    }

    this.algoInProgress = true;
}

async function recursiveDivisionMaze(){
    await this.clearBoard();
    let iMax = this.grid.length, jMax = this.grid[0].length;
    this.recursivelyDivide(0, 0, iMax, jMax);
}

async function randomMaze(){
    await this.clearBoard();
    for(let i=0; i<this.grid.length; i++){
        for(let j=0; j< this.grid[i].length; j++){
            if(Math.random() <= 0.35){
                await new Promise((resolve) => {
                    this.timeouts.push(setTimeout(() => {
                      this.grid[i][j].isWall = true;
                      resolve();
                    }, this.speed));
                });
            }
        }
    }
}

function recursivelyDivide(iMin, jMin, iMax, jMax) {
    let flag = (iMax-iMin > jMax - jMin)? true: false;
    return new Promise((resolve) => {
      if (flag) {
        if (iMax - iMin < 4) { resolve(); return; }
        else{
            let iHalf = iMin + 1 + Math.floor(Math.random() * (iMax - iMin - 2));
            let counter = 0;
            while(this.grid?.[iHalf]?.[jMin-1]?.isWall === false || this.grid?.[iHalf]?.[jMax]?.isWall === false){
                if(iHalf == iMin + 1 + Math.floor(Math.random() * (iMax - iMin - 2))) counter++;
                if(counter == 3) break; 
                iHalf = iMin + 1 + Math.floor(Math.random() * (iMax - iMin - 2));
            } 
            
            let rand = jMin + Math.floor(Math.random() * (jMax - jMin));
            let timeoutIndex = 0;
            for (let k = jMin; k < jMax && k < this.grid[0].length; k++) {
                if (k !== rand) {
                    this.timeouts.push(setTimeout(() => { this.grid[iHalf][k].isWall = true; }, timeoutIndex * this.speed));
                    timeoutIndex++;
                }
            }
    
            this.timeouts.push(setTimeout(() => {
                recursivelyDivide(iMin, jMin, iHalf, jMax).then(() => { return recursivelyDivide(iHalf + 1, jMin, iMax, jMax);}).then(resolve);
            }, timeoutIndex * (this.speed)));

        }
        
      } 
      else {
        if (jMax - jMin < 4) { resolve(); return; }
        else{
            let jHalf = jMin + 1 + Math.floor(Math.random() * (jMax - jMin - 2));

            let counter = 0;
            while(this.grid?.[iMin-1]?.[jHalf]?.isWall === false || this.grid?.[iMax]?.[jHalf]?.isWall === false){
                if(jHalf == jMin + 1 + Math.floor(Math.random() * (jMax - jMin - 2))) counter++;
                if(counter == 3) break;
                jHalf = jMin + 1 + Math.floor(Math.random() * (jMax - jMin - 2));
            } 
    
            let rand = iMin + Math.floor(Math.random() * (iMax - iMin));
            let timeoutIndex = 0;
            for (let k = iMin; k < iMax && k < this.grid.length; k++) {
                if (k !== rand) {
                    this.timeouts.push(setTimeout(() => { this.grid[k][jHalf].isWall = true; }, timeoutIndex * this.speed));
                    timeoutIndex++;
                }
            }
      
            this.timeouts.push(setTimeout(() => { 
                recursivelyDivide(iMin, jMin, iMax, jHalf) .then(() => { return recursivelyDivide(iMin, jHalf + 1, iMax, jMax);}).then(resolve);
            }, timeoutIndex * (this.speed)));
        }
  
       
      }
    });
}

function visualize(){
    this.algoInProgress = false;
    switch(this.currAlgorithm){
        case 'Dijkstras': 
            this.dijk();
            break;
        case 'DFS':
            this.dfs();
            break;
        case 'A-star':
            this.aStar();
            break;
        case 'Greedy Best-First':
            this.greedy();
            break;
        case 'Bi-Directional Dijkstras':
            this.biDijk();
            break;
        default: 
            return;
    }
}

function windowResized() {
    this.canvasResized = false;
    resizeCanvas(window.innerWidth, window.innerHeight);
    this.setup();
}

function changeAction(action){
    this.currAction = action;
    document.getElementById('actionBtn').innerHTML = action;
}

function changeAlgorithm(algo){
    this.currAlgorithm = algo;
    document.getElementById('info').innerHTML = this.infos[this.currAlgorithm];
    document.getElementById('algorithmBtn').innerHTML = algo;
}

