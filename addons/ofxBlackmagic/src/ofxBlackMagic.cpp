#include "ofxBlackMagic.h"

#include "ColorConversion.h"

ofxBlackMagic::ofxBlackMagic()
:grayPixOld(true)
,colorPixOld(true)
,yuvTexOld(true)
,grayTexOld(true)
,colorTexOld(true) {
}

bool ofxBlackMagic::setup(int _deviceID, int width, int height, string framerate) {
	if(!controller.init()) {
		return false;
	}
    
    if(!controller.selectDevice(_deviceID)) {
        return false;
    }
    
    deviceID = _deviceID;
    
	vector<string> displayModes = controller.getDisplayModeNames();
	ofLogVerbose("ofxBlackMagic") << "Available display modes: " << ofToString(displayModes);
	BMDDisplayMode displayMode = bmdModeUnknown;
	if(width == 1920 && height == 1080 && framerate == "30") {
		displayMode = bmdModeHD1080p30;
	}else if(width == 1920 && height == 1080 && framerate == "60") {
		displayMode = bmdModeHD1080i6000;
	}else if(width == 1920 && height == 1080 && framerate == "59.94") {
		displayMode = bmdModeHD1080i5994;
	} else {
		ofLogError("ofxBlackMagic") << "ofxBlackMagic needs to be updated to support that mode.";
		return false;
	}
	if(!controller.startCaptureWithMode(displayMode)) {
		return false;
	}
	this->width = width, this->height = height;
	return true;
}

void ofxBlackMagic::close() {
	if(controller.isCapturing()) {
		controller.stopCapture();
	}
}

bool ofxBlackMagic::update() {
	if(controller.buffer.swapFront()) {
		grayPixOld = true, colorPixOld = true;
		yuvTexOld = true, grayTexOld = true, colorTexOld = true;
		return true;
	} else {
		return false;
	}
}

vector<unsigned char>& ofxBlackMagic::getYuvRaw() {
	return controller.buffer.getFront();
}

ofPixels& ofxBlackMagic::getGrayPixels() {
	if(grayPixOld) {
		grayPix.allocate(width, height, OF_IMAGE_GRAYSCALE);
		unsigned int n = width * height;
		cby0cry1_to_y(&(getYuvRaw()[0]), grayPix.getPixels(), n);
		grayPixOld = false;
	}
	return grayPix;
}

ofPixels& ofxBlackMagic::getColorPixels() {
	if(colorPixOld) {
		colorPix.allocate(width, height, OF_IMAGE_COLOR);
		unsigned int n = width * height;
		cby0cry1_to_rgb(&(getYuvRaw()[0]), colorPix.getPixels(), n);
		colorPixOld = false;
	}
	return colorPix;
}

ofTexture& ofxBlackMagic::getYuvTexture() {
	if(yuvTexOld) {
		yuvTex.loadData(&(getYuvRaw()[0]), width / 2, height, GL_RGBA);
		yuvTexOld = false;
	}
	return yuvTex;
}

ofTexture& ofxBlackMagic::getGrayTexture() {
	if(grayTexOld) {
		grayTex.loadData(getGrayPixels());
		grayTexOld = false;
	}
	return grayTex;
}

ofTexture& ofxBlackMagic::getColorTexture() {
	if(colorTexOld) {
		colorTex.loadData(getColorPixels());
		colorTexOld = false;
	}
	return colorTex;
}

void ofxBlackMagic::drawYuv(){
	getYuvTexture().draw(0, 0);
}

void ofxBlackMagic::drawGray() {
	getGrayTexture().draw(0, 0);
}

void ofxBlackMagic::drawColor() {
	getColorTexture().draw(0, 0);
}

int ofxBlackMagic::getWidth()
{
    return width;
}

int ofxBlackMagic::getHeight()
{
    return height;
}

int ofxBlackMagic::getConnectedDeviceNum()
{
    return controller.getDeviceCount();
}

string ofxBlackMagic::getDeviceName()
{
    
    string str = "NAN_ERROR";
    if(controller.getDeviceNameList().size() > deviceID)
    {
        str = controller.getDeviceNameList().at(deviceID);
    }
    
    return str;
}

string ofxBlackMagic::getDisplayModeName()
{
    
    string str = "NAN_ERROR";
    if(controller.getDisplayModeNames().size() > deviceID)
    {
        str = controller.getDisplayModeNames().at(deviceID);
    }
    
    return str;
}



