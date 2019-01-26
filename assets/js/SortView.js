function ComparisonSort(am, w, h)
{
	this.init(am, w, h);
}

var ARRAY_Y_POS = 250;
var ARRAY_LABEL_Y_POS = 260;

var LOWER_ARRAY_Y_POS = 500;
var LOWER_ARRAY_LABEL_Y_POS = 510;

var SCALE_FACTOR = 2.0;

var BAR_FOREGROUND_COLOR = "#0000FF";
var BAR_BACKGROUND_COLOR ="#AAAAFF";
var INDEX_COLOR = "#0000FF";
var HIGHLIGHT_BAR_COLOR = "#FF0000";
var HIGHLIGHT_BAR_BACKGROUND_COLOR = "#FFAAAA";

var QUICKSORT_LINE_COLOR = "#FF0000";

ComparisonSort.prototype = new Algorithm();
ComparisonSort.prototype.constructor = ComparisonSort;
ComparisonSort.superclass = Algorithm.prototype;

ComparisonSort.prototype.init = function(am, w, h)
{
	var sc = ComparisonSort.superclass;
	var fn = sc.init;
	fn.call(this,am);
	this.addControls();
	this.nextIndex = 0;
	
	this.setArraySize(true);
	this.arrayData = new Array();
	this.arraySwap = new Array();
	this.labelsSwap = new Array();
	this.objectsSwap = new Array();
	
	this.createVisualObjects();	
}



ComparisonSort.prototype.addControls =  function()
{
	this.resetButton = addControlToAlgorithmBar("Button", "Randomize Array");
    this.resetButton.onclick = this.resetCallback.bind(this);
    
    // var a = document.getElementById("testButton");
    var a = addControlToAlgorithmBar("button", "test");
    a.onclick = this.testColorChange.bind(this,2);

	this.bubbleSortButton = addControlToAlgorithmBar("Button", "Bubble Sort");
	this.bubbleSortButton.onclick = this.bubbleSortCallback.bind(this);
}

		
ComparisonSort.prototype.setArraySize = function (small)
{
    this.array_size = 6;
    this.array_width = 20;
    this.array_bar_width = 10;
    this.array_initial_x = 15;
    this.array_y_pos = ARRAY_Y_POS;
    this.array_label_y_pos = ARRAY_LABEL_Y_POS;
    this.showLabels = true;	
}


ComparisonSort.prototype.resetAll = function(small)
{
	this.animationManager.resetAll();
	this.setArraySize(!small);
	this.nextIndex = 0;
	this.createVisualObjects();
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


ComparisonSort.prototype.swap = function(index1, index2)
{
	var tmp = this.arrayData[index1];
	this.arrayData[index1] = this.arrayData[index2];
	this.arrayData[index2] = tmp;
	
	tmp = this.barObjects[index1];
	this.barObjects[index1] = this.barObjects[index2];
	this.barObjects[index2] = tmp;
	
	tmp = this.barLabels[index1];
	this.barLabels[index1] = this.barLabels[index2];
	this.barLabels[index2] = tmp;
	
	
	this.cmd("Move", this.barObjects[index1], this.barPositionsX[index1], this.array_y_pos);
	this.cmd("Move", this.barObjects[index2], this.barPositionsX[index2], this.array_y_pos);
	this.cmd("Move", this.barLabels[index1], this.barPositionsX[index1], this.array_label_y_pos);
	this.cmd("Move", this.barLabels[index2], this.barPositionsX[index2], this.array_label_y_pos);
	this.cmd("Step");
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



ComparisonSort.prototype.resetCallback = function(event)
{
	this.randomizeArray();
}

ComparisonSort.prototype.testColorChange = function(barNumber,event){
    this.animationManager.clearHistory();
    this.commands = new Array();
    // this.cmd("SetBackgroundColor", this.barObjects[barNumber], "#2df900");
    // this.cmd("SetBackgroundColor", this.barObjects[barNumber], HIGHLIGHT_BAR_BACKGROUND_COLOR);
    this.swap(2,3);
    this.animationManager.StartNewAnimation(this.commands);
}

ComparisonSort.prototype.bubbleSortCallback = function(event)
{
	this.animationManager.clearHistory();
	
    this.commands = new Array();
    console.log(this.barObjects);
	for (var i = this.array_size-1; i > 0; i--)
	{
		for (var j = 0; j < i; j++)
		{
			this.cmd("SetForegroundColor", this.barObjects[j], HIGHLIGHT_BAR_COLOR);
			this.cmd("SetBackgroundColor", this.barObjects[j], HIGHLIGHT_BAR_BACKGROUND_COLOR);

			this.cmd("SetForegroundColor", this.barObjects[j+1], HIGHLIGHT_BAR_COLOR);
			this.cmd("SetBackgroundColor", this.barObjects[j+1], HIGHLIGHT_BAR_BACKGROUND_COLOR);
			this.cmd("Step");
			if (this.arrayData[j] > this.arrayData[j+1])
			{
				this.swap(j,j+1);
			}
			this.cmd("SetForegroundColor", this.barObjects[j], BAR_FOREGROUND_COLOR);
			this.cmd("SetBackgroundColor", this.barObjects[j], BAR_BACKGROUND_COLOR);

			this.cmd("SetForegroundColor", this.barObjects[j+1], BAR_FOREGROUND_COLOR);
			this.cmd("SetBackgroundColor", this.barObjects[j+1], BAR_BACKGROUND_COLOR);

		}
	}
	this.animationManager.StartNewAnimation(this.commands);
}

var currentAlg;

function init()
{
	var animManag = initCanvas();
	currentAlg = new ComparisonSort(animManag, canvas.width, canvas.height);
}