import classNames from 'classnames';
import PropTypes from 'prop-types';
import React from 'react';

import styles from './tinted-image.css';

/* @todo This is a copy of scratch-gui's TintedImage, and should be pulled out into a shared library with it. See #13 */

/**
 * An `<img>` of a one-colour icon, drawn in the editor's accent colour (`looks-secondary`) whatever colour its file
 * uses. An SVG shown in an `<img>` can't read the page's custom properties, so without this an embedding app's
 * override of the colour wouldn't reach the icon.
 *
 * The file is used as a mask over a background of that colour, which keeps its shape and transparency but not its
 * colours. It is still an `<img>` of the file, so it keeps the size and layout the file gives it. A caller's class can
 * set another `background-color`.
 *
 * For an icon with parts in other colours drawn over the parts in the accent colour, `untintedSrc` is a copy of it
 * with the accent colour's parts taken out, drawn over the tint.
 * @param {object} props - the props for an `<img>`
 * @param {string} [props.className] - more classes for the image
 * @param {string} props.src - the image's URL
 * @param {object} [props.style] - more inline styles for the image
 * @param {string} [props.untintedSrc] - the URL of the icon's parts that keep their own colours
 * @param {React.Ref} ref - a ref to the `<img>`
 * @returns {React.ReactElement} the image
 */
const TintedImage = React.forwardRef(({className, src, style, untintedSrc, ...props}, ref) => {
    const mask = `url("${src}")`;
    return (
        <img
            {...props}
            className={classNames(styles.tintedImage, className)}
            ref={ref}
            src={src}
            style={{
                WebkitMaskImage: mask,
                maskImage: mask,
                backgroundImage: untintedSrc && `url("${untintedSrc}")`,
                ...style
            }}
        />
    );
});

TintedImage.displayName = 'TintedImage';

TintedImage.propTypes = {
    className: PropTypes.string,
    src: PropTypes.string.isRequired,
    style: PropTypes.object, // eslint-disable-line react/forbid-prop-types
    untintedSrc: PropTypes.string
};

export default TintedImage;
