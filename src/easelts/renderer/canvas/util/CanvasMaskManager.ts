//var CanvasGraphics = require('./CanvasGraphics');

/**
 * A set of functions used to handle masking.
 *
 * @class
 * @memberof PIXI
 */
class CanvasMaskManager
{
	constructor(){}

	pushMask(maskData, renderer)
	{
		renderer.context.save();

		var cacheAlpha = maskData.alpha;
		var transform = maskData.worldTransform;
		var resolution = renderer.resolution;

		renderer.context.setTransform(
				transform.a * resolution,
				transform.b * resolution,
				transform.c * resolution,
				transform.d * resolution,
				transform.tx * resolution,
				transform.ty * resolution
		);

		//TODO suport sprite alpha masks??
		//lots of effort required. If demand is great enough..
		if(!maskData.texture)
		{
			// CanvasGraphics.renderGraphicsMask(maskData, renderer.context);
			renderer.context.clip();
		}

		maskData.worldAlpha = cacheAlpha;
	}

	/**
	 * Restores the current drawing context to the state it was before the mask was applied.
	 *
	 * @param renderer {PIXI.WebGLRenderer|PIXI.CanvasRenderer} The renderer context to use.
	 */
	public popMask(renderer)
	{
		renderer.context.restore();
	}

	destruct() {};
}

/**
 * This method adds it to the current stack of masks.
 *
 * @param maskData {object} the maskData that will be pushed
 * @param renderer {PIXI.WebGLRenderer|PIXI.CanvasRenderer} The renderer context to use.
 */
