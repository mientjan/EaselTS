var WebGLManager = require('./WebGLManager'), RenderTarget = require('../utils/RenderTarget'), Quad = require('../utils/Quad'), math = require('../../../math'), Shader = require('pixi-gl-core').GLShader, filterTransforms = require('../filters/filterTransforms'), bitTwiddle = require('bit-twiddle');
var FilterState = function () {
    this.renderTarget = null;
    this.sourceFrame = new math.Rectangle();
    this.destinationFrame = new math.Rectangle();
    this.filters = [];
    this.target = null;
    this.resolution = 1;
};
FilterManager.pool = {};
function FilterManager(renderer) {
    WebGLManager.call(this, renderer);
    this.gl = this.renderer.gl;
    this.quad = new Quad(this.gl, renderer.state.attribState);
    var rootState = new FilterState();
    rootState.sourceFrame = rootState.destinationFrame = this.renderer.rootRenderTarget.size;
    rootState.renderTarget = renderer.rootRenderTarget;
    this.stack = [rootState];
    this.stackIndex = 0;
    this.shaderCache = {};
}
FilterManager.prototype = Object.create(WebGLManager.prototype);
FilterManager.prototype.constructor = FilterManager;
module.exports = FilterManager;
FilterManager.prototype.pushFilter = function (target, filters) {
    var renderer = this.renderer;
    var currentState = this.stack[++this.stackIndex];
    if (!currentState) {
        currentState = this.stack[this.stackIndex] = new FilterState();
    }
    var resolution = filters[0].resolution;
    var padding = filters[0].padding;
    var targetBounds = target.filterArea || target.getBounds();
    var sourceFrame = currentState.sourceFrame;
    var destinationFrame = currentState.destinationFrame;
    sourceFrame.x = (((targetBounds.x + padding) * resolution) | 0) / resolution;
    sourceFrame.y = (((targetBounds.y + padding) * resolution) | 0) / resolution;
    sourceFrame.width = (((targetBounds.width + padding * 2) * resolution) | 0) / resolution;
    sourceFrame.height = (((targetBounds.height + padding * 2) * resolution) | 0) / resolution;
    sourceFrame.fit(this.stack[0].destinationFrame);
    destinationFrame.width = sourceFrame.width;
    destinationFrame.height = sourceFrame.height;
    var renderTarget = FilterManager.getPotRenderTarget(renderer.gl, sourceFrame.width, sourceFrame.height, resolution);
    currentState.target = target;
    currentState.filters = filters;
    currentState.resolution = resolution;
    currentState.renderTarget = renderTarget;
    renderTarget.setFrame(destinationFrame, sourceFrame);
    renderer.bindRenderTarget(renderTarget);
    renderer.clear();
};
FilterManager.prototype.popFilter = function () {
    var lastState = this.stack[this.stackIndex - 1];
    var currentState = this.stack[this.stackIndex];
    this.quad.map(currentState.renderTarget.size, currentState.sourceFrame).upload();
    var filters = currentState.filters;
    if (filters.length === 1) {
        filters[0].apply(this, currentState.renderTarget, lastState.renderTarget, false);
        FilterManager.freePotRenderTarget(currentState.renderTarget);
    }
    else {
        var flip = currentState.renderTarget;
        var flop = FilterManager.getPotRenderTarget(this.renderer.gl, currentState.sourceFrame.width, currentState.sourceFrame.height, 1);
        flop.setFrame(currentState.destinationFrame, currentState.sourceFrame);
        for (var i = 0; i < filters.length - 1; i++) {
            filters[i].apply(this, flip, flop, true);
            var t = flip;
            flip = flop;
            flop = t;
        }
        filters[i].apply(this, flip, lastState.renderTarget, false);
        FilterManager.freePotRenderTarget(flip);
        FilterManager.freePotRenderTarget(flop);
    }
    this.stackIndex--;
};
FilterManager.prototype.applyFilter = function (filter, input, output, clear) {
    var renderer = this.renderer;
    var shader = filter.glShaders[renderer.CONTEXT_UID];
    if (!shader) {
        if (filter.glShaderKey) {
            shader = this.shaderCache[filter.glShaderKey];
            if (!shader) {
                shader = filter.glShaders[renderer.CONTEXT_UID] = this.shaderCache[filter.glShaderKey] = new Shader(this.gl, filter.vertexSrc, filter.fragmentSrc);
            }
        }
        else {
            shader = filter.glShaders[renderer.CONTEXT_UID] = new Shader(this.gl, filter.vertexSrc, filter.fragmentSrc);
        }
        this.quad.initVao(shader);
    }
    renderer.bindRenderTarget(output);
    if (clear) {
        renderer.clear();
    }
    renderer.bindShader(shader);
    this.syncUniforms(shader, filter);
    input.texture.bind(0);
    this.quad.draw();
};
FilterManager.prototype.syncUniforms = function (shader, filter) {
    var uniformData = filter.uniformData;
    var uniforms = filter.uniforms;
    var textureCount = 1;
    if (shader.uniforms.data.filterArea) {
        var currentState = this.stack[this.stackIndex];
        var filterArea = shader.uniforms.filterArea;
        filterArea[0] = currentState.renderTarget.size.width;
        filterArea[1] = currentState.renderTarget.size.height;
        filterArea[2] = currentState.sourceFrame.x;
        filterArea[3] = currentState.sourceFrame.y;
        shader.uniforms.filterArea = filterArea;
    }
    var val;
    for (var i in uniformData) {
        if (uniformData[i].type === 'sampler2D') {
            shader.uniforms[i] = textureCount;
            this.renderer.bindTexture(uniforms[i].baseTexture, textureCount);
            textureCount++;
        }
        else if (uniformData[i].type === 'mat3') {
            if (uniforms[i].a) {
                shader.uniforms[i] = uniforms[i].toArray(true);
            }
            else {
                shader.uniforms[i] = uniforms[i];
            }
        }
        else if (uniformData[i].type === 'vec2') {
            if (uniforms[i].x) {
                val = shader.uniforms[i];
                val[0] = uniforms[i].x;
                val[1] = uniforms[i].y;
                shader.uniforms[i] = val;
            }
            else {
                shader.uniforms[i] = uniforms[i];
            }
        }
        else if (uniformData[i].type === 'float') {
            if (shader.uniforms.data[i].value !== uniformData[i]) {
                shader.uniforms[i] = uniforms[i];
            }
        }
        else {
            shader.uniforms[i] = uniforms[i];
        }
    }
};
FilterManager.prototype.getRenderTarget = function () {
    var currentState = this.stack[this.stackIndex];
    var renderTarget = FilterManager.getPotRenderTarget(this.renderer.gl, currentState.sourceFrame.width, currentState.sourceFrame.height, currentState.resolution);
    renderTarget.setFrame(currentState.destinationFrame, currentState.sourceFrame);
    return renderTarget;
};
FilterManager.prototype.returnRenderTarget = function (renderTarget) {
    return FilterManager.freePotRenderTarget(renderTarget);
};
FilterManager.prototype.calculateScreenSpaceMatrix = function (outputMatrix) {
    var currentState = this.stack[this.stackIndex];
    return filterTransforms.calculateScreenSpaceMatrix(outputMatrix, currentState.sourceFrame, currentState.renderTarget.size);
};
FilterManager.prototype.calculateNormalisedScreenSpaceMatrix = function (outputMatrix) {
    var currentState = this.stack[this.stackIndex];
    return filterTransforms.calculateNormalisedScreenSpaceMatrix(outputMatrix, currentState.sourceFrame, currentState.renderTarget.size, currentState.destinationFrame);
};
FilterManager.prototype.calculateSpriteMatrix = function (outputMatrix, sprite) {
    var currentState = this.stack[this.stackIndex];
    return filterTransforms.calculateSpriteMatrix(outputMatrix, currentState.sourceFrame, currentState.renderTarget.size, sprite);
};
FilterManager.prototype.destroy = function () {
};
FilterManager.getPotRenderTarget = function (gl, minWidth, minHeight, resolution) {
    minWidth = bitTwiddle.nextPow2(minWidth * resolution);
    minHeight = bitTwiddle.nextPow2(minHeight * resolution);
    var key = ((minWidth & 0xFFFF) << 16) | (minHeight & 0xFFFF);
    if (!FilterManager.pool[key]) {
        FilterManager.pool[key] = [];
    }
    var renderTarget = FilterManager.pool[key].pop() || new RenderTarget(gl, minWidth, minHeight, null, 1);
    renderTarget.resolution = resolution;
    renderTarget.defaultFrame.width = renderTarget.size.width = minWidth / resolution;
    renderTarget.defaultFrame.height = renderTarget.size.height = minHeight / resolution;
    return renderTarget;
};
FilterManager.freePotRenderTarget = function (renderTarget) {
    var minWidth = renderTarget.size.width * renderTarget.resolution;
    var minHeight = renderTarget.size.height * renderTarget.resolution;
    var key = ((minWidth & 0xFFFF) << 16) | (minHeight & 0xFFFF);
    FilterManager.pool[key].push(renderTarget);
};
