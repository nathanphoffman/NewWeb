<!-- themes: cats -->
# Image Loading Test

This page exists to visually check two things: **opening a lightbox shouldn't jump you to the top of the page**, and **images should ease into place instead of popping in and shoving the rest of the page down**.

## How to check the lightbox scroll fix

Scroll down so this image is roughly in the middle of your viewport, then click it to open the lightbox, then close it (click outside the image or the × ). Your scroll position should not change at all.

![a small test photo](684448-small.jpg)

## Padding so there's real scroll distance

Lorem ipsum dolor sit amet, consectetur adipiscing elit. Sed do eiusmod tempor incididunt ut labore et dolore magna aliqua. Ut enim ad minim veniam, quis nostrud exercitation ullamco laboris nisi ut aliquip ex ea commodo consequat.

Duis aute irure dolor in reprehenderit in voluptate velit esse cillum dolore eu fugiat nulla pariatur. Excepteur sint occaecat cupidatat non proident, sunt in culpa qui officia deserunt mollit anim id est laborum.

Sed ut perspiciatis unde omnis iste natus error sit voluptatem accusantium doloremque laudantium, totam rem aperiam, eaque ipsa quae ab illo inventore veritatis et quasi architecto beatae vitae dicta sunt explicabo.

Nemo enim ipsam voluptatem quia voluptas sit aspernatur aut odit aut fugit, sed quia consequuntur magni dolores eos qui ratione voluptatem sequi nesciunt.

## How to check the graceful load-in

Reload this page (hard refresh, or throttle your network in devtools to "Slow 3G" for the clearest effect) and watch the image above: the frame should ease open and the photo should fade/settle into place, rather than instantly popping to full size.

## Oversized image → fallback button

This one is intentionally over the default 200KB auto-load limit, so it should show a "click to load it anyway" button instead of loading automatically. Click the button and the same ease-in behavior should apply once it loads.

![a much larger photo, over the size limit](684448.jpg)
