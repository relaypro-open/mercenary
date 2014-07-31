'use strict';

var //---------------
    //    Imports
    //---------------

    lang = require('./lang'),

    len = lang.len,
    floor = lang.floor,
    round = lang.round,
    random = lang.random,
    char = lang.char,

    //----------------------
    //    Implementation
    //----------------------

    // Generate a random floating point number in the given range
    // (exclusive on the high end).
    number = function(low, high) {
        var swap;

        if (low > high) {
            swap = low;
            low = high;
            high = swap;
        }
        return low + (random() * (high - low));
    },

    // Generate a random integer in the given range
    // (exclusive on the high end).
    integer = function(low, high) {
        return floor(number(low, high));
    },

    // Generate a random string with the given length from the given
    // alphabet. The alphabet defaults to all digits and all upper- and
    // lower-case ASCII letters.
    string = function(length, alphabet) {
        var string = '',
            alphabetLength;

        length = round(length < 0.5 ? 1 : length);
        alphabet = alphabet || '0123456789ABCDEFGHIJKLMNOPQRSTUVWXYZabcdefghijklmnopqrstuvwxyz';
        alphabetLength = len(alphabet);
        while (len(string) < length) {
            string += char(alphabet, integer(0, alphabetLength));
        }
        return string;
    };

module.exports = {
    number: number,
    integer: integer,
    string: string
};
