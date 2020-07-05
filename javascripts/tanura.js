
/*
 * Tanura client.
 *
 * This script contains the Tanura client.
 */

/**
 * Base URL for requests to the Nuve backend.
 */
const nuveUrl = '//tanura.hhmn.de/nuve';

/**
 * Whether low-bandwidth-mode is engaged.
 */
let slideShowMode = false;

/**
 * The local stream from the browser the client is connected to.
 */
window.localStream = undefined

/**
 * The Nuve room the client is connected to.
 */
window.room = undefined;

/**
 * A boolean indicating whether a recording is currently in progress.
 */
window.recording = false;

/**
 * The id of the last recording started.
 */
window.recordingId = '';

// noinspection JSUnusedGlobalSymbols
/**
 * Fetch a GET-parameter from the url by name.
 */
const getParameterByName = (name) => {
    name = name.replace(/[\[]/, '\\\[').replace(/[\]]/, '\\\]');
    const regex = new RegExp(`[?&]${name}=([^&#]*)`);
    const results = regex.exec(location.search);
    return results == null ? '' : decodeURIComponent(results[1].replace(/\+/g, ' '));
};

// noinspection JSUnusedGlobalSymbols
/**
 * Toggle the recording
 */
function startRecording() {
    if (window.room) {
        if (!window.recording) {
            window.room.startRecording(window.localStream, (id) => {
                window.recording = true;
                window.recordingId = id;
            });
        } else {
            window.room.stopRecording(window.recordingId);
            window.recording = false;
        }
    }
}

// noinspection JSUnusedGlobalSymbols
/**
 * Toggle bandwidth-preserving video on or off.
 */
const toggleSlideShowMode = () => {
    const streams = window.room.remoteStreams;
    const cb = (evt) => {
        console.log('SlideShowMode changed', evt);
    };
    slideShowMode = !slideShowMode;
    streams.forEach((stream) => {
        if (window.localStream.getID() !== stream.getID()) {
            console.log('Updating config');
            stream.updateConfiguration({ slideShowMode }, cb);
        }
    });
}

/**
 * Main entrypoint for Bun.
 */
window.startBun = () => {
    window.recording = false;
    const roomName = 'xkcd';
    const singlePC = false;
    const roomType = 'erizo';
    const audioOnly = false;
    const mediaConfiguration = 'default';
    const onlySubscribe = '';
    const onlyPublish = '';
    const autoSubscribe = '';
    const offerFromErizo = '';
    console.log('Selected Room', roomName, 'of type', roomType);
    const config = {
        audio: true,
        video: !audioOnly,
        data: true,
        screen: false,
        attributes: {}
    };

    Erizo.Logger.setLogLevel(Erizo.Logger.INFO);
    window.localStream = Erizo.Stream(config);
    const createToken = (roomData, callback) => {
        const req = new XMLHttpRequest();
        const url = `${nuveUrl}/createToken/`;

        req.onreadystatechange = () => {
            if (req.readyState === 4) {
                callback(req.responseText);
            }
        };

        req.open('POST', url, true);
        req.setRequestHeader('Content-Type', 'application/json');
        req.send(JSON.stringify(roomData));
    };

    const roomData = {
        username: `user ${parseInt("" + Math.random() * 100, 10)}`,
        role: 'presenter',
        room: roomName,
        type: roomType,
        mediaConfiguration
    };

    createToken(roomData, (response) => {
        const token = response;
        console.log(token);
        window.room = Erizo.Room({ token });

        const subscribeToStreams = (streams) => {
            if (autoSubscribe || onlyPublish) { return; }
            const cb = (evt) => {
                console.log('Bandwidth Alert', evt.msg, evt.bandwidth);
            };

            streams.forEach((stream) => {
                if (window.localStream.getID() !== stream.getID()) {
                    window.room.subscribe(stream, {
                        slideShowMode,
                        metadata: { type: 'subscriber' },
                        offerFromErizo
                    });
                    stream.addEventListener('bandwidth-alert', cb);
                }
            });
        };

        window.room.addEventListener('room-connected', (roomEvent) => {
            const options = {
                metadata: { type: 'publisher' }
            };
            const enableSimulcast = '';
            if (enableSimulcast) { options.simulcast = { numSpatialLayers: 2 }; }
            subscribeToStreams(roomEvent.streams);

            if (!onlySubscribe) {
                window.room.publish(window.localStream, options);
            }
            window.room.addEventListener('quality-level', (qualityEvt) => {
                console.log(`New Quality Event, connection quality: ${qualityEvt.message}`);
            });
            if (autoSubscribe) {
                window.room.autoSubscribe(
                    { '/attributes/type': 'publisher' },
                    {},
                    {
                        audio: true,
                        video: true,
                        data: false
                    },
                    () => {});

            }
        });

        window.room.addEventListener('stream-subscribed', (streamEvent) => {
            const stream = streamEvent.stream;
            const videoEntry = document.createElement('div');
            videoEntry.setAttribute('id', `videoEntry_${stream.getID()}`);
            document.getElementById('people').appendChild(videoEntry);
            stream.show(`videoEntry_${stream.getID()}`);
        });

        window.room.addEventListener('stream-added', (streamEvent) => {
            const streams = [];
            streams.push(streamEvent.stream);
            if (window.localStream) {
                window.localStream.setAttributes({ type: 'publisher' });
            }
            subscribeToStreams(streams);
        });

        window.room.addEventListener('stream-removed', (streamEvent) => {
            // Remove stream from DOM
            const stream = streamEvent.stream;
            if (stream.elementID) {
                const element = document.getElementById(stream.elementID);
                document.getElementById('people').removeChild(element);
            }
        });

        window.room.addEventListener('stream-failed', () => {
            console.log('Stream Failed, act accordingly');
        });

        if (onlySubscribe) {
            window.room.connect({ singlePC });
        } else {
            const videoEntry = document.createElement('div');
            videoEntry.setAttribute('id', 'myVideo');
            document.getElementById('people').appendChild(videoEntry);

            window.localStream.addEventListener('access-accepted', () => {
                window.room.connect({ singlePC });
                window.localStream.show('myVideo');
            });
            window.localStream.init();
        }
    });
};
