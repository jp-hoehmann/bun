'use strict';

/*
 * Client entrypoint.
 *
 * This script contains all code necessary to make the ui work.
 */

/**
 * Fake resize indicator.
 *
 * Because of CSS bugs and limitations, Bun will sometimes have to change
 * layout parameters manually in Js. As this happens after the resize, a second
 * resize event may be triggered to give other Js code the ability to react to
 * changes Bun has made to the layout. In this case, this variable will be
 * set to true, to tell Bun, that the resize event was a fake resize event
 * triggered by Bun's own code and should be ignored.
 */
let fakeResize = false;

/**
 * Set a color scheme.
 * This will apply a given color scheme to the app.
 */
const colorize = (colorScheme) => {
    const e = document.getElementsByTagName('nav')[0];
    e.style.backgroundColor = '#' + colorScheme[1];
    e.className = colorScheme[2] ? 'inverted' : '';
}

window.onload = () => {
    const body = document.getElementsByTagName('body')[0];
    const leftBtn = document.getElementById('left-btn');
    const rightBtn = document.getElementById('right-btn');

    // Manually calculate the size of some elements to work around flexbox
    // issues and limitations.
    const f = () => {
        if (!fakeResize) {
            document.getElementById('content').style.height
                = window.innerHeight
                - document.getElementsByTagName('nav')[0].offsetHeight
                + 'px';

            // Wait for transitions.
            setTimeout(() => {
                const e = document.getElementById('main');
                const _ = document.getElementById('presentation');
                if (innerWidth > innerHeight) {
                    _.style.height = '100%';
                    _.style.width = '0';
                    _.style.width = e.clientWidth - 224 + 'px';
                } else {
                    _.style.width = '100%';
                    _.style.height = '0';
                    _.style.height = e.clientHeight - 224 + 'px';
                }

                // Pass another resize for Literallycanvas.
                fakeResize = true;
                dispatchEvent(new Event('resize'));
            }, 200);
        } else {
            fakeResize = false;
        }
    }
    window.addEventListener('throttledResize', f);
    f();

    // Event handlers for the buttons in the menu bar.
    leftBtn.addEventListener(
        'click',
        () => {
            body.classList.toggle('left-expanded');
            dispatchEvent(new Event('resize'));
        });
    rightBtn.addEventListener(
        'click',
        () => {
            body.classList.toggle('right-expanded');
            dispatchEvent(new Event('resize'));
        });
    document.getElementById('back-btn').addEventListener(
        'click',
        () => body.className = '');
    document.getElementById('users-btn').addEventListener(
        'click',
        () => {
            document
                .getElementsByTagName('main')[0]
                .classList
                .toggle('listview');
        });

    // If on mobile clicking in the center area will close any <aside>s.
    const centerElements = document.getElementsByClassName('center');
    for (let i = 0; i < centerElements.length; i++) {
        centerElements[i].addEventListener(
            'click',
            (_) => {
                if (body.className !== '' && window.innerWidth <= 600) {
                    body.className = '';
                    leftBtn.classList.remove('active');
                    rightBtn.classList.remove('active');
                    _.stopPropagation();
                }
                else if (body.classList.contains('right-expanded')
                    && window.innerWidth <= 1280) {
                    body.classList.remove('right-expanded');
                    rightBtn.classList.remove('active');
                    _.stopPropagation();
                }
            },
            true);
    }

    // Clicking a button will toggle its active state.
    const toggleBtns = document.getElementsByClassName('toggle-btn');
    for (let i = 0; i < toggleBtns.length; i++) {
        // noinspection JSUnresolvedVariable
        toggleBtns[i].addEventListener('click',
            (_) => _.currentTarget.classList.toggle('active'));
    }

    // List of color schemes.
    const colors = [
        ['Red', 'f44336', true],
        ['Pink', 'e91e63', true],
        ['Purple', '9c27b0', true],
        ['Deep Purple', '673ab7', true],
        ['Indigo', '3f51b5', true],
        ['Blue', '2196f3', true],
        ['Light Blue', '03a9f4', false],
        ['Cyan', '00bcd4', false],
        ['Teal', '009688', true],
        ['Green', '4caf50', false],
        ['Light Green', '8bc34a', false],
        ['Lime', 'cddc39', false],
        ['Yellow', 'ffeb3b', false],
        ['Amber', 'ffc107', false],
        ['Orange', 'ff9800', false],
        ['Deep Orange', 'ff5722', true],
        ['Brown', '795548', true],
        ['Blue Grey', '607d8b', true]];

    // Add buttons for the color schemes.
    for (let i = 0; i < colors.length; i++) {
        const _ = document.createElement('a');
        _.textContent = colors[i][0];
        _.addEventListener(
            'click',
            ((_) => () => {
                colorize(_);
                localStorage.setItem('colorScheme', JSON.stringify(_));
            })(colors[i]));
        const e = document.createElement('p');
        document.getElementById('colors').appendChild(e);
        e.appendChild(_);
    }

    // Fetch color scheme.
    const colorScheme = localStorage.getItem('colorScheme');
    if (colorScheme) { colorize(JSON.parse(colorScheme)); }

    // Fire up the actual magic.
    window.startBun();
}
