define(["require", "exports", '../../src/easelts/display/Stage', '../../src/easelts/display/Debug', './example7/Carousel', './example7/TopButton', './example7/BottomButton'], function (require, exports, Stage_1, Debug_1, Carousel_1, TopButton_1, BottomButton_1) {
    "use strict";
    var holder = document.getElementById('holder');
    var stage = new Stage_1.default(holder, true);
    stage.enableMouseOver();
    var carousel = new Carousel_1.default();
    stage.addChild(carousel);
    carousel.addChild(new Debug_1.default('page0', '100%', '100%', 0, '0%', 0, 0));
    carousel.addChild(new Debug_1.default('page1', '100%', '100%', 0, '100%', 0, 0));
    carousel.addChild(new Debug_1.default('page2', '100%', '100%', 0, '200%', 0, 0));
    carousel.addChild(new Debug_1.default('page3', '100%', '100%', 0, '300%', 0, 0));
    carousel.addChild(new Debug_1.default('page4', '100%', '100%', 0, '400%', 0, 0));
    carousel.addChild(new Debug_1.default('page5', '100%', '100%', 0, '500%', 0, 0));
    carousel.animateToPage(0);
    var top = new TopButton_1.default();
    var bottom = new BottomButton_1.default();
    top.addEventListener(Stage_1.default.EVENT_MOUSE_CLICK, function () { return carousel.prev(); });
    bottom.addEventListener(Stage_1.default.EVENT_MOUSE_CLICK, function () { return carousel.next(); });
    stage.addChild(top);
    stage.addChild(bottom);
    stage.start();
});
