import React from 'react';
import {FormattedMessage, defineMessages} from 'react-intl';
import classNames from 'classnames';
import styles from './loader.css';
import PropTypes from 'prop-types';

import topBlock from './top-block.svg';
import middleBlock from './middle-block.svg';
import bottomBlock from './bottom-block.svg';
const messages = defineMessages({
    creatingBlocks: {
        defaultMessage: 'Creating blocks …',
        description: 'One of the loading messages',
        id: 'gui.loader.message1'
    },
    loadingSprites: {
        defaultMessage: 'Loading sprites …',
        description: 'One of the loading messages',
        id: 'gui.loader.message2'
    },
    loadingSounds: {
        defaultMessage: 'Loading sounds …',
        description: 'One of the loading messages',
        id: 'gui.loader.message3'
    },
    loadingExtensions: {
        defaultMessage: 'Loading extensions …',
        description: 'One of the loading messages',
        id: 'gui.loader.message4'
    },
    herdingCats: {
        defaultMessage: 'Herding cats …',
        description: 'One of the loading messages',
        id: 'gui.loader.message5'
    },
    transmittingNanos: {
        defaultMessage: 'Transmitting nanos …',
        description: 'One of the loading messages',
        id: 'gui.loader.message6'
    },
    inflatingGobos: {
        defaultMessage: 'Inflating gobos …',
        description: 'One of the loading messages',
        id: 'gui.loader.message7'
    },
    preparingEmojis: {
        defaultMessage: 'Preparing emojis …',
        description: 'One of the loading messages',
        id: 'gui.loader.message8'
    }
});

/**
 * The messages the loader picks from at random, each picked in proportion to its weight. An embedding app can give
 * its own as the `loadingMessages` prop of the GUI.
 */
const defaultLoadingMessages = [
    {message: messages.creatingBlocks, weight: 70},
    {message: messages.loadingSprites, weight: 50},
    {message: messages.loadingSounds, weight: 50},
    {message: messages.loadingExtensions, weight: 50},
    {message: messages.herdingCats, weight: 1},
    {message: messages.transmittingNanos, weight: 1},
    {message: messages.inflatingGobos, weight: 1},
    {message: messages.preparingEmojis, weight: 1}
];

const mainMessages = {
    'gui.loader.headline': (
        <FormattedMessage
            defaultMessage="Loading Project"
            description="Main loading message"
            id="gui.loader.headline"
        />
    ),
    'gui.loader.creating': (
        <FormattedMessage
            defaultMessage="Creating Project"
            description="Main creating message"
            id="gui.loader.creating"
        />
    )
};

class LoaderComponent extends React.Component {
    constructor (props) {
        super(props);
        this.state = {
            messageNumber: this.chooseRandomMessage()
        };
    }
    componentDidMount () {
        // Start an interval to choose a new message every 5 seconds
        this.intervalId = setInterval(() => {
            this.setState({messageNumber: this.chooseRandomMessage()});
        }, 5000);
    }
    componentWillUnmount () {
        clearInterval(this.intervalId);
    }
    chooseRandomMessage () {
        const {messages: loadingMessages} = this.props;
        const sum = loadingMessages.reduce((acc, m) => acc + m.weight, 0);
        let rand = sum * Math.random();
        return loadingMessages.findIndex(m => (rand -= m.weight) <= 0);
    }
    render () {
        return (
            <div
                className={classNames(styles.background, {
                    [styles.fullscreen]: this.props.isFullScreen
                })}
            >
                <div className={styles.container}>
                    <div className={styles.blockAnimation}>
                        <img
                            className={styles.topBlock}
                            src={topBlock}
                        />
                        <img
                            className={styles.middleBlock}
                            src={middleBlock}
                        />
                        <img
                            className={styles.bottomBlock}
                            src={bottomBlock}
                        />
                    </div>
                    <div className={styles.title}>
                        {mainMessages[this.props.messageId]}
                    </div>
                    <div className={styles.messageContainerOuter}>
                        <div
                            className={styles.messageContainerInner}
                            style={{transform: `translate(0, -${this.state.messageNumber * 25}px)`}}
                        >
                            {this.props.messages.map((m, i) => (
                                <div
                                    className={styles.message}
                                    key={i}
                                >
                                    <FormattedMessage {...m.message} />
                                </div>
                            ))}
                        </div>
                    </div>
                </div>
            </div>
        );
    }
}

const loadingMessagesPropType = PropTypes.arrayOf(PropTypes.shape({
    message: PropTypes.shape({
        defaultMessage: PropTypes.string.isRequired,
        description: PropTypes.string,
        id: PropTypes.string.isRequired
    }).isRequired,
    weight: PropTypes.number.isRequired
}));

LoaderComponent.propTypes = {
    isFullScreen: PropTypes.bool,
    messageId: PropTypes.string,
    messages: loadingMessagesPropType
};
LoaderComponent.defaultProps = {
    isFullScreen: false,
    messageId: 'gui.loader.headline',
    messages: defaultLoadingMessages
};

export {
    LoaderComponent as default,
    loadingMessagesPropType
};
