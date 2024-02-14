/* eslint-disable react/prop-types */
import Paper from '@material-ui/core/Paper';
import { makeStyles } from '@material-ui/core/styles';
import useMediaQuery from '@material-ui/core/useMediaQuery';
import AddIcon from '@material-ui/icons/Add';
import AddCircleIcon from '@material-ui/icons/AddCircle';
// import ContactsIcon from '@material-ui/icons/Contacts';
import DeleteIcon from '@material-ui/icons/Delete';
import EditIcon from '@material-ui/icons/Edit';
import FaceIcon from '@material-ui/icons/Face';
import InfoIcon from '@material-ui/icons/Info';
import ArrowRightAltIcon from '@material-ui/icons/ArrowRightAlt';
import RemoveIcon from '@material-ui/icons/Remove';
import classNames from 'classnames';
import moment from 'moment';
import React from 'react';
import { connect } from 'react-redux';
import { firestoreConnect } from 'react-redux-firebase';
import { compose } from 'redux';
import DatePicker from '../common/datePicker/DatePicker';
import Fade from '../common/Fade/Fade';
import LoadingDiv from '../common/loadingDiv/LoadingDiv';
import SuccessModal from '../common/modal/SuccessModal';
import RangeSlider from '../common/slider/RangeSlider';
import Spinner from '../common/spinner/Spinner';
import StyledButton from '../common/StyledButton/StyledButton';
import * as textInputConstants from '../common/TextInput/constants';
import TextInput from '../common/TextInput/TextInput';
import * as constants from '../constants';
import materialStyles from '../materialStyles';
import { joinGroupRequest } from '../myGroups/actions';
import { mapIdToName } from '../myGroups/helpers';
import { findNextChristmas } from '../myGroups/MyGroups';
import {
    addDeliveryAddressRequest, addGiftRestrictionRequest, addWishlistItemRequest,
    assignPairingsRequest, deleteGroupRequest, editDateRequest,
    editWishlistItemRequest, kickUserRequest, leaveGroupRequest,
    redirectRequest, regenerateGroupRequest,
    removeGiftRestrictionRequests, removeWishlistItemsRequest
} from './actions';
import AddGiftRestrictions from './AddGiftRestrictions';
import AddToWishlist from './AddToWishlist';
import styles from './GroupDetails.module.scss';
import Invited from './invited/Invited';
import RemoveFromWishlist from './RemoveFromWishlist';
import RemoveGiftRestrictions from './RemoveGiftRestrictions';
import * as selectors from './selectors';

const karenUids = [
    'QRglez3j97bnkUMItHji6M2cKwN2', // Phone
    'qDoJc4gO2KXwcZZXSJlw54CnWX72' // Gmail
];

const mattFUids = [
    'dqjGC5mU1AQmK3v8G3UfbzDV9Q32', // Gmail
    '9KzftPLwUAZzN6wl6YaJXIvsqSp2' // Phone
]

const shouldShowPairings = (loggedInUserId, owner) => {
    // If Karen is the group owner and logged in
    if (karenUids.includes(loggedInUserId) && karenUids.includes(owner)) {
        return true
    }
    // If Karen is logged in and I'm the group owner
    if (karenUids.includes(loggedInUserId) && mattFUids.includes(owner)) {
        return true
    }
    if (mattFUids.includes(loggedInUserId)) {
        return true
    }
    return false
}

const getParticipantsOrder = (group, uid) => {
    if (group.status === constants.groupStatuses.PAIRINGS_ASSIGNED) {
        const myTarget = group.pairings[uid];
        return [uid, myTarget, ...group.participants.filter(x => x !== uid && x !== myTarget)];
    }
    return [uid, ...group.participants.filter(x => x !== uid)];
};

const isDateInFuture = date => {
    const providedDate = moment(Date.parse(date));
    const currentDate = moment();
    return providedDate.isAfter(currentDate);
};

// const getDate = d => {
//     if (!d) {
//         return '';
//     }
//     const castAsD = Date.parse(d);
//     return moment(castAsD).format('Do MMMM YYYY');
// };

const MyGroups = props => {
    const classes = makeStyles(materialStyles)();

    const [isAddingToWishlist, setIsAddingToWishlist] = React.useState(false);
    const [isRemovingFromWishlist, setIsRemovingFromWishlist] = React.useState(false);
    const [isViewingPairings, setIsViewingPairings] = React.useState(false);

    const toggleViewingPairings = () => setIsViewingPairings(!isViewingPairings);

    const [isAddingGiftRestrictions, setIsAddingGiftRestrictions] = React.useState(false);
    const [isRemovingGiftRestrictions,
        setIsRemovingGiftRestrictions] = React.useState(false);

    const cancelRemovingFromWishlish = () => setIsRemovingFromWishlist(false);

    const [wishlistItemToAdd, setWishlistItemToAdd] = React.useState('');
    const [wishlistItemToAddUrl, setWishlistItemToAddUrl] = React.useState('');

    const [newGiftRestriction, setNewGiftRestriction] = React.useState({ people: [], isOneWay: false });
    const [removedGiftRestrictions, setRemovedGiftRestrictions] = React.useState([]);

    const [isConfirmDeleteGroup, setIsConfirmDeleteGroup] = React.useState(false);
    const [confirmDeleteText, setConfirmDeleteText] = React.useState('');

    const [isConfirmLeaveGroup, setIsConfirmLeaveGroup] = React.useState(false);

    const [newAddress, setNewAddress] = React.useState();
    const [isAddingAddress, setIsAddingAddress] = React.useState(false);

    const [isViewingAddress, setIsViewingAddress] = React.useState(false);
    const [addressBeingViewed, setAddressBeingViewed] = React.useState('');
    const [userIdAddressBeingViewed, setUserIdAddressBeingViewed] = React.useState('');

    const [isKicking, setIsKicking] = React.useState(false);
    const [kickingText, setKickingText] = React.useState('');
    const [personBeingKicked, setPersonBeingKicked] = React.useState('');

    const [regenerateDate, setRegenerateDate] = React.useState(findNextChristmas());
    const [regeneratePriceRange, setRegeneratePriceRange] = React.useState(
        [0, 50]
    );
    const [isRegenerating, setIsRegenerating] = React.useState(false);
    const [isPriceRangeActive, setIsPriceRangeActive] = React.useState(false);

    const [isEditingDate, setIsEditingDate] = React.useState(false);
    const [newDate, setNewDate] = React.useState('');

    const [isEditingWishlist, setIsEditingWishlist] = React.useState(false);
    const [wishlistIndex, setWishlistIndex] = React.useState(-1);
    const [editWishlistName, setEditWishlistName] = React.useState('');
    const [editWishlistLink, setEditWishlistLink] = React.useState('');
    const [isInviting, setIsInviting] = React.useState(false);

    const [copyTextMessage, setCopyTextMessage] = React.useState('');
    const [isShowingDetails, setIsShowingDetails] = React.useState(false);

    const closeAddingToWishlist = () => {
        setIsAddingToWishlist(false);
        setWishlistItemToAdd('');
        setWishlistItemToAddUrl('');
    };

    const editWishlist = () => {
        props.editWishlistItemRequest(props.group.id, wishlistIndex,
            editWishlistName, editWishlistLink);
        setIsEditingWishlist(false);
    };

    const openEditWishlist = index => {
        setIsEditingWishlist(true);
        setWishlistIndex(index);
        const wishlistItem = props.group.wishlist[props.auth.uid][index];
        setEditWishlistName(wishlistItem.item);
        setEditWishlistLink(wishlistItem.url);
    };

    const closeEditingWishlist = () => {
        setIsEditingWishlist(false);
        setWishlistIndex(-1);
        setEditWishlistLink('');
        setEditWishlistName('');
    };

    const regenerateRequest = () => {
        props.regenerateGroupRequest(props.group.id,
            isPriceRangeActive ? regeneratePriceRange : null, regenerateDate);
        setIsRegenerating(false);
    };

    const closeRegenerating = () => {
        setIsRegenerating(false);
        setRegenerateDate(findNextChristmas());
        setRegeneratePriceRange([0, 50]);
    };

    const kickPerson = id => {
        setPersonBeingKicked(id);
        setIsKicking(true);
    };

    const closeIsKicking = () => {
        setIsKicking(false);
        setKickingText('');
        setPersonBeingKicked('');
    };

    const confirmKickRequest = () => {
        props.kickUserRequest(props.group.id, personBeingKicked);
        setIsKicking(false);
    };

    const closeAddingAddress = () => {
        setIsAddingAddress(false);
        setNewAddress('');
    };

    // const openAddingAddress = () => {
    //     setIsAddingAddress(true);
    //     setNewAddress(props.group?.addressMappings[props.auth.uid] || '');
    // };

    // const openEditingDate = () => {
    //     setNewDate(props.group.date);
    //     setIsEditingDate(true);
    // };

    const closeEditingDate = () => {
        setIsEditingDate(false);
        setNewDate('');
    };

    const confirmEditDateRequest = () => {
        props.editDateRequest(props.group.id, newDate);
        setIsEditingDate(false);
    };

    const closeConfirmDeleteGroup = () => {
        setIsConfirmDeleteGroup(false);
        setConfirmDeleteText('');
    };

    const [isConfirmingAssignPairings,
        setIsConfirmingAssingPairings] = React.useState(false);

    const onRemoveRestriction = restriction => {
        setRemovedGiftRestrictions([...removedGiftRestrictions, restriction]);
    };

    const cancelAddingGiftRestriction = () => setIsAddingGiftRestrictions(false);

    const addWishlistItem = React.useCallback(() => {
        props.addWishlistItemRequest(props.group?.id, wishlistItemToAdd, wishlistItemToAddUrl);
        // closeAddingToWishlist();
    }, [props, wishlistItemToAdd, wishlistItemToAddUrl]);

    const removeWishlistItems = items => {
        props.removeWishlistItemsRequest(props.group?.id, items);
        setIsRemovingFromWishlist(false);
    };

    const onGroupRestrictionAdd = React.useCallback(id => {
        if (newGiftRestriction.people.includes(id)) {
            setNewGiftRestriction({
                ...newGiftRestriction,
                people: newGiftRestriction.people.filter(x => x !== id)
            });
        } else {
            setNewGiftRestriction({
                ...newGiftRestriction,
                people: [...newGiftRestriction.people, id]
            });
        }
    }, [setNewGiftRestriction, newGiftRestriction]);

    const onGroupRestrictionToggleOneWay = React.useCallback(() => {
        const isOneWay = !newGiftRestriction.isOneWay;
        // if there's more than two selected and we're going to one-way, clear the selection
        const people = isOneWay && newGiftRestriction.people.length > 2
            ? []
            : newGiftRestriction.people;

        setNewGiftRestriction({
            ...newGiftRestriction,
            isOneWay,
            people,
        });
    }, [setNewGiftRestriction, newGiftRestriction]);

    const addGiftRestriction = React.useCallback(() => {
        props.addGiftRestrictionRequest(props.group.id, newGiftRestriction);
        setIsAddingGiftRestrictions(false);
    }, [props, newGiftRestriction]);

    const cancelRemovingGiftRestrictions = () => {
        setIsRemovingGiftRestrictions(false);
        setRemovedGiftRestrictions([]);
    };

    const confirmRemoveRequest = () => {
        props.removeGiftRestrictionRequests(props.group.id, removedGiftRestrictions);
        cancelRemovingGiftRestrictions();
    };

    const confirmAssignPairings = () => {
        setIsConfirmingAssingPairings(false);
        props.assignPairingsRequest(props.group.id);
    };

    const leaveGroup = () => {
        props.leaveGroupRequest(props.group.id);
        setIsConfirmLeaveGroup(false);
    };

    const addAddress = () => {
        props.addDeliveryAddressRequest(props.group.id, newAddress);
        setIsAddingAddress(false);
    };

    // const viewAddress = (address, userId) => {
    //     setAddressBeingViewed(address);
    //     setUserIdAddressBeingViewed(userId);
    //     setIsViewingAddress(true);
    // };

    const closeViewingAddress = () => {
        setIsViewingAddress(false);
        setAddressBeingViewed('');
        setUserIdAddressBeingViewed('');
    };

    const copyToClipBoard = async copyMe => {
        try {
            await navigator.clipboard.writeText(copyMe);
            setCopyTextMessage('Copied!');
        } catch (err) {
            setCopyTextMessage('Failed to copy!');
        }
    };

    const closeViewingInvite = () => {
        setIsInviting(false);
        setCopyTextMessage('');
    };

    React.useEffect(() => {
        if (!props.addingAddress) {
            setNewAddress(''); // CHANGE ME
        }
    }, [props.addingAddress]);

    React.useEffect(() => {
        if (!props.editingWishlistItem) {
            setWishlistIndex(-1);
            setEditWishlistLink('');
            setEditWishlistName('');
        }
    }, [props.editingWishlistItem]);

    React.useEffect(() => {
        if (!props.regeneratingGroup) {
            setRegenerateDate(findNextChristmas());
            setRegeneratePriceRange([0, 50]);
        }
    }, [props.regeneratingGroup]);

    React.useEffect(() => {
        if (!props.kickingUser) {
            setKickingText('');
            setPersonBeingKicked('');
        }
    }, [props.kickingUser]);

    React.useEffect(() => {
        if (!props.editingDate) {
            setNewDate(props.group?.date);
        }
        // eslint-disable-next-line
    }, [props.editingDate]);

    React.useEffect(() => {
        if (!props.addingItemToWishlist) {
            closeAddingToWishlist();
        }
    }, [props.addingItemToWishlist]);

    React.useEffect(() => {
        if (!props.addingGiftRestriction) {
            setNewGiftRestriction({ people: [], isOneWay: false });
        }
    }, [props.addingGiftRestriction, setNewGiftRestriction]);

    React.useEffect(() => {
        if (!props.removingGiftRestrictions) {
            setRemovedGiftRestrictions([]);
        }
    }, [props.removingGiftRestrictions]);

    const isMobile = useMediaQuery(`(max-width:${constants.mobileScreenSize}px)`);

    const { group } = props;

    if (!props.auth.uid) {
        return <Invited />;
    }

    if (!props.group?.participants.includes(props.auth.uid) && props.joiningGroup) {
        return (
            <Paper
                elevation={4}
                className={classNames({
                    [classes.paperNoPadding]: true,
                    [classes.halfWidth]: !isMobile
                })}
            >
                <div className={styles.joinWrapper}>
                    <div className={styles.joinGroup}>
                        {`You have been invited to join group ${props.group?.groupName}`}
                    </div>

                    <div className={styles.spinner}>
                        <Spinner />
                        <div className={styles.joinGroupMessage}>
                            Joining Group
                        </div>
                    </div>
                </div>
            </Paper>
        );
    }

    if (!props.group?.participants.includes(props.auth.uid) && !props.joiningGroup
    && props.group?.participants.length > 0) {
        return (
            <Paper
                elevation={4}
                className={classNames({
                    [classes.paperNoPadding]: true,
                    [classes.halfWidth]: !isMobile
                })}
            >
                <div className={styles.joinWrapper}>
                    <div className={styles.joinGroup}>
                        {`You have been invited to join group ${props.group?.groupName}`}
                    </div>

                    <div className={styles.joinGroupButton}>
                        <StyledButton
                            text="Join"
                            color="secondary"
                            disabled={props.joiningGroup}
                            onClick={() => props.joinGroupRequest(props.group.code)}
                        />
                    </div>
                </div>
            </Paper>
        );
    }

    if (!group) {
        if (!props.hasFetchedGroups) {
            return (
                <div className={styles.spinner}>
                    <Spinner />
                    <div className={styles.joinGroupMessage}>
                        Fetching Groups
                    </div>
                </div>
            );
        }
        props.redirectRequest(constants.URL.MY_GROUPS);
        return null;
    }

    const showRandomisePairings = props.group.status
    === constants.groupStatuses.WAITING_FOR_PAIRINGS
&& props.auth.uid === props.group.owner;

    return (
        <>
            <Paper
                elevation={4}
                className={classNames({
                    [classes.paperNoPadding]: true,
                    [classes.halfWidth]: !isMobile,
                    [classes.relative]: true
                })}
            >
                <div className={styles.groupInfo}>
                    <InfoIcon color="primary" fontSize="large" onClick={() => setIsShowingDetails(true)} />
                </div>
                <div className={styles.groupPartialInfoWrapper}>
                    <div className={styles.detailWrapper}>
                        <div className={styles.key}>
                            Group Name
                        </div>
                        <div className={styles.value}>
                            {group.groupName}
                        </div>
                    </div>
                    {props.group.owner === props.auth.uid
                    && (
                        <div className={styles.detailWrapper}>
                            <div className={styles.key}>
                                Group Code
                            </div>
                            <div className={styles.valueCode}>
                                {group.code}
                            </div>
                        </div>
                    )}
                </div>

                {!group.isNoPriceRange && props.group.owner === props.auth.uid && (
                    <div className={styles.detailWrapper}>
                        <div className={styles.key}>
                            Price Range
                        </div>
                        <div className={styles.value}>
                            {`£${group.priceMin} - £${group.priceMax}` }
                        </div>
                    </div>
                )}

                {/* <div className={styles.detailWrapper}>
                    <div className={styles.key}>
                        Manage Wishlist
                    </div>
                    <div className={styles.wishlistButtons}>
                        <div className={styles.addWishlistIcon}>
                            <AddCircleIcon color="primary" fontSize="large"
                            onClick={() => setIsAddingToWishlist(true)} />
                        </div>
                        <div className={styles.removeWishlistIcon}>
                            <RemoveIcon color="secondary" fontSize="large"
                            onClick={() => setIsRemovingFromWishlist(true)} />
                        </div>
                    </div>
                </div> */}

                {props.group.owner === props.auth.uid
                && props.group.status === constants.groupStatuses.WAITING_FOR_PAIRINGS && (
                    <div className={styles.detailWrapper}>
                        <div className={styles.key}>
                            {`Manage Gift Restrictions (${Object.keys(props.group?.restrictions)?.length})`}
                        </div>
                        <div className={styles.giftRestrictionButtons}>
                            <div className={styles.addGiftRestrictionIcon}>
                                <AddCircleIcon color="primary" fontSize="large" onClick={() => setIsAddingGiftRestrictions(true)} />
                            </div>
                            <div className={styles.removeGiftRestrictionIcon}>
                                <RemoveIcon color="secondary" fontSize="large" onClick={() => setIsRemovingGiftRestrictions(true)} />
                            </div>
                        </div>
                    </div>
                )}

                {/* <div
                    className={styles.addAddressWrapper}
                    onClick={openAddingAddress}
                    role="button"
                    tabIndex={0}
                >
                    <div className={styles.addAddressText}>
                        {props.group.addressMappings[props.auth.uid]
                            ? 'Edit Address' : 'Add Address'}
                    </div>
                    <div>
                        {props.group.addressMappings[props.auth.uid] ?
                            <EditIcon color="primary" fontSize="medium" />
                            : <AddCircleIcon color="primary" fontSize="large" />}
                    </div>
                </div> */}

                <div className={styles.detailWrapperStatuses}>
                    <div className={styles.key}>
                        Who am I getting a gift for?
                    </div>

                    {props.group.status === constants.groupStatuses.WAITING_FOR_PAIRINGS ? (
                        <div className={styles.waitForPairingsStatus}>
                            {`Waiting for ${mapIdToName(props.group.owner, props.group.displayNameMappings)} to randomise gift assignments`}
                        </div>
                    ) : (
                        <div className={styles.mySecretSantaTarget}>
                            {mapIdToName(props.group.pairings[props.auth.uid],
                                props.group.displayNameMappings)}
                        </div>
                    )}
                </div>

                {/* <div className={styles.detailWrapperStatusesDeadline}>
                    <div className={styles.editDateWrapper}>
                        <div className={styles.key}>
                            When is the deadline?
                        </div>

                        <div className={styles.waitForPairingsStatus}>
                            {getDate(props.group.date)}
                        </div>
                    </div>
                    {props.group.owner === props.auth.uid && (
                        <div
                            className={styles.editDateIcon}
                            onClick={openEditingDate}
                            role="button"
                            tabIndex={0}
                        >
                            <EditIcon color="primary" fontSize="medium" />
                        </div>
                    )}
                </div> */}

                {props.group.status === constants.groupStatuses.PAIRINGS_ASSIGNED
                && props.auth.uid === props.group.owner
                && !isDateInFuture(props.group.date) && (
                    <div className={styles.wishlistButton}>
                        <StyledButton
                            fullWidth
                            text="Regenerate group"
                            color="secondary"
                            onClick={() => setIsRegenerating(true)}
                        />
                    </div>
                )}
                <div className={styles.inviteWrapper}>
                    <div className={styles.wishlistButton}>
                        <StyledButton
                            fullWidth
                            text="Add wishlist item"
                            color="primary"
                            onClick={() => setIsAddingToWishlist(true)}
                        />
                    </div>
                    <div className={styles.wishlistButton}>
                        <StyledButton
                            fullWidth
                            text="Remove wishlist items"
                            color="secondary"
                            onClick={() => setIsRemovingFromWishlist(true)}
                        />
                    </div>
                    <div className={styles.wishlistButton}>
                        <StyledButton
                            fullWidth
                            color="primary"
                            onClick={() => setIsInviting(true)}
                            text="Invite"
                        />
                    </div>

                    {showRandomisePairings && (
                        <div className={styles.wishlistButton}>
                            <StyledButton
                                fullWidth
                                text="Randomise Pairings"
                                color="secondary"
                                onClick={() => setIsConfirmingAssingPairings(true)}
                            />
                        </div>
                    )}

                </div>
                {shouldShowPairings(props.auth.uid, props.group.owner)
                && (
                    <div className={styles.fadeWrapper}>
                        <Fade
                            checked={isViewingPairings}
                            includeCheckbox
                            onChange={toggleViewingPairings}
                            label="Show Pairings"
                        >
                            {props.group.status === constants.groupStatuses.PAIRINGS_ASSIGNED ? (
                                <div className={styles.pairingsWrapper}>
                                    {Object.keys(props.group.pairings).map(pairing => (
                                        <div className={styles.pairingsRow} key={pairing}>
                                            <div className={styles.pairingGiver}>
                                                {mapIdToName(pairing, group.displayNameMappings)}
                                            </div>
                                            <div>
                                                <ArrowRightAltIcon color="primary" />
                                            </div>
                                            <div className={styles.pairingGetter}>
                                                {mapIdToName(props.group.pairings[pairing],
                                                    group.displayNameMappings)}
                                            </div>
                                        </div>
                                    ))}
                                </div>
                            )
                                : (
                                    <div className={styles.noPairingsYet}>
                                        Pairings Not
                                        Assigned yet
                                    </div>
                                )}

                        </Fade>
                    </div>
                )}

            </Paper>

            {getParticipantsOrder(group, props.auth.uid).map((p, index) => (
                <Paper
                    elevation={4}
                    className={classNames({
                        [classes.paperNoPadding]: true,
                        [classes.paperTinyWidth]: !isMobile
                    })}
                    key={p}
                >
                    <div className={styles.participants}>
                        {props.group.owner === props.auth.uid && p !== props.auth.uid
                        && props.group.status !== constants.groupStatuses.PAIRINGS_ASSIGNED && (
                            <div className={styles.deleteWrapper}>
                                <DeleteIcon
                                    color={index % 2 === 0 ? 'primary' : 'secondary'}
                                    onClick={() => kickPerson(p)}
                                />
                            </div>
                        )}
                        <div className={styles.faceIcon}>
                            <FaceIcon className={classNames({
                                [classes.faceIconGreen]: index % 7 === 4,
                                [classes.faceIconRed]: index % 7 === 5,
                                [classes.faceIconBlue]: index % 7 === 6,
                                [classes.faceIconPurple]: index % 7 === 0,
                                [classes.faceIconGreen]: index % 7 === 1,
                                [classes.faceIconBrown]: index % 7 === 2,
                                [classes.faceIconGoldenrod]: index % 7 === 3
                            })}
                            />
                        </div>
                        <div className={styles.participantName}>
                            {mapIdToName(p, group.displayNameMappings)}
                        </div>
                        {/* <div className={styles.addressWrapper}>
                            <ContactsIcon
                                color={index % 2 === 0 ? 'primary' : 'secondary'}
                                onClick={() => viewAddress(props.group?.addressMappings[p], p)}
                            />
                        </div> */}
                    </div>
                    <div className={styles.wishlistWrapper}>
                        <div className={styles.wishlistHeader}>
                            Wishlist
                        </div>
                        {props.group.wishlist[p].length === 0 && (
                            <div className={styles.noWishlistText}>
                                Nothing added yet
                            </div>
                        )}
                        <ul className={styles.wishlistBulletPoints}>
                            {props.group.wishlist[p]?.map((wishlistItem, i) => (
                                <li key={wishlistItem.item}>
                                    <div className={classNames({
                                        [styles.wishlistRow]: true,
                                        [styles.blur]: index > 1 && props.group.hideWishlist
                                    })}
                                    >
                                        <div>
                                            {(wishlistItem.url && index <= 1) || !props.group.hideWishlist ? (
                                                <a target="_blank" rel="noopener noreferrer" href={wishlistItem.url}>{wishlistItem.item}</a>
                                            ) : wishlistItem.item}
                                        </div>
                                        {p === props.auth.uid
                                    && (
                                        <div
                                            className={styles.wishlistEdit}
                                            onClick={() => openEditWishlist(i)}
                                            role="button"
                                            tabIndex={0}
                                        >
                                            <EditIcon color="primary" fontSize="small" />
                                        </div>
                                    ) }
                                    </div>
                                </li>
                            ))}
                        </ul>
                    </div>
                </Paper>
            ))}

            <Paper
                elevation={4}
                className={classNames({
                    [classes.paperNoPadding]: true,
                    [classes.paperTinyWidth]: !isMobile
                })}
            >
                <div className={styles.buttonWrapper}>
                    <LoadingDiv isLoading={props.removingGiftRestrictions} isBorderRadius>
                        {props.group.owner === props.auth.uid && (
                            <StyledButton
                                color="primary"
                                onClick={() => setIsConfirmDeleteGroup(true)}
                                text="Delete Group"
                            />
                        )}

                        {props.group.status !== constants.groupStatuses.PAIRINGS_ASSIGNED
                        && (
                            <StyledButton
                                color="secondary"
                                onClick={() => setIsConfirmLeaveGroup(true)}
                                text="Leave group"
                            />
                        )}
                    </LoadingDiv>
                </div>
            </Paper>

            <SuccessModal
                backdrop
                closeModal={() => setIsAddingToWishlist(false)}
                isOpen={isAddingToWishlist || props.addingItemToWishlist}
                headerMessage="Add Item to Wishlist"
                toggleModal={() => setIsAddingToWishlist(false)}
            >
                <AddToWishlist
                    addingItemToWishlist={props.addingItemToWishlist}
                    addWishlistItem={addWishlistItem}
                    closeAddingToWishlist={closeAddingToWishlist}
                    wishlistItemToAdd={wishlistItemToAdd}
                    setWishlistItemToAdd={setWishlistItemToAdd}
                    wishlistItemToAddUrl={wishlistItemToAddUrl}
                    setWishlistItemToAddUrl={setWishlistItemToAddUrl}
                />
            </SuccessModal>

            <SuccessModal
                backdrop
                closeModal={() => setIsShowingDetails(false)}
                isOpen={isShowingDetails}
                headerMessage="Group Detaills"
                toggleModal={() => setIsShowingDetails(false)}
            >

                <div className={styles.groupPartialInfoWrapper}>
                    <div className={styles.detailWrapper}>
                        <div className={styles.key}>
                            Group Name
                        </div>
                        <div className={styles.value}>
                            {group.groupName}
                        </div>
                    </div>

                    <div className={styles.detailWrapper}>
                        <div className={styles.key}>
                            Group Owner
                        </div>
                        <div className={styles.valueCode}>
                            {mapIdToName(props.group.owner, props.group.displayNameMappings)}
                        </div>
                    </div>
                    <div className={styles.detailWrapper}>
                        <div className={styles.key}>
                            Group Code
                        </div>
                        <div className={styles.valueCode}>
                            {group.code}
                        </div>
                    </div>

                    {!group.isNoPriceRange && (
                        <div className={styles.detailWrapper}>
                            <div className={styles.key}>
                                Price Range
                            </div>
                            <div className={styles.value}>
                                {`£${group.priceMin} - £${group.priceMax}` }
                            </div>
                        </div>
                    )}
                </div>
            </SuccessModal>

            <SuccessModal
                backdrop
                closeModal={cancelRemovingFromWishlish}
                isOpen={isRemovingFromWishlist || props.removingItemsFromWishlist}
                headerMessage="Remove items"
                toggleModal={cancelRemovingFromWishlish}
            >
                <RemoveFromWishlist
                    cancelRemovingFromWishlish={cancelRemovingFromWishlish}
                    initialWishlistItems={props.group.wishlist[props.auth.uid]?.map(x => x.item)}
                    removeWishlistItems={removeWishlistItems}
                    removingItemsFromWishlist={props.removingItemsFromWishlist}
                />
            </SuccessModal>

            <SuccessModal
                backdrop
                closeModal={cancelAddingGiftRestriction}
                isOpen={isAddingGiftRestrictions || props.addingGiftRestriction}
                headerMessage="Add Gift Restrictions"
                toggleModal={cancelAddingGiftRestriction}
            >
                <AddGiftRestrictions
                    addGiftRestriction={addGiftRestriction}
                    addingGiftRestriction={props.addingGiftRestriction}
                    cancelAddingGiftRestriction={cancelAddingGiftRestriction}
                    displayNameMappings={group.displayNameMappings}
                    newGiftRestriction={newGiftRestriction}
                    onAddPerson={onGroupRestrictionAdd}
                    onToggleIsOneWay={onGroupRestrictionToggleOneWay}
                    participants={group.participants}
                />
            </SuccessModal>

            <SuccessModal
                backdrop
                closeModal={cancelRemovingGiftRestrictions}
                isOpen={isRemovingGiftRestrictions || props.removingGiftRestrictions}
                headerMessage="Remove Gift Restrictions"
                toggleModal={cancelRemovingGiftRestrictions}
            >
                <RemoveGiftRestrictions
                    cancelRemovingGiftRestrictions={cancelRemovingGiftRestrictions}
                    confirmRemoveRequest={confirmRemoveRequest}
                    displayNameMappings={group.displayNameMappings}
                    giftRestrictions={props.group.restrictions}
                    onRemoveRestriction={onRemoveRestriction}
                    removedGiftRestrictions={removedGiftRestrictions}
                    removingGiftRestrictions={props.removingGiftRestrictions}
                />
            </SuccessModal>

            <SuccessModal
                backdrop
                closeModal={() => setIsConfirmingAssingPairings(false)}
                isOpen={isConfirmingAssignPairings || props.assigningPairings}
                headerMessage="Randomise Pairings"
                toggleModal={() => setIsConfirmingAssingPairings(false)}
            >
                <div className={styles.confirmMessage}>
                    Once you confirm pairings, nobody else will be able to join the group!
                </div>

                <div className={styles.detailWrapperStatuses}>
                    <div className={styles.key}>
                        Group Members
                    </div>
                    <div className={classNames({
                        [styles.waitForPairingsStatus]: true,
                        [styles.scrollYConfirm]: props.group.participants.length > 15
                    })}
                    >
                        {props.group.participants.map(p => (
                            <div key={p}>
                                {mapIdToName(p, props.group.displayNameMappings)}
                            </div>
                        ))}
                    </div>
                </div>

                <div className={styles.buttonWrapper}>
                    <LoadingDiv isLoading={props.assigningPairings} isBorderRadius>
                        <StyledButton
                            color="primary"
                            onClick={confirmAssignPairings}
                            text="Confirm"
                            disabled={props.assigningPairings}
                        />
                        <StyledButton
                            color="secondary"
                            onClick={() => setIsConfirmingAssingPairings(false)}
                            text="Cancel"
                            disabled={props.assigningPairings}
                        />
                    </LoadingDiv>
                </div>

            </SuccessModal>

            <SuccessModal
                backdrop
                closeModal={closeConfirmDeleteGroup}
                isOpen={isConfirmDeleteGroup || props.deletingGroup}
                headerMessage="Confirm Delete Group"
                toggleModal={closeConfirmDeleteGroup}
            >
                <div className={styles.confirmDeleteMessage}>
                    Are you sure you want to delete the group? It cannot be undone.
                </div>
                <div>
                    <TextInput
                        value={confirmDeleteText}
                        onChange={setConfirmDeleteText}
                        label="Type delete to confirm"
                    />
                </div>

                <div className={styles.buttonWrapper}>
                    <LoadingDiv isLoading={props.deletingGroup} isBorderRadius>
                        <StyledButton
                            color="primary"
                            onClick={() => props.deleteGroupRequest(props.group.id)}
                            text="Delete"
                            disabled={confirmDeleteText.toLowerCase() !== 'delete' || props.deletingGroup}
                        />
                        <StyledButton
                            color="secondary"
                            onClick={closeConfirmDeleteGroup}
                            text="Cancel"
                            disabled={props.deletingGroup}
                        />
                    </LoadingDiv>
                </div>

            </SuccessModal>

            <SuccessModal
                backdrop
                closeModal={() => setIsConfirmLeaveGroup(false)}
                isOpen={isConfirmLeaveGroup || props.leavingGroup}
                headerMessage="Confirm Leave Group"
                toggleModal={() => setIsConfirmLeaveGroup(false)}
            >
                <div className={styles.confirmDeleteMessage}>
                    Are you sure you want to leave the group?
                </div>

                <div className={styles.buttonWrapper}>
                    <LoadingDiv isLoading={props.leavingGroup} isBorderRadius>
                        <StyledButton
                            color="primary"
                            onClick={leaveGroup}
                            text="Confirm Leave"
                            disabled={props.leavingGroup}
                        />
                        <StyledButton
                            color="secondary"
                            onClick={() => setIsConfirmLeaveGroup(false)}
                            text="Cancel"
                            disabled={props.leavingGroup}
                        />
                    </LoadingDiv>
                </div>

            </SuccessModal>

            <SuccessModal
                backdrop
                closeModal={closeAddingAddress}
                isOpen={isAddingAddress || props.addingAddress}
                headerMessage="Set Delivery Address"
                toggleModal={closeAddingAddress}
            >
                <div className={styles.confirmDeleteMessage}>
                    Please set your delivery address if necessary
                </div>
                <div>
                    <TextInput
                        value={newAddress}
                        onChange={setNewAddress}
                        label="Set your delivery address"
                    />
                </div>

                <div className={styles.buttonWrapper}>
                    <LoadingDiv isLoading={props.addingAddress} isBorderRadius>
                        <StyledButton
                            color="primary"
                            onClick={addAddress}
                            text="Set Address"
                            disabled={props.addingAddress}
                        />
                        <StyledButton
                            color="secondary"
                            onClick={closeAddingAddress}
                            text="Cancel"
                            disabled={props.addingAddress}
                        />
                    </LoadingDiv>
                </div>

            </SuccessModal>

            <SuccessModal
                backdrop
                closeModal={closeViewingAddress}
                isOpen={isViewingAddress}
                headerMessage={`${(mapIdToName(userIdAddressBeingViewed, props.group.displayNameMappings) || '')} Delivery Address`}
                toggleModal={closeViewingAddress}
            >
                <div className={styles.addressKey}>
                    {addressBeingViewed || 'Address not set yet'}
                </div>

            </SuccessModal>

            <SuccessModal
                backdrop
                closeModal={closeIsKicking}
                isOpen={isKicking || props.kickingUser}
                headerMessage={`Confirm kick ${(mapIdToName(personBeingKicked, props.group.displayNameMappings) || '')}`}
                toggleModal={closeIsKicking}
            >
                <div className={styles.confirmDeleteMessage}>
                    {`Are you sure you want to kick ${(mapIdToName(personBeingKicked, props.group.displayNameMappings) || '')}?`}
                </div>
                <div>
                    <TextInput
                        value={kickingText}
                        onChange={setKickingText}
                        label="Type kick to confirm"
                    />
                </div>

                <div className={styles.buttonWrapper}>
                    <LoadingDiv isLoading={props.kickingUser} isBorderRadius>
                        <StyledButton
                            color="primary"
                            onClick={confirmKickRequest}
                            text="Delete"
                            disabled={kickingText.toLowerCase() !== 'kick' || props.kickingUser}
                        />
                        <StyledButton
                            color="secondary"
                            onClick={closeIsKicking}
                            text="Cancel"
                            disabled={props.kickingUser}
                        />
                    </LoadingDiv>
                </div>

            </SuccessModal>

            <SuccessModal
                backdrop
                closeModal={closeRegenerating}
                isOpen={isRegenerating || props.regeneratingGroup}
                headerMessage="Regenerate group for next year"
                toggleModal={closeRegenerating}
            >
                {!isPriceRangeActive ? (
                    <div
                        className={styles.priceRangeToggle}
                        onClick={() => setIsPriceRangeActive(true)}
                        role="button"
                        tabIndex={0}
                    >
                        <div className={styles.iconWrapper}>
                            <AddIcon color="primary" />
                        </div>
                        <div className={styles.addPriceRange}>Add Price Range</div>
                    </div>
                ) : (
                    <div
                        className={styles.priceRangeToggle}
                        onClick={() => setIsPriceRangeActive(false)}
                        role="button"
                        tabIndex={0}
                    >
                        <div className={styles.iconWrapper}>
                            <RemoveIcon color="secondary" />
                        </div>
                        <div className={styles.addPriceRange}>Remove Price Range</div>
                    </div>
                )}

                <Fade checked={isPriceRangeActive}>
                    <div className={styles.sliderWrapper}>
                        <RangeSlider
                            priceRange={regeneratePriceRange}
                            setPriceRange={setRegeneratePriceRange}
                            min={0}
                            max={50}
                        />
                    </div>
                </Fade>
                <DatePicker
                    label="Event Date"
                    selectedDate={regenerateDate}
                    minDate={new Date()}
                    setSelectedDate={setRegenerateDate}
                    variant="inline"
                />

                <div className={styles.buttonWrapper}>
                    <LoadingDiv isLoading={props.regeneratingGroup} isBorderRadius>
                        <StyledButton
                            color="primary"
                            onClick={regenerateRequest}
                            text="Regenerate"
                            disabled={props.regeneratingGroup}
                        />
                        <StyledButton
                            color="secondary"
                            onClick={closeRegenerating}
                            text="Cancel"
                            disabled={props.regeneratingGroup}
                        />
                    </LoadingDiv>
                </div>

            </SuccessModal>

            <SuccessModal
                backdrop
                closeModal={closeEditingDate}
                isOpen={isEditingDate || props.editingDate}
                headerMessage="Edit Date"
                toggleModal={closeEditingDate}
            >
                <DatePicker
                    label="Event Date"
                    selectedDate={newDate}
                    minDate={new Date()}
                    setSelectedDate={setNewDate}
                    variant="inline"
                />

                <div className={styles.buttonWrapper}>
                    <LoadingDiv isLoading={props.editingDate} isBorderRadius>
                        <StyledButton
                            color="primary"
                            onClick={confirmEditDateRequest}
                            text="Edit Date"
                            disabled={props.editingDate}
                        />
                        <StyledButton
                            color="secondary"
                            onClick={closeEditingDate}
                            text="Cancel"
                            disabled={props.editingDate}
                        />
                    </LoadingDiv>
                </div>

            </SuccessModal>

            <SuccessModal
                backdrop
                closeModal={closeEditingWishlist}
                isOpen={isEditingWishlist || props.editingWishlistItem}
                headerMessage="Edit Wishlist"
                toggleModal={closeEditingWishlist}
            >
                <div className={classNames({
                    [styles.smallWidth]: !isMobile
                })}
                >
                    <TextInput
                        icon={textInputConstants.textInputIcons.present}
                        iconColor="primary"
                        value={editWishlistName}
                        onChange={setEditWishlistName}
                        label="Wishlist item"
                        disabled={props.editingWishlistItem}
                    />

                    <TextInput
                        icon={textInputConstants.textInputIcons.link}
                        iconColor="primary"
                        value={editWishlistLink}
                        onChange={setEditWishlistLink}
                        label="Link (optional)"
                        disabled={props.editingWishlistItem}
                    />

                </div>

                <div className={styles.buttonWrapper}>
                        <LoadingDiv isLoading={props.editingWishlistItem} isBorderRadius>
                        <div className={styles.wislistExtraButton}>
                            <StyledButton
                                fullWidth
                                color="primary"
                                onClick={editWishlist}
                                text="Edit Wishlist Item"
                                disabled={props.editingWishlistItem}
                            />
                        </div>
                        <div className={styles.wislistExtraButton}>
                            <StyledButton
                                fullWidth
                                color="secondary"
                                onClick={closeEditingWishlist}
                                text="Cancel"
                                disabled={props.editingWishlistItem}
                            />
                        </div>
                    </LoadingDiv>
                </div>

            </SuccessModal>

            <SuccessModal
                backdrop
                closeModal={closeViewingInvite}
                isOpen={isInviting}
                headerMessage="Invite somebody!"
                toggleModal={closeViewingInvite}
            >
                <div className={styles.inviteMessage}>
                    {`https://${process.env.REACT_APP_AUTH_DOMAIN + constants.URL.GROUP_DETAILS}/${props.group.id}`}
                </div>

                <div className={styles.copyTextButton}>
                    <StyledButton
                        text="Copy text!"
                        color="secondary"
                        onClick={() => copyToClipBoard(`https://${process.env.REACT_APP_AUTH_DOMAIN + constants.URL.GROUP_DETAILS}/${props.group.id}`)}
                    />
                </div>

                <div className={classNames({
                    [styles.copyTextMessage]: true,
                    [styles.copyTextInvisible]: !copyTextMessage
                })}
                >
                    {copyTextMessage || 'invisible'}
                </div>

            </SuccessModal>

        </>
    );
};

const mapDispatchToProps = {
    addDeliveryAddressRequest,
    addWishlistItemRequest,
    addGiftRestrictionRequest,
    assignPairingsRequest,
    deleteGroupRequest,
    editDateRequest,
    editWishlistItemRequest,
    joinGroupRequest,
    kickUserRequest,
    leaveGroupRequest,
    redirectRequest,
    regenerateGroupRequest,
    removeWishlistItemsRequest,
    removeGiftRestrictionRequests
};

const mapStateToProps = (state, props) => ({
    addingAddress: state.groupDetails.addingAddress,
    addingItemToWishlist: state.groupDetails.addingItemToWishlist,
    addingGiftRestriction: state.groupDetails.addingGiftRestriction,
    assigningPairings: state.groupDetails.assigningPairings,
    auth: state.firebase.auth,
    deletingGroup: state.groupDetails.deletingGroup,
    editingDate: state.groupDetails.editingDate,
    editingWishlistItem: state.groupDetails.editingWishlistItem,
    hasFetchedGroups: selectors.hasFetchedGroups(state),
    joiningGroup: state.myGroups.joiningGroup,
    kickingUser: state.groupDetails.kickingUser,
    leavingGroup: state.groupDetails.leavingGroup,
    regeneratingGroup: state.groupDetails.regeneratingGroup,
    group: selectors.getGroupFromId(state, props),
    removingItemsFromWishlist: state.groupDetails.removingItemsFromWishlist,
    removingGiftRestrictions: state.groupDetails.removingGiftRestrictions
});

export default compose(
    connect(mapStateToProps, mapDispatchToProps),
    firestoreConnect(() => [
        {
            collection: 'groups',
            storeAs: 'groups'
        }
    ])
)(MyGroups);
