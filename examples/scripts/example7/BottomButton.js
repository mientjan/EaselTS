var __extends = (this && this.__extends) || function (d, b) {
    for (var p in b) if (b.hasOwnProperty(p)) d[p] = b[p];
    function __() { this.constructor = d; }
    d.prototype = b === null ? Object.create(b) : (__.prototype = b.prototype, new __());
};
define(["require", "exports", '../../../src/easelts/display/Container', '../../../src/easelts/display/Text', '../../../src/easelts/component/BitmapNinePatch', '../../../src/easelts/component/bitmapninepatch/NinePatch', '../../../src/easelts/geom/Rectangle', '../../../src/easelts/behavior/ButtonBehavior'], function (require, exports, Container_1, Text_1, BitmapNinePatch_1, NinePatch_1, Rectangle_1, ButtonBehavior_1) {
    "use strict";
    var BottomButton = (function (_super) {
        __extends(BottomButton, _super);
        function BottomButton() {
            _super.call(this, 200, 50, '50%', '100%', '50%', '100%');
            this._ninepatch = new NinePatch_1.default('assets/image/ninepatch_blue.png', new Rectangle_1.default(5, 12, 139, 8));
            this._bg = new BitmapNinePatch_1.default(this._ninepatch);
            this._text = new Text_1.default('bottom');
            this.addBehavior(new ButtonBehavior_1.default);
            this.hitArea = this._bg;
            this.addChild(this._bg);
            this.addChild(this._text);
        }
        return BottomButton;
    }(Container_1.default));
    Object.defineProperty(exports, "__esModule", { value: true });
    exports.default = BottomButton;
});
