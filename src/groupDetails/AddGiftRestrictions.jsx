import React from 'react';
import classNames from 'classnames';
import StyledButton from '../common/StyledButton/StyledButton';
import LoadingDiv from '../common/loadingDiv/LoadingDiv';
import { mapIdToName } from '../myGroups/helpers';
import Checkbox from '../common/Checkbox/Checkbox';
import styles from './AddGiftRestrictions.module.scss';

const AddGiftRestrictions = props => {
    const generateCheckboxRow = (p, onAddPerson, displayNameMappings) => {
        const people = props.newGiftRestriction.people;
        const selected = people.includes(p);
        const disabled = !selected && props.newGiftRestriction.isOneWay && people.length >= 2;
        const myIndex = people.indexOf(p);
        const oneWayDetail = !props.newGiftRestriction.isOneWay
            ? ""
            : myIndex === 0
            ? ` (cannot send a gift to ${people.length > 1 ? mapIdToName(people[1], displayNameMappings) : "..."})`
            : myIndex === 1
            ? ` (cannot be sent a gift from ${mapIdToName(people[0], displayNameMappings)})`
            : "";

        return (
            <div className={styles.participantRow} key={p}>
                <div>
                    <Checkbox
                        checked={selected}
                        onClick={() => onAddPerson(p)}
                        disabled={disabled}
                    />
                </div>
                <div
                    className={classNames({
                        [styles.participantName]: true,
                        [styles.makeBold]: selected,
                        [styles.disabled]: disabled
                    })}
                    onClick={() => !disabled && onAddPerson(p)}
                    role="button"
                    tabIndex={0}
                >
                    {mapIdToName(p, displayNameMappings)}
                    {oneWayDetail}
                </div>
            </div>
        );
    };

    return (
        <>
            <div>
                <Checkbox
                    checked={props.newGiftRestriction.isOneWay}
                    onClick={props.onToggleIsOneWay}
                />
                One way restriction
            </div>
            <div className={styles.instructionsMessage}>
                {props.newGiftRestriction.isOneWay
                    ? "The first person cannot send a gift to the second person"
                    : "Anybody in the same group will not be able to send or receive a gift from each other"
                }
            </div>
            <div className={styles.scrollableWrapper}>
                <div className={styles.checkboxWrapper}>
                    <div>
                        {props.participants.filter((x, index) => index % 3 === 0).map(p => (
                            generateCheckboxRow(p, props.onAddPerson, props.displayNameMappings)
                        ))}
                    </div>
                    <div>
                        {props.participants.filter((x, index) => index % 3 === 1).map(p => (
                            generateCheckboxRow(p, props.onAddPerson, props.displayNameMappings)
                        ))}
                    </div>
                    <div>
                        {props.participants.filter((x, index) => index % 3 === 2).map(p => (
                            generateCheckboxRow(p, props.onAddPerson, props.displayNameMappings)
                        ))}
                    </div>
                </div>
                <div className={styles.buttonWrapper}>
                    <LoadingDiv isLoading={props.addingGiftRestriction} isBorderRadius>
                        <StyledButton
                            color="primary"
                            onClick={props.addGiftRestriction}
                            text="Add Group"
                            disabled={props.newGiftRestriction.people.length < 2
                                || props.addingGiftRestriction}
                        />
                        <StyledButton
                            color="secondary"
                            onClick={props.cancelAddingGiftRestriction}
                            text="Cancel"
                            disabled={props.addingGiftRestriction}
                        />
                    </LoadingDiv>
                </div>
            </div>
        </>
    );
};

export default AddGiftRestrictions;
