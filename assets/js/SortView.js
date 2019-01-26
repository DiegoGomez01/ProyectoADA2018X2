function ComparisonSort(am, w, h)
{
	this.init(am, w, h);
}
var thisGlobal;

var ARRAY_Y_POS = 250;
var ARRAY_LABEL_Y_POS = 260;

var BAR_FOREGROUND_COLOR = "#0000FF";
var BAR_BACKGROUND_COLOR ="#AAAAFF";
var INDEX_COLOR = "#0000FF";
var HIGHLIGHT_BAR_COLOR = "#FF0000";
var HIGHLIGHT_BAR_BACKGROUND_COLOR = "#FFAAAA";

ComparisonSort.prototype = new Algorithm();
ComparisonSort.prototype.constructor = ComparisonSort;
ComparisonSort.superclass = Algorithm.prototype;

ComparisonSort.prototype.init = function(am, w, h)
{
	var sc = ComparisonSort.superclass;
	var fn = sc.init;
	fn.call(this,am);
	this.nextIndex = 0;
	
	this.setArraySize(true);
	this.arrayData = new Array();

	this.createVisualObjects();

	thisGlobal = this;
}
	
ComparisonSort.prototype.setArraySize = function (small)
{
    this.array_size = 6;
    this.array_width = 20;
    this.array_bar_width = 10;
    this.array_initial_x = 15;
    this.array_y_pos = ARRAY_Y_POS;
    this.array_label_y_pos = ARRAY_LABEL_Y_POS;
}

ComparisonSort.prototype.randomizeArray = function()
{
    this.commands = new Array();
    this.arrayData=[50,38,20,18,70,56];
	for (var i = 0; i < this.array_size; i++)
	{
		this.oldData[i] = this.arrayData[i];
        this.cmd("SetText", this.barLabels[i], this.arrayData[i]);
		this.cmd("SetHeight", this.barObjects[i], this.arrayData[i]);				
    }
    
	this.animationManager.StartNewAnimation(this.commands);
	this.animationManager.skipForward();
	this.animationManager.clearHistory();
	
}


ComparisonSort.prototype.createVisualObjects = function()
{
	this.barObjects = new Array(this.array_size);
	this.oldBarObjects= new Array(this.array_size);
	this.oldbarLabels= new Array(this.array_size);
	
	this.barLabels = new Array(this.array_size);
	this.barPositionsX = new Array(this.array_size);			
	this.oldData = new Array(this.array_size);
	this.obscureObject  = new Array(this.array_size);
	
	
	var xPos = this.array_initial_x;
	var yPos = this.array_y_pos;
	var yLabelPos = this.array_label_y_pos;
	
	this.commands = new Array();
	for (var i = 0; i < this.array_size; i++)
	{
		xPos = xPos + this.array_width;
		this.barPositionsX[i] = xPos;
		this.cmd("CreateRectangle", this.nextIndex, "", this.array_bar_width, 200, xPos, yPos,"center","bottom");
		this.cmd("SetForegroundColor", this.nextIndex, BAR_FOREGROUND_COLOR);
		this.cmd("SetBackgroundColor", this.nextIndex, BAR_BACKGROUND_COLOR);
		this.barObjects[i] = this.nextIndex;
		this.oldBarObjects[i] = this.barObjects[i];
		this.nextIndex += 1;
        this.cmd("CreateLabel", this.nextIndex, "99", xPos, yLabelPos);
		this.cmd("SetForegroundColor", this.nextIndex, INDEX_COLOR);
		
		this.barLabels[i] = this.nextIndex;
		this.oldbarLabels[i] = this.barLabels[i];
		++this.nextIndex;				
	}
	this.animationManager.StartNewAnimation(this.commands);
	this.animationManager.skipForward();
	this.randomizeArray();
	for (i = 0; i < this.array_size; i++)
	{
		this.obscureObject[i] = false;
	}
	this.lastCreatedIndex = this.nextIndex;
}

function swap(index1, index2){
	thisGlobal.animationManager.clearHistory();
	var tmp = thisGlobal.arrayData[index1];
	thisGlobal.arrayData[index1] = thisGlobal.arrayData[index2];
	thisGlobal.arrayData[index2] = tmp;
	
	tmp = thisGlobal.barObjects[index1];
	thisGlobal.barObjects[index1] = thisGlobal.barObjects[index2];
	thisGlobal.barObjects[index2] = tmp;
	
	tmp = thisGlobal.barLabels[index1];
	thisGlobal.barLabels[index1] = thisGlobal.barLabels[index2];
	thisGlobal.barLabels[index2] = tmp;
	
	thisGlobal.cmd("Move", thisGlobal.barObjects[index1], thisGlobal.barPositionsX[index1], thisGlobal.array_y_pos);
	thisGlobal.cmd("Move", thisGlobal.barObjects[index2], thisGlobal.barPositionsX[index2], thisGlobal.array_y_pos);
	thisGlobal.cmd("Move", thisGlobal.barLabels[index1], thisGlobal.barPositionsX[index1], thisGlobal.array_label_y_pos);
	thisGlobal.cmd("Move", thisGlobal.barLabels[index2], thisGlobal.barPositionsX[index2], thisGlobal.array_label_y_pos);
	thisGlobal.cmd("Step");
	
	thisGlobal.animationManager.StartNewAnimation(thisGlobal.commands);
}

function testColorChange(barNumber){
    thisGlobal.animationManager.clearHistory();
    thisGlobal.commands = new Array();
    thisGlobal.cmd("SetBackgroundColor", thisGlobal.barObjects[barNumber], "#2df900");
    thisGlobal.cmd("SetBackgroundColor", thisGlobal.barObjects[barNumber], HIGHLIGHT_BAR_BACKGROUND_COLOR);
    thisGlobal.animationManager.StartNewAnimation(thisGlobal.commands);
}

function bubbleSortCallback(){
	thisGlobal.animationManager.clearHistory();
	thisGlobal.commands = new Array();
	
	for (var i = thisGlobal.array_size-1; i > 0; i--){
		for (var j = 0; j < i; j++){
			thisGlobal.cmd("SetForegroundColor", thisGlobal.barObjects[j], HIGHLIGHT_BAR_COLOR);
			thisGlobal.cmd("SetBackgroundColor", thisGlobal.barObjects[j], HIGHLIGHT_BAR_BACKGROUND_COLOR);

			thisGlobal.cmd("SetForegroundColor", thisGlobal.barObjects[j+1], HIGHLIGHT_BAR_COLOR);
			thisGlobal.cmd("SetBackgroundColor", thisGlobal.barObjects[j+1], HIGHLIGHT_BAR_BACKGROUND_COLOR);
			thisGlobal.cmd("Step");
			if (thisGlobal.arrayData[j] > thisGlobal.arrayData[j+1])
			{
				swap(j,j+1);
			}
			thisGlobal.cmd("SetForegroundColor", thisGlobal.barObjects[j], BAR_FOREGROUND_COLOR);
			thisGlobal.cmd("SetBackgroundColor", thisGlobal.barObjects[j], BAR_BACKGROUND_COLOR);

			thisGlobal.cmd("SetForegroundColor", thisGlobal.barObjects[j+1], BAR_FOREGROUND_COLOR);
			thisGlobal.cmd("SetBackgroundColor", thisGlobal.barObjects[j+1], BAR_BACKGROUND_COLOR);
		}
	}
	thisGlobal.animationManager.StartNewAnimation(thisGlobal.commands);
}

var currentAlg;

function init()
{
	var animManag = initCanvas();
	currentAlg = new ComparisonSort(animManag, canvas.width, canvas.height);
}