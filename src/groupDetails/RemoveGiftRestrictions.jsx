import React from 'react';
import _ from 'lodash';
import CancelIcon from '@material-ui/icons/Cancel';
import classNames from 'classnames';
import { mapIdToName } from '../myGroups/helpers';
import LoadingDiv from '../common/loadingDiv/LoadingDiv';
import StyledButton from '../common/StyledButton/StyledButton';
import styles from './RemoveGiftRestrictions.module.scss';

const doArraysContainSameElements = (arr, arrTwo) => _.xor(arr, arrTwo).length === 0;

const getRemainingRestrictions = (giftRestrictions, removedRestrictions) =>
    Object
        .values(giftRestrictions)
        .filter(x => {
            return !removedRestrictions.some(y => x.isOneWay === y.isOneWay && doArraysContainSameElements(x.people, y.people))
        });

const RemoveGiftRestrictions = props => {
    const remainingResults = getRemainingRestrictions(props.giftRestrictions,
        props.removedGiftRestrictions);
    return (
        <>
            <div className={styles.removeGiftRestrictionNamesWrapper}>
                {Object.keys(props.giftRestrictions).length === 0 && (
                    <div className={styles.noGiftRestrictionsToRemove}>
                        There are no gift restrictions to remove
                    </div>
                )}
                {remainingResults.length === 0 && props.removedGiftRestrictions.length > 0 && (
                    <div className={styles.noGiftRestrictionsToRemove}>
                        There are no more gift restrictions to remove
                    </div>
                )}
                {remainingResults.map((restriction, index) => (
                    <div className={styles.rowWrapper} key={restriction.people.toString()}>
                        <div
                            className={classNames({
                                [styles.removeGiftRestrictionRow]: true,
                                [styles[`color-${index % 4}`]]: true
                            })}
                        >
                            {
                                restriction
                                    .people
                                    .map(name => mapIdToName(name, props.displayNameMappings))
                                    .join(restriction.isOneWay ? ' buying for: ' : ', ')
                            }
                        </div>
                        <div className={styles.removeButton}>
                            <CancelIcon
                                fontSize="large"
                                color="secondary"
                                onClick={() => props.onRemoveRestriction(restriction)}
                            />
                        </div>
                    </div>
                ))}
            </div>
            <div className={styles.buttonWrapper}>
                <LoadingDiv isLoading={props.removingGiftRestrictions} isBorderRadius>
                    <StyledButton
                        color="primary"
                        onClick={props.confirmRemoveRequest}
                        text="Remove"
                        disabled={props.removedGiftRestrictions.length === 0
                        || props.removingGiftRestrictions}
                    />
                    <StyledButton
                        color="secondary"
                        onClick={props.cancelRemovingGiftRestrictions}
                        text="Cancel"
                        disabled={props.removingGiftRestrictions}
                    />
                </LoadingDiv>
            </div>
        </>
    );
};

export default RemoveGiftRestrictions;
