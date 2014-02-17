/* @pjs preload="indicator/images/below.jpg, indicator/images/ontop.png, indicator/images/data.png, indicator/images/timeslider.png"; */ 

PImage bimage;
PImage timage;
PImage dimage;
PImage dRimage;
PImage timeimage;
PImage timeRimage;

int drawApp = 1;

float timePercent;
int days;
int total = 365;

//CURRENTVALUES
int market;
int entrepreneur;
int catalysts;
int clusters;
int solutions;
int exports;
int reductions;

//MAXVALUES
int marketMax;
int entrepreneurMax;
int catalystsMax;
int clustersMax;
int solutionsMax;
int exportsMax;
int reductionsMax;

//STARTED
int marketStarted;
int entrepreneurStarted;
int catalystsStarted;
int clustersStarted;
int solutionsStarted;
int exportsStarted;
int reductionsStarted;


void setup() 
{
    noStroke();
    size(920, 350);
    textFont(createFont("Arial",32));
    bimage = loadImage("indicator/images/below.jpg");
    timage = loadImage("indicator/images/ontop.png");
    dimage = loadImage("indicator/images/data.png");
    timeimage = loadImage("indicator/images/timeslider.png");
    
    //LOAD DATA
    String lines[] = loadStrings("indicator/data.txt");
    for (int i = 1; i < lines.length(); ++i){
      loadData(lines[i]);
    }
    
    //SETUP TIMER
    if(daysLeft > 365)
    {
    	days = 0;
    }
    else{
    	days = 365 - daysLeft;
    }    
        
    timePercent = round((days/total)*100);
    
    //noLoop();
} 

void draw()
{
	if (drawApp = 1)
	{
    background(7,100,160);
    frameRate(1);
    tint(255);
    image(bimage, 0,0);
 
    //calculate the percentage of time left
    drawDataGraph("market", market,  marketMax, 1, 0, marketStarted);
    drawDataGraph("entrepreneurs", entrepreneur, entrepreneurMax,  2, 1, entrepreneurStarted);
    drawDataGraph("catalysts", catalysts, catalystsMax,  3, 3, catalystsStarted);
    drawDataGraph("clusters", clusters, clustersMax,  4, 3, clustersStarted);
    drawDataGraph("solutions", solutions, solutionsMax,  5, 10, solutionsStarted);
    drawDataGraph("export", exports, exportsMax,  6, 11, exportsStarted);
    drawDataGraph("reductions", reductions, reductionsMax,  7, 15, reductionsStarted);

    tint(255);
    drawTime(days, total);
    image(timage, 0,0);
    }
    drawApp = 0;
}

void drawDataGraph(String name,int value, int max, int pos, int offset, int started)
{
    int pixeloffset = 73;
    int spread = 8;
    int imageData = 0;
    int imagePercent = value / max;
    imagePercent = round(imagePercent * 100);
    int imageData = (int)map(imagePercent, 0 , 100, 220, 0);
    
  //SET COORDINATES
  pushMatrix();
  translate((123*pos)-pixeloffset-offset, 35+imageData);

  //LOAD DATA  
  dRimage = dimage.get(0,imageData, 90, 220-imageData);
  dRimage.updatePixels();
  
  //TINT DATA CORRECTLY
  if((imagePercent - timePercent) < (spread*-1))
  {
    tint(255,140,0); //TINT ORANGE
  }
  else if((imagePercent - timePercent) <= spread && (imagePercent - timePercent)  >= (spread*-1))
  {
   tint(230,210,0); //TINT GUL
  }
  else
  {
    tint(110,230,0); //TINT GREEN
  } 
  
  //DRAW DATA
  image(dRimage, 0 , 0);
  //ADD ELLIPSE TO FINISH OFF THE BAR
  if(imageData < 175 && imageData > 10)
  {
    fill(0,0,0,100);
    ellipse(45,2,80,8);
  }
  
  popMatrix();
  
  //DRAW TEXT
  //DRAW NUMBERS
  int textOffset = 27;
  textAlign(CENTER);
  textSize(16);
  fill(255,255,255,255);
  if (name == "reductions")
  {
    text(value +" k" + " / " + "\n" + max + " k", 123*pos-textOffset-offset, 67); 
  }
  else
  {
    text(value + " / " + max, 123*pos-textOffset-offset, 67); 
  }
  //DRAW PERCENTAGE
  textSize(14);
  text(imagePercent + "%", 123*pos+30-offset, 235); 
  
  //DRAW PROGRESS
  //TINT DATA CORRECTLY
  textSize(10);
  if (started == 0)
  {
    fill(230,210,0); //TINT GUL
    text("Not started", 123*pos+30-offset, 262); 
  }
  else if((imagePercent - timePercent) < (spread*-1))
  {
    fill(255,140,0); //TINT ORANGE
    text("Too slow", 123*pos+30-offset, 262); 
  }
  else if((imagePercent - timePercent) <= spread && (imagePercent - timePercent)  >= (spread*-1))
  {
   fill(230,210,0); //TINT GUL
   text("Ok", 123*pos+30-offset, 262); 
  }
  else
  {
    fill(110,230,0); //TINT GREEN
    text("Ahead", 123*pos+30-offset, 262); 
  } 
  
}

void drawTime(int days, int total)
{
  
  int imageData = 0;
  int imagePercent = days / total;
  imagePercent = round(imagePercent * 100);
  int imageData = (int)map(imagePercent, 0 , 100, 630, 0);
   
  //SET COORDINATES
  pushMatrix();
  translate(116, 278);
  
  //LOAD DATA  
  timeRimage = timeimage.get(0,0, 630-imageData, 65);
  timeRimage.updatePixels();
 
  
  //DRAW DATA
  image(timeRimage, 0 , 0);
  //ADD ELLIPSE TO FINISH OFF THE BAR
  if(imageData > 40 && imageData < 575)
  {
    fill(0,0,0,100);
    ellipse(630-imageData-3,33,8,50);
  }
  popMatrix();
  
  //DRAW TEXT
  textAlign(CENTER);
  textSize(16);
  if(days > 150){
    fill(7,100,165,120);
    rect(360,300,180,22);
     
  }
  fill(255,255,255,255);
  text((total - days) + " of " + total + " DAYS LEFT", 450, 317); 
  
  //DRAW PERCENTAGE
  textSize(14);
  fill(255,255,255,255);
  text(imagePercent + "%", 72, 330);
 
  //DRAW TIMELINE
  //CALCULATE PERCENTAGE TO DISTANCE
  int distance = round(map(imagePercent, 0, 100, 0, -220));
  
  //DRAW
  strokeWeight(1);
  stroke(255, 150);
  
  //SET COORDINATES
  pushMatrix();
  translate(116, 310);
  
  //DRAW LINES
  line(0,0,-100,0);
  noFill();
  ellipse(-100,0,7,7);
  translate(-100, -57+distance);
  line(0,0,0,57-distance);
  ellipse(0,0,7,7);
  
  //TIMELINE
  line(0,0,900,0);
  popMatrix();
  noStroke();
}

void loadData(String lines)
{
  String[] input = splitTokens(lines, "\t ");
  
  if (input[0].equals("market") == true){
    market = (int)input[1];
    marketMax = (int)input[2]; 
    marketStarted = (int)input[3];
  }
  else if (input[0].equals("entrepreneurs") == true){
    entrepreneur = (int)input[1];
    entrepreneurMax = (int)input[2]; 
    entrepreneurStarted = (int)input[3];
  }
  else if (input[0].equals("catalysts") == true){
    catalysts = (int)input[1];
    catalystsMax = (int)input[2]; 
    catalystsStarted = (int)input[3];
  }
  else if (input[0].equals("clusters") == true){
    clusters = (int)input[1];
    clustersMax = (int)input[2]; 
    clustersStarted = (int)input[3];
  }
  else if (input[0].equals("solutions") == true){
   solutions = (int)input[1];
   solutionsMax = (int)input[2]; 
   solutionsStarted = (int)input[3];
  }
  else if (input[0].equals("export") == true){
    exports = (int)input[1];
    exportsMax = (int)input[2];
    exportsStarted = (int)input[3]; 
  }
  else if (input[0].equals("reductions") == true){
    reductions = (int)input[1];
    reductionsMax = (int)input[2]; 
    reductionsStarted = (int)input[3];
  }
  else if ((input[0].equals("daysleft") == true) && ((int)input[1]) != -1 ){
    daysLeft = (int)input[1];

  }
}

