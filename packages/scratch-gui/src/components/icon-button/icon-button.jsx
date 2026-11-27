import PropTypes from 'prop-types';
import React from 'react';
import classNames from 'classnames';
import styles from './icon-button.css';
import TintedImage from '../tinted-image/tinted-image.jsx';

const IconButton = ({
    img,
    disabled,
    className,
    tinted,
    title,
    onClick
}) => {
    const Image = tinted ? TintedImage : 'img';
    return (
        <button
            className={classNames(
                styles.container,
                className,
                disabled ? styles.disabled : null
            )}
            onClick={onClick}
            disabled={disabled}
        >
            <Image
                className={styles.icon}
                draggable={false}
                src={img}
            />
            <div className={styles.title}>
                {title}
            </div>
        </button>
    );
};

IconButton.propTypes = {
    className: PropTypes.string,
    disabled: PropTypes.bool,
    img: PropTypes.string,
    onClick: PropTypes.func.isRequired,
    /** Draw `img`, a one-colour icon, in the editor's accent colour */
    tinted: PropTypes.bool,
    title: PropTypes.node.isRequired
};

export default IconButton;
