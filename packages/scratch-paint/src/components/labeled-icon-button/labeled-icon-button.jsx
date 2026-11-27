/* @todo This file should be pulled out into a shared library with scratch-gui,
consolidating this component with icon-button.jsx in gui.
See #13 */

import classNames from 'classnames';
import React from 'react';
import PropTypes from 'prop-types';

import Button from '../button/button.jsx';
import TintedImage from '../tinted-image/tinted-image.jsx';

import styles from './labeled-icon-button.css';

const LabeledIconButton = ({
    className,
    hideLabel,
    imgAlt,
    imgSrc,
    imgUntintedSrc,
    onClick,
    tinted,
    title,
    ...props
}) => {
    const tintedProps = tinted ? {untintedSrc: imgUntintedSrc} : {};
    const Image = tinted ? TintedImage : 'img';
    return (
        <Button
            className={classNames(className, styles.modEditField)}
            onClick={onClick}
            {...props}
        >
            <Image
                alt={imgAlt || title}
                className={styles.editFieldIcon}
                draggable={false}
                src={imgSrc}
                title={title}
                {...tintedProps}
            />
            {!hideLabel && <span className={styles.editFieldTitle}>{title}</span>}
        </Button>
    );
};

LabeledIconButton.propTypes = {
    className: PropTypes.string,
    hideLabel: PropTypes.bool,
    highlighted: PropTypes.bool,
    imgAlt: PropTypes.string,
    imgSrc: PropTypes.string.isRequired,
    /** With `tinted`, the icon's parts that keep their own colours, drawn over the tint */
    imgUntintedSrc: PropTypes.string,
    onClick: PropTypes.func.isRequired,
    /** Draw `imgSrc` in the editor's accent colour, whatever colour its file uses */
    tinted: PropTypes.bool,
    title: PropTypes.string.isRequired
};

export default LabeledIconButton;
