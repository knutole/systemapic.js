// moment.locale('fr', {
//     months : "janvier_février_mars_avril_mai_juin_juillet_août_septembre_octobre_novembre_décembre".split("_"),
//     monthsShort : "janv._févr._mars_avr._mai_juin_juil._août_sept._oct._nov._déc.".split("_"),
//     weekdays : "dimanche_lundi_mardi_mercredi_jeudi_vendredi_samedi".split("_"),
//     weekdaysShort : "dim._lun._mar._mer._jeu._ven._sam.".split("_"),
//     weekdaysMin : "Di_Lu_Ma_Me_Je_Ve_Sa".split("_"),
//     longDateFormat : {
//         LT : "HH:mm",
//         LTS : "HH:mm:ss",
//         L : "DD/MM/YYYY",
//         LL : "D MMMM YYYY",
//         LLL : "D MMMM YYYY LT",
//         LLLL : "dddd D MMMM YYYY LT"
//     },
//     calendar : {
//         sameDay: "[Aujourd'hui à] LT",
//         nextDay: '[Demain à] LT',
//         nextWeek: 'dddd [à] LT',
//         lastDay: '[Hier à] LT',
//         lastWeek: 'dddd [dernier à] LT',
//         sameElse: 'L'
//     },
//     relativeTime : {
//         future : "dans %s",
//         past : "il y a %s",
//         s : "quelques secondes",
//         m : "une minute",
//         mm : "%d minutes",
//         h : "une heure",
//         hh : "%d heures",
//         d : "un jour",
//         dd : "%d jours",
//         M : "un mois",
//         MM : "%d mois",
//         y : "une année",
//         yy : "%d années"
//     },
//     ordinalParse : /\d{1,2}(er|ème)/,
//     ordinal : function (number) {
//         return number + (number === 1 ? 'er' : 'ème');
//     },
//     meridiemParse: /PD|MD/,
//     isPM: function (input) {
//         return input.charAt(0) === 'M';
//     },
//     // in case the meridiem units are not separated around 12, then implement
//     // this function (look at locale/id.js for an example)
//     // meridiemHour : function (hour, meridiem) {
//     //     return /* 0-23 hour, given meridiem token and hour 1-12 */
//     // },
//     meridiem : function (hours, minutes, isLower) {
//         return hours < 12 ? 'PD' : 'MD';
//     },
//     week : {
//         dow : 1, // Monday is the first day of the week.
//         doy : 4  // The week that contains Jan 4th is the first week of the year.
//     }
// });

moment.locale('no', {
    months : "januar_februar_mars_april_mai_juni_juli_august_september_oktober_november_desember".split("_"),
    monthsShort : "jan._feb._mars_apr._mai_juni_juli_aug._sept._okt._nov._des.".split("_"),
    weekdays : "søndag_mandag_tirsdag_onsdag_torsdag_fredag_lørdag".split("_"),
    weekdaysShort : "man._tirs._ons._tors._fre._lør._søn".split("_"),
    weekdaysMin : "Ma_Ti_On_To_Fr_Lø_Sø".split("_"),
    longDateFormat : {
        LT : "HH:mm",
        LTS : "HH:mm:ss",
        L : "DD/MM/YYYY",
        LL : "D MMMM YYYY",
        LLL : "D MMMM YYYY LT",
        LLLL : "D dddd MMMM YYYY LT"
    },
    calendar : {
        sameDay: "[I dag kl.] LT",
        nextDay: '[I morgen kl.] LT',
        nextWeek: 'dddd [kl.] LT',
        lastDay: '[I går kl.] LT',
        lastWeek: '[forrige] dddd LT',
        sameElse: 'L'
    },
    relativeTime : {
        future : "om %s",
        past : "for %s siden",
        s : "noen sekunder",
        m : "et minutt",
        mm : "%d minutt",
        h : "en time",
        hh : "%d timer",
        d : "en dag",
        dd : "%d dager",
        M : "en månded",
        MM : "%d måneder",
        y : "et år",
        yy : "%d år"
    },
    ordinalParse : /\d{1,2}(.|.)/,
    ordinal : function (number) {
        return number + (number === 1 ? '.' : '.');
    },
    meridiemParse: /PD|MD/,
    isPM: function (input) {
        return input.charAt(0) === 'M';
    },
    // in case the meridiem units are not separated around 12, then implement
    // this function (look at locale/id.js for an example)
    // meridiemHour : function (hour, meridiem) {
    //     return /* 0-23 hour, given meridiem token and hour 1-12 */
    // },
    meridiem : function (hours, minutes, isLower) {
        return hours < 12 ? 'PD' : 'MD';
    },
    week : {
        dow : 1, // Monday is the first day of the week.
        doy : 4  // The week that contains Jan 4th is the first week of the year.
    }
});