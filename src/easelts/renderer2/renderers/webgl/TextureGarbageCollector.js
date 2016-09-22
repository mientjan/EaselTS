define(["require", "exports"], function (require, exports) {
    "use strict";
    var CONST = require('../../const');
    var TextureGarbageCollector = (function () {
        function TextureGarbageCollector(renderer) {
            this.count = 0;
            this.checkCount = 0;
            this.maxIdle = 60 * 60;
            this.checkCountMax = 60 * 10;
            this.mode = CONST.GC_MODES.DEFAULT;
            this.renderer = renderer;
        }
        TextureGarbageCollector.prototype.update = function () {
            this.count++;
            if (this.mode === CONST.GC_MODES.MANUAL) {
                return;
            }
            this.checkCount++;
            if (this.checkCount > this.checkCountMax) {
                this.checkCount = 0;
                this.run();
            }
        };
        ;
        TextureGarbageCollector.prototype.run = function () {
            var tm = this.renderer.textureManager;
            var managedTextures = tm._managedTextures;
            var wasRemoved = false;
            var i, j;
            for (i = 0; i < managedTextures.length; i++) {
                var texture = managedTextures[i];
                if (!texture._glRenderTargets && this.count - texture.touched > this.maxIdle) {
                    tm.destroyTexture(texture, true);
                    managedTextures[i] = null;
                    wasRemoved = true;
                }
            }
            if (wasRemoved) {
                j = 0;
                for (i = 0; i < managedTextures.length; i++) {
                    if (managedTextures[i] !== null) {
                        managedTextures[j++] = managedTextures[i];
                    }
                }
                managedTextures.length = j;
            }
        };
        TextureGarbageCollector.prototype.unload = function (displayObject) {
            var tm = this.renderer.textureManager;
            if (displayObject._texture) {
                tm.destroyTexture(displayObject._texture, true);
            }
            for (var i = displayObject.children.length - 1; i >= 0; i--) {
                this.unload(displayObject.children[i]);
            }
        };
        return TextureGarbageCollector;
    }());
    exports.TextureGarbageCollector = TextureGarbageCollector;
});
