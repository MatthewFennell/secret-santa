const admin = require('firebase-admin');
const functions = require('firebase-functions');
const _ = require('lodash');
const common = require('./common');
const constants = require('./constants');

const db = admin.firestore();

const operations = admin.firestore.FieldValue;

const objectToArray = obj => {
    const last = Object.keys(obj).sort().pop();
    return Array.from({ ...obj, length: last + 1 });
};

const restrictionsObjToArray = restrictions => objectToArray(restrictions).filter(x=>x);

const isSameRestriction = ({ people: aPeople, isOneWay: aOneWay }, { people: bPeople, isOneWay: bOneWay }) =>
    aOneWay === bOneWay && common.doArraysContainSameElements(aPeople, bPeople);

exports.createGroup = functions
    .region(constants.region)
    .https.onCall((data, context) => {
        common.isAuthenticated(context);

        if (!data.groupName) {
            throw new functions.https.HttpsError('invalid-argument', 'Must provide a group name');
        }

        if (data.groupName.length > 40) {
            throw new functions.https.HttpsError('invalid-argument', 'Max group name length is 40');
        }

        if (!data.code) {
            throw new functions.https.HttpsError('invalid-argument', 'Must provide a group code');
        }

        if (data.code.length > 20) {
            throw new functions.https.HttpsError('invalid-argument', 'Max code length is 20');
        }

        if (data.code.length < 6) {
            throw new functions.https.HttpsError('invalid-argument', 'Group code must be at least 6 characters');
        }

        if (!data.date) {
            throw new functions.https.HttpsError('invalid-argument', 'Must provide a date. Contact Matt!');
        }

        return db.collection('groups').where('code', '==', data.code).get().then(result => {
            if (result.size > 0) {
                throw new functions.https.HttpsError('invalid-argument', 'There is already a group with that code!');
            }
            return db.collection('users').doc(context.auth.uid).get().then(user => db.collection('groups').add({
                addressMappings: {},
                code: data.code,
                date: data.date,
                groupName: data.groupName,
                hideWishlist: Boolean(data.hideWishlist),
                isNoPriceRange: data.isNoPriceRange || false,
                status: constants.groupStatuses.WAITING_FOR_PAIRINGS,
                owner: context.auth.uid,
                participants: [context.auth.uid],
                pairings: {},
                priceMin: common.isNumber(data.min) ? data.min : null,
                priceMax: common.isNumber(data.max) ? data.max : null,
                restrictions: {},
                displayNameMappings: {
                    [context.auth.uid]: user.data().displayName
                },
                wishlist: {
                    [context.auth.uid]: []
                }
            }));
        });
    });

exports.joinGroup = functions
    .region(constants.region)
    .https.onCall((data, context) => {
        common.isAuthenticated(context);

        if (!data.code) {
            throw new functions.https.HttpsError('invalid-argument', 'Must provide a group code');
        }

        if (data.code.length < 6) {
            throw new functions.https.HttpsError('invalid-argument', 'Group code must be at least 6 characters');
        }

        return db.collection('groups').where('code', '==', data.code).get().then(docs => {
            if (docs.size === 0) {
                throw new functions.https.HttpsError('not-found', 'No group with that code exists');
            }

            if (docs.size > 1) {
                throw new functions.https.HttpsError('invalid-argument', 'Big error. Contact Matt');
            }

            if (docs.docs[0].data().status === constants.groupStatuses.PAIRINGS_ASSIGNED) {
                throw new functions.https.HttpsError('invalid-argument', 'This group has already started. Too late to join');
            }

            if (docs.docs[0].data().participants.includes(context.auth.uid)) {
                throw new functions.https.HttpsError('invalid-argument', 'You are already in that group!');
            }

            return db.collection('users').doc(context.auth.uid).get().then(user => {
                const userData = user.data();

                return docs.docs[0].ref.update({
                    participants: operations.arrayUnion(context.auth.uid),
                    displayNameMappings: {
                        ...docs.docs[0].data().displayNameMappings,
                        [context.auth.uid]: userData ? userData.displayName : ''
                    },
                    wishlist: {
                        ...docs.docs[0].data().wishlist,
                        [context.auth.uid]: []
                    }
                });
            });
        });
    });

exports.addGiftRestriction = functions
    .region(constants.region)
    .https.onCall((newData, context) => {
        common.isAuthenticated(context);

        // newData.restriction: { people: string[], isOneWay: boolean }

        if (_.get(newData, 'restriction.people', []).length < 2) {
            throw new functions.https.HttpsError('invalid-argument', 'Must provide a valid number of restrictions');
        }

        if (!newData.groupId) {
            throw new functions.https.HttpsError('invalid-argument', 'Must provide a group id. Contact Matt');
        }

        return db.collection('groups').doc(newData.groupId).get().then(doc => {
            const { restrictions } = doc.data();
            const restrictionsArray = restrictionsObjToArray(restrictions);

            if (restrictionsArray.length >= 10) {
                throw new functions.https.HttpsError('invalid-argument', 'Max of 10 restrictions');
            }

            if (context.auth.uid !== doc.data().owner) {
                throw new functions.https.HttpsError('unauthenticated', 'Only the group owner can add restrictions');
            }

            if (restrictionsArray.some(r => isSameRestriction(r, newData.restriction))) {
                throw new functions.https.HttpsError('invalid-argument', 'Cannot add duplicate group restrictions');
            }

            let minKey = 0;
            for (let x = 0; x < constants.maxGiftRestrictionGroups; x += 1) {
                if (!(x in restrictions)) {
                    minKey = x;
                    break;
                }
            }

            return doc.ref.update({
                restrictions: {
                    ...restrictions,
                    [minKey]: newData.restriction
                }
            });
        });
    });

exports.removeGiftRestrictions = functions
    .region(constants.region)
    .https.onCall((data, context) => {
        common.isAuthenticated(context);

        if (!data.restrictions || data.restrictions.length === 0) {
            throw new functions.https.HttpsError('invalid-argument', 'Must provide a valid number of restrictions');
        }

        if (!data.groupId) {
            throw new functions.https.HttpsError('invalid-argument', 'Must provide a group id. Contact Matt');
        }

        return db.collection('groups').doc(data.groupId).get().then(doc => {
            const getRemovedResult = (restrictions, removed) => Object
                .keys(restrictions)
                .reduce((acc, curKey) => {
                    const curRestriction = restrictions[curKey];

                    return removed.some(removedEntry => isSameRestriction(removedEntry, curRestriction))
                        ? acc
                        : {
                            ...acc,
                            [curKey]: curRestriction
                        }
                }, {});

            return doc.ref.update({
                restrictions: getRemovedResult(doc.data().restrictions, data.restrictions)
            });
        });
    });

exports.assignPairings = functions
    .region(constants.region)
    .https.onCall((data, context) => {
        common.isAuthenticated(context);

        if (!data.groupId) {
            throw new functions.https.HttpsError('invalid-argument', 'Must provide a group id. Contact Matt');
        }

        return db.collection('groups').doc(data.groupId).get().then(doc => {
            if (context.auth.uid !== doc.data().owner) {
                throw new functions.https.HttpsError('unauthenticated', 'Only the group owner can assign pairings');
            }

            if (doc.data().participants.length < 2) {
                throw new functions.https.HttpsError('invalid-argument', 'There are not enough people in the group yet');
            }

            const { restrictions, participants } = doc.data();

            const restrictionsArray = restrictionsObjToArray(restrictions);
            const pairings = common.generatePairings(restrictionsArray, participants);

            return doc.ref.update({
                pairings,
                status: constants.groupStatuses.PAIRINGS_ASSIGNED
            });
        });
    });

exports.deleteGroup = functions
    .region(constants.region)
    .https.onCall((data, context) => {
        common.isAuthenticated(context);

        if (!data.groupId) {
            throw new functions.https.HttpsError('invalid-argument', 'Must provide a group id. Contact Matt');
        }

        return db.collection('groups').doc(data.groupId).get().then(doc => {
            if (context.auth.uid !== doc.data().owner) {
                throw new functions.https.HttpsError('unauthenticated', 'Only the group owner can delete the group');
            }
            return doc.ref.delete();
        });
    });

exports.leaveGroup = functions
    .region(constants.region)
    .https.onCall((data, context) => {
        common.isAuthenticated(context);

        if (!data.groupId) {
            throw new functions.https.HttpsError('invalid-argument', 'Must provide a group id. Contact Matt');
        }

        return db.collection('groups').doc(data.groupId).get().then(doc => {
            if (context.auth.uid === doc.data().owner
            && doc.data().participants && doc.data().participants.length > 1) {
                throw new functions.https.HttpsError('invalid-argument', 'The group owner cannot leave if there are people left in the group');
            }

            if (doc.data().participants && doc.data().participants.length === 1) {
                return doc.ref.delete();
            }

            if (doc.data().status === constants.groupStatuses.PAIRINGS_ASSIGNED) {
                throw new functions.https.HttpsError('invalid-argument', 'The group has started. You cannot leave until it has finished');
            }

            return doc.ref.update({
                participants: operations.arrayRemove(context.auth.uid),
                displayNameMappings: _.omit(doc.data().displayNameMappings, context.auth.uid),
                wishlist: _.omit(doc.data().wishlist, context.auth.uid)
            });
        });
    });

exports.setAddress = functions
    .region(constants.region)
    .https.onCall((data, context) => {
        common.isAuthenticated(context);

        if (!data.groupId) {
            throw new functions.https.HttpsError('invalid-argument', 'Must provide a group id. Contact Matt');
        }

        return db.collection('groups').doc(data.groupId).get().then(doc => doc.ref.update({
            addressMappings: {
                ...doc.data().addressMappings,
                [context.auth.uid]: data.address || ''
            }
        }));
    });

exports.kickUser = functions
    .region(constants.region)
    .https.onCall((data, context) => {
        common.isAuthenticated(context);

        if (!data.groupId) {
            throw new functions.https.HttpsError('invalid-argument', 'Must provide a group id. Contact Matt');
        }

        if (!data.userId) {
            throw new functions.https.HttpsError('invalid-argument', 'Must provide a user id. Contact Matt');
        }

        return db.collection('groups').doc(data.groupId).get().then(doc => {
            if (doc.data().owner !== context.auth.uid) {
                throw new functions.https.HttpsError('unauthenticated', 'You must be the group owner to kick users');
            }

            if (doc.data().status === constants.groupStatuses.PAIRINGS_ASSIGNED) {
                throw new functions.https.HttpsError('invalid-argument', 'Cannot kick users once pairings have been assigned');
            }

            const restrictions = doc.data().restrictions;
            const newRestrictions = Object
                .keys(restrictions)
                .filter(cur => restrictions[cur])
                .reduce((acc, cur) => {
                    const { people, isOneWay } = restrictions[cur];
                    const filtered = people.filter(x => x !== data.userId);
                    if (filtered.length > 1) {
                        return {
                            ...acc,
                            [cur]: {
                                people: filtered,
                                isOneWay,
                            }
                        };
                    }
                    return acc;
                }, {});

            return doc.ref.update({
                addressMappings: _.omit(doc.data().addressMappings, data.userId),
                displayNameMappings: _.omit(doc.data().displayNameMappings, data.userId),
                participants: operations.arrayRemove(data.userId),
                restrictions: newRestrictions,
                wishlist: _.omit(doc.data().wishlist, data.userId)
            });
        });
    });


exports.regenerateGroup = functions
    .region(constants.region)
    .https.onCall((data, context) => {
        common.isAuthenticated(context);

        if (!data.date) {
            throw new functions.https.HttpsError('invalid-argument', 'Must provide a date. Contact Matt!');
        }

        if (!data.groupId) {
            throw new functions.https.HttpsError('invalid-argument', 'Must provide a group id. Contact Matt');
        }

        if (!common.isDateInFuture(data.date)) {
            throw new functions.https.HttpsError('invalid-argument', 'Must provide a date in the future');
        }

        return db.collection('groups').doc(data.groupId).get().then(doc => doc.ref.update({
            date: data.date,
            isNoPriceRange: data.isNoPriceRange || false,
            status: constants.groupStatuses.WAITING_FOR_PAIRINGS,
            pairings: {},
            priceMin: common.isNumber(data.min) ? data.min : null,
            priceMax: common.isNumber(data.max) ? data.max : null,
            restrictions: {},
            wishlist: Object.keys(doc.data().wishlist).reduce((acc, cur) => ({
                ...acc,
                [cur]: []
            }), {})
        }));
    });

exports.editDate = functions
    .region(constants.region)
    .https.onCall((data, context) => {
        common.isAuthenticated(context);

        if (!data.date) {
            throw new functions.https.HttpsError('invalid-argument', 'Must provide a date. Contact Matt!');
        }

        if (!data.groupId) {
            throw new functions.https.HttpsError('invalid-argument', 'Must provide a group id. Contact Matt');
        }

        if (!common.isDateInFuture(data.date)) {
            throw new functions.https.HttpsError('invalid-argument', 'Must provide a date in the future');
        }

        return db.collection('groups').doc(data.groupId).update({
            date: data.date
        });
    });
