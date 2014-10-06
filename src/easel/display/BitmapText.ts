/*
 * BitmapText
 * Visit http://createjs.com/ for documentation, updates and examples.
 *
 * Copyright (c) 2010 gskinner.com, inc.
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

class BitmapText extends Container
{

	// static properties:
	/**
	 * BitmapText uses Sprite instances to draw text. To reduce the creation and destruction of instances (and thus garbage collection), it maintains
	 * an internal object pool of sprite instances to reuse. Increasing this value can cause more sprites to be
	 * retained, slightly increasing memory use, but reducing instantiation.
	 * @property maxPoolSize
	 * @type Number
	 * @static
	 * @default 100
	 **/
	public static maxPoolSize = 100;

	/**
	 * Sprite object pool.
	 * @type {Array}
	 * @static
	 * @private
	 */
	public static _spritePool = [];

	// events:

	// public properties:
	/**
	 * The text to display.
	 * @property text
	 * @type String
	 * @default ""
	 **/
	public text = "";

	/**
	 * A SpriteSheet instance that defines the glyphs for this bitmap text. Each glyph/character
	 * should have a single frame animation defined in the sprite sheet named the same as
	 * corresponding character. For example, the following animation definition:
	 *
	 *        "A": {frames: [0]}
	 *
	 * would indicate that the frame at index 0 of the spritesheet should be drawn for the "A" character. The short form
	 * is also acceptable:
	 *
	 *        "A": 0
	 *
	 * Note that if a character in the text is not found in the sprite sheet, it will also
	 * try to use the alternate case (upper or lower).
	 *
	 * See SpriteSheet for more information on defining sprite sheet data.
	 * @property spriteSheet
	 * @type String
	 * @default null
	 **/
	public spriteSheet = null;

	/**
	 * The height of each line of text. If 0, then it will use a line height calculated
	 * by checking for the height of the "1", "T", or "L" character (in that order). If
	 * those characters are not defined, it will use the height of the first frame of the
	 * sprite sheet.
	 * @property lineHeight
	 * @type Number
	 * @default 0
	 **/
	public lineHeight = 0;

	/**
	 * This spacing (in pixels) will be added after each character in the output.
	 * @property letterSpacing
	 * @type Number
	 * @default 0
	 **/
	public letterSpacing = 0;

	/**
	 * If a space character is not defined in the sprite sheet, then empty pixels equal to
	 * spaceWidth will be inserted instead. If 0, then it will use a value calculated
	 * by checking for the width of the "1", "l", "E", or "A" character (in that order). If
	 * those characters are not defined, it will use the width of the first frame of the
	 * sprite sheet.
	 * @property spaceWidth
	 * @type Number
	 * @default 0
	 **/
	public spaceWidth = 0;

	/**
	 * @property _oldProps
	 * @type Object
	 * @protected
	 **/
	public _oldProps = null;


	/**
	 * Initialization method.
	 * @method initialize
	 * @param {String} [text=""] The text to display.
	 * @param {SpriteSheet} [spriteSheet=null] The spritesheet that defines the character glyphs.
	 * @protected
	 **/
		constructor(text, spriteSheet)
	{
		super();

		this.text = text;
		this.spriteSheet = spriteSheet;
		this._oldProps = {text: 0, spriteSheet: 0, lineHeight: 0, letterSpacing: 0, spaceWidth: 0};
	}

	/**
	 * Docced in superclass.
	 **/
	public draw(ctx, ignoreCache)
	{
		if(this.DisplayObject_draw(ctx, ignoreCache))
		{
			return;
		}
		this._updateText();
		super.draw(ctx, ignoreCache);
	}

	/**
	 * Docced in superclass.
	 **/
	public getBounds()
	{
		// getBounds is somewhat expensive 
		this._updateText();
		return super.getBounds();
	}

	/**
	 * Returns true or false indicating whether the display object would be visible if drawn to a canvas.
	 * This does not account for whether it would be visible within the boundaries of the stage.
	 * NOTE: This method is mainly for internal use, though it may be useful for advanced uses.
	 * @method isVisible
	 * @return {Boolean} Boolean indicating whether the display object would be visible if drawn to a canvas
	 **/
	public isVisible()
	{
		var hasContent = this.cacheCanvas || (this.spriteSheet && this.spriteSheet.complete && this.text);
		return !!(this.visible && this.alpha > 0 && this.scaleX != 0 && this.scaleY != 0 && hasContent);
	}

	/**
	 * @method _getFrameIndex
	 * @param {String} character
	 * @param {SpriteSheet} spriteSheet
	 * @return {Number}
	 * @protected
	 **/
	public _getFrameIndex(character, spriteSheet)
	{
		var c, o = spriteSheet.getAnimation(character);
		if(!o)
		{
			(character != (c = character.toUpperCase())) || (character != (c = character.toLowerCase())) || (c = null);
			if(c)
			{
				o = spriteSheet.getAnimation(c);
			}
		}
		return o && o.frames[0];
	}

	/**
	 * @method _getFrame
	 * @param {String} character
	 * @param {SpriteSheet} spriteSheet
	 * @return {Object}
	 * @protected
	 **/
	public _getFrame(character, spriteSheet)
	{
		var index = this._getFrameIndex(character, spriteSheet);
		return index == null ? index : spriteSheet.getFrame(index);
	}

	/**
	 * @method _getLineHeight
	 * @param {SpriteSheet} ss
	 * @return {Number}
	 * @protected
	 **/
	public _getLineHeight = function(ss)
	{
		var frame = this._getFrame("1", ss) || this._getFrame("T", ss) || this._getFrame("L", ss) || ss.getFrame(0);
		return frame ? frame.rect.height : 1;
	}

	/**
	 * @method _getSpaceWidth
	 * @param {SpriteSheet} ss
	 * @return {Number}
	 * @protected
	 **/
	public _getSpaceWidth(ss)
	{
		var frame = this._getFrame("1", ss) || this._getFrame("l", ss) || this._getFrame("e", ss) || this._getFrame("a", ss) || ss.getFrame(0);
		return frame ? frame.rect.width : 1;
	}

;

	/**
	 * @method _drawText
	 * @protected
	 **/
	public _updateText()
	{
		var x = 0, y = 0, o = this._oldProps, change = false, spaceW = this.spaceWidth, lineH = this.lineHeight, ss = this.spriteSheet;
		var pool = BitmapText._spritePool, kids = this.children, childIndex = 0, numKids = kids.length, sprite;

		for(var n in o)
		{
			if(o[n] != this[n])
			{
				o[n] = this[n];
				change = true;
			}
		}
		if(!change)
		{
			return;
		}

		var hasSpace = !!this._getFrame(" ", ss);
		if(!hasSpace && spaceW == 0)
		{
			spaceW = this._getSpaceWidth(ss);
		}
		if(lineH == 0)
		{
			lineH = this._getLineHeight(ss);
		}

		for(var i = 0, l = this.text.length; i < l; i++)
		{
			var character = this.text.charAt(i);
			if(character == " " && !hasSpace)
			{
				x += spaceW;
				continue;
			}
			else if(character == "\n" || character == "\r")
			{
				if(character == "\r" && this.text.charAt(i + 1) == "\n")
				{
					i++;
				} // crlf
				x = 0;
				y += lineH;
				continue;
			}

			var index = this._getFrameIndex(character, ss);
			if(index == null)
			{
				continue;
			}

			if(childIndex < numKids)
			{
				sprite = kids[childIndex];
			}
			else
			{
				sprite = this.addChild(pool.length ? pool.pop() : new createjs.Sprite());
				numKids++;
			}
			sprite.spriteSheet = ss;
			sprite.gotoAndStop(index);
			sprite.x = x;
			sprite.y = y;
			childIndex++;

			x += sprite.getBounds().width + this.letterSpacing;
		}
		while(numKids > childIndex)
		{
			pool.push(sprite = kids.pop());
			sprite.parent = null;
			numKids--;
		} // faster than removeChild.
		if(pool.length > BitmapText.maxPoolSize)
		{
			pool.length = BitmapText.maxPoolSize;
		}
	}

}

export = BitmapText;