/*
 * IDisplayType
 *
 * Permission is hereby granted, free of charge, to any person
 * obtaining a copy of this software and associated documentation
 * files (the "Software"), to deal in the Software without
 * restriction, including without limitation the rights to use,
 * copy, modify, merge, publish, distribute, sublicense, and/or sell
 * copies of the Software, and to permit persons to whom the
 * Software is furnished to do so, subject to the following
 * conditions:
 *
 * The above copyright notice and this permission notice shall be
 * included in all copies or substantial portions of the Software.
 *
 * THE SOFTWARE IS PROVIDED "AS IS", WITHOUT WARRANTY OF ANY KIND,
 * EXPRESS OR IMPLIED, INCLUDING BUT NOT LIMITED TO THE WARRANTIES
 * OF MERCHANTABILITY, FITNESS FOR A PARTICULAR PURPOSE AND
 * NONINFRINGEMENT. IN NO EVENT SHALL THE AUTHORS OR COPYRIGHT
 * HOLDERS BE LIABLE FOR ANY CLAIM, DAMAGES OR OTHER LIABILITY,
 * WHETHER IN AN ACTION OF CONTRACT, TORT OR OTHERWISE, ARISING
 * FROM, OUT OF OR IN CONNECTION WITH THE SOFTWARE OR THE USE OR
 * OTHER DEALINGS IN THE SOFTWARE.
 */

import DisplayType = require('../enum/DisplayType');
import IDisplayType = require("./IDisplayType");
import Stage = require("../display/Stage");
import Container = require("../display/Container");
import Rectangle = require("../geom/Rectangle");
import IRectangle = require("./IRectangle");
import m2 = require("../geom/Matrix2");
import Shape = require("../display/Shape");

interface IDisplayObject extends IDisplayType
{
	updateContext(ctx:CanvasRenderingContext2D);
	draw(ctx:CanvasRenderingContext2D, ignoreCache?:boolean);
	setStage(stage:Stage);
	isVisible():boolean;
	hasMouseEventListener():boolean;
	onResize(width:number, height:number):void;
	getBounds():Rectangle;
	getTransformedBounds(matrix:m2.Matrix2):Rectangle;
	getConcatenatedMatrix(matrix:m2.Matrix2):m2.Matrix2;
	destruct():void;

	mouseEnabled:boolean;
	mask:Shape;
	hitArea:IDisplayObject;
	parent:Container<IDisplayObject>;

	isDirty:boolean;
	visible:boolean;
	alpha:number;
	width:number;
	height:number;

	skewX:number;
	skewY:number;
	rotation:number;
	x:number;
	y:number;

	regX:number;
	regY:number;

	scaleX:number;
	scaleY:number;



}


export = IDisplayObject;