import React from 'react';
import MaterialCheckbox from '@material-ui/core/Checkbox';
import PropTypes from 'prop-types';
import { noop } from 'lodash';
import defaultStyles from './Checkbox.module.scss';

const Checkbox = props => (
    <MaterialCheckbox
        className={props.styles[props.color]}
        checked={props.checked}
        disabled={props.disabled}
        onClick={props.onClick}
    />
);

Checkbox.defaultProps = {
    checked: false,
    disabled: false,
    color: 'blue',
    onClick: noop,
    styles: defaultStyles
};

Checkbox.propTypes = {
    checked: PropTypes.bool,
    disabled: PropTypes.bool,
    color: PropTypes.string,
    onClick: PropTypes.func,
    styles: PropTypes.objectOf(PropTypes.string)
};

export default Checkbox;
