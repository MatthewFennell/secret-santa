const functions = require('firebase-functions');
const moment = require('moment');
const _ = require('lodash');
const fp = require('lodash/fp');
const constants = require('./constants');

module.exports.isAuthenticated = context => {
    if (!context.auth) {
        throw new functions.https.HttpsError('unauthenticated', 'You must be authenticated to call this function');
    }
};

module.exports.isNumber = value => Boolean((Number(value) && value) >= 0 || Number(value) === 0);

module.exports.doArraysContainSameElements = (arr, arrTwo) => _.xor(arr, arrTwo).length === 0;

const calculateMyRestriction = (person, restrictions) =>
    restrictions.reduce((acc, cur) => {
        if (cur.isOneWay) {
            // cur.people[0] can't buy for cur.people[1],
            // but vice-versa is fine
            if (cur.people[0] === person) {
                return [...acc, cur.people[1]];
            }
        } else {
            if (cur.people.includes(person)) {
                return _.uniq([...acc, ...cur.people]);
            }
        }
        return acc;
    }, [person]);


const generateReceivers = (restrictions, participants) =>
    participants.map(person => {
        const restricted = calculateMyRestriction(person, restrictions);

        return participants.filter(x => !restricted.includes(x));
    });

// // https://pastebin.com/a7yCDf95
module.exports.generatePairings = (restrictions, participants) => {
    const receivers = generateReceivers(restrictions, participants);

    const pairings = {};
    let taken = [];
    const start = _.sample(receivers[0]);
    taken.push(start);
    pairings[participants[0]] = start;

    let repeat = 0;

    while (taken.length < participants.length) {
        repeat += 1;
        if (repeat > 1000) {
            throw new functions.https.HttpsError('invalid-argument', 'Unable to find a pairing that satisfies the restrictions');
        }
        for (let x = 1; x < participants.length; x += 1) {
            const possible = receivers[x];

            const newPossible = possible.filter(x => !taken.includes(x));
            if (newPossible.length) {
                const chosen = _.sample(newPossible);
                taken.push(chosen);
                pairings[participants[x]] = chosen;
            } else {
                taken = [taken[0]];
            }
        }
    }
    return pairings;
};

module.exports.isDateInFuture = date => {
    const providedDate = moment(Date.parse(date));
    const currentDate = moment();
    return providedDate.isAfter(currentDate);
};
