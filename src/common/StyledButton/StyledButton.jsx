import React from 'react';
import { createMuiTheme, makeStyles } from '@material-ui/core/styles';
import { ThemeProvider } from '@material-ui/styles';
import Button from '@material-ui/core/Button';
import { noop } from 'lodash';
import PropTypes from 'prop-types';
import classNames from 'classnames';

const useStyles = makeStyles(theme => ({
    margin: {
        margin: theme.spacing(1)
    },
    smallButton: {
        padding: '0px'
    }
}));

const theme = createMuiTheme({
    palette: {
        primary: {
            main: '#388e3c'
        },
        secondary: {
            main: '#dd2c00'
        }
    }
});

const StyledButton = props => {
    const classes = useStyles();

    return (
        <ThemeProvider theme={theme}>
            <Button
                fullWidth={props.fullWidth}
                disabled={props.disabled}
                variant="contained"
                color={props.color}
                className={classNames({
                    [classes.margin]: !props.smallButton,
                    [classes.smallButton]: props.smallButton
                })}
                onClick={props.onClick}
                type={props.type}
            >
                {props.text}
            </Button>
        </ThemeProvider>
    );
};

StyledButton.defaultProps = {
    disabled: false,
    fullWidth: false,
    color: 'primary',
    onClick: noop,
    smallButton: false,
    text: 'Button',
    type: 'submit'
};

StyledButton.propTypes = {
    disabled: PropTypes.bool,
    fullWidth: PropTypes.bool,
    color: PropTypes.string,
    onClick: PropTypes.func,
    smallButton: PropTypes.bool,
    text: PropTypes.oneOfType([
        PropTypes.string,
        PropTypes.node
    ]),
    type: PropTypes.string
};

export default StyledButton;
