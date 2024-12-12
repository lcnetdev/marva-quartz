//from https://git.loc.gov/lcap/aws-lcap/ui-lcap-productivity-tools/-/blob/issue-001/lcap-productivity-tools/src/components/auto-dewey/instance-selected/lccall-to-dewey.js?ref_type=heads

import lccDeweyMap from "@/lib/LCCtoDewey.json"


export default function LcCallToDewey({ lcCall, parentPhone }) {

    if (!lcCall) return

    //this if for Px class, for GV uses 'GV Bio'
    const autoDeweyGenres = ['fiction', 'poetry', 'drama']
    const [autoDeweyGenre, setAutoDeweyGenre] = useState();
    const [autoDeweyResult, setAutoDeweyResult] = useState();

    const lccsWithLocalLogics = ['PG', 'PH', 'PQ', 'PR', 'PS', 'PT', 'GV']

    //autoDewey mode
    const convertLccWithLocalLogics = (letter, number) => {
        //these are basically copy and pasted form VBA

        const Left = (str, numChars) => {
            return str.substring(0, numChars)
        }

        const Mid = (str, start, numChars) => {
            const indexStart = start - 1
            const indexEnd = indexStart + numChars
            return str.substring(indexStart, indexEnd)
        }

        const Val = (val) => {
            return Number(val)
        }

        const Len = (str) => {
            return str.length
        }

        const InStr = (str, subStr) => {
            return str.includes(subStr) ? 1 : 0
        }

        const IsNumeric = (val) => {
            const testResult = Number(val)
            return Number.isNaN(testResult) ? false : true
        }

        let sDewey$
        let sGenre$
        let sCountry$
        const Period1 = {}
        const Period2 = {}
        const Period3 = {}
        const Period4 = {}
        const Period5 = {}

        //https://git.loc.gov/ilspo/voyager-desktop-applications/-/blob/master/AutoDewey/AutoDewey.frm#L223
        const _convertClassPgDrama = (sClassNo$) => {
            if (Left(sClassNo$, 2) == "PG") {
                if (Val(Mid(sClassNo$, 3, 4)) > 3299 && Val(Mid(sClassNo$, 3, 4)) < 3309) {
                    sDewey$ = "891.72/1"
                } else if (Val(Mid(sClassNo$, 3, 4)) > 3309 && Val(Mid(sClassNo$, 3, 4)) < 3320) {
                    sDewey$ = "891.72/2"
                } else if (Val(Mid(sClassNo$, 3, 4)) > 3319 && Val(Mid(sClassNo$, 3, 4)) < 3448) {
                    sDewey$ = "891.72/3"
                } else if (Val(Mid(sClassNo$, 3, 4)) > 3449 && Val(Mid(sClassNo$, 3, 4)) < 3471) {
                    sDewey$ = "891.72/3"
                } else if (Val(Mid(sClassNo$, 3, 4)) > 3474 && Val(Mid(sClassNo$, 3, 4)) < 3477) {
                    // Call ButtonsToPeriod
                    sDewey$ = "Period1917"
                    Period1.Caption = "Period 1917-1945"
                    Period2.Caption = "Period 1945-1991"
                    sGenre$ = "Drama"
                    sCountry$ = "Russia"
                } else if (Val(Mid(sClassNo$, 3, 4)) > 3476 && Val(Mid(sClassNo$, 3, 4)) < 3491) {
                    // Call ButtonsToPeriod
                    sDewey$ = "Period1945"
                    Period1.Caption = "Period 1945-1991"
                    Period2.Caption = "Period 1991-"
                    sGenre$ = "Drama"
                    sCountry$ = "Russia"
                } else if (Val(Mid(sClassNo$, 3, 6)) > 3491.1 && Val(Mid(sClassNo$, 3, 7)) < 3493.97) {
                    sDewey$ = "891.72/5"
                } else if (Val(Mid(sClassNo$, 3, 4)) == 8721) {
                    // Call ButtonsToPeriod
                    sDewey$ = "Period1800"
                    Period1.Caption = "Period to 1799"
                    Period2.Caption = "Period 1800-1899"
                    Period3.Caption = "Period 1900-1991"
                    sGenre$ = "Drama"
                    sCountry$ = "Lithuania"
                } else if (Val(Mid(sClassNo$, 3, 4)) > 8721 && Val(Mid(sClassNo$, 3, 6)) < 8722.37) {
                    // Call ButtonsToPeriod
                    sDewey$ = "Period1900"
                    Period1.Caption = "Period 1900-1991"
                    Period2.Caption = "Period 1991-"
                    sGenre$ = "Drama"
                    sCountry$ = "Lithuania"
                } else if (Val(Mid(sClassNo$, 3, 4)) > 8722 && Val(Mid(sClassNo$, 3, 6)) < 8723.37) {
                    sDewey$ = "891/.9224"
                } else if (Val(Mid(sClassNo$, 3, 4)) == 9048) {
                    // Call ButtonsToPeriod
                    sDewey$ = "Period1800"
                    Period1.Caption = "To 1799"
                    Period2.Caption = "Period 1800-1899"
                    Period3.Caption = "Period 1900-1991"
                    sGenre$ = "Drama"
                    sCountry$ = "Latvia"
                } else if (Val(Mid(sClassNo$, 3, 4)) > 9048 && Val(Mid(sClassNo$, 3, 6)) < 9049.37) {
                    // Call ButtonsToPeriod
                    sDewey$ = "Period1900"
                    Period1.Caption = "Period 1900-1991"
                    Period2.Caption = "Period 1991-"
                    sGenre$ = "Drama"
                    sCountry$ = "Latvia"
                } else if (Val(Mid(sClassNo$, 3, 4)) > 9049 && Val(Mid(sClassNo$, 3, 6)) < 9050.37) {
                    sDewey$ = "891/.9324"
                }
            }
        }

        const _convertClassPgFiction = (sClassNo$) => {

            if (Val(Mid(sClassNo$, 3, 4)) > 3299 && Val(Mid(sClassNo$, 3, 4)) < 3309) {
                sDewey$ = "891.73/1"
            } else if (Val(Mid(sClassNo$, 3, 4)) > 3309 && Val(Mid(sClassNo$, 3, 4)) < 3320) {
                sDewey$ = "891.73/2"
            } else if (Val(Mid(sClassNo$, 3, 4)) > 3319 && Val(Mid(sClassNo$, 3, 4)) < 3448) {
                sDewey$ = "891.73/3"
            } else if (Val(Mid(sClassNo$, 3, 4)) > 3449 && Val(Mid(sClassNo$, 3, 4)) < 3471) {
                sDewey$ = "891.73/3"
            } else if (Val(Mid(sClassNo$, 3, 4)) > 3474 && Val(Mid(sClassNo$, 3, 4)) < 3477) {
                sDewey$ = "Period1917"
                Period1.Caption = "Period 1917-1945"
                Period2.Caption = "Period 1945-1991"
                sGenre$ = "Fiction"
                sCountry$ = "Russia"
            } else if (Val(Mid(sClassNo$, 3, 4)) > 3476 && Val(Mid(sClassNo$, 3, 4)) < 3491) {
                sDewey$ = "Period1945"
                Period1.Caption = "Period 1945-1991"
                Period2.Caption = "Period 1991-"
                sGenre$ = "Fiction"
                sCountry$ = "Russia"
            } else if (Val(Mid(sClassNo$, 3, 6)) > 3491.1 && Val(Mid(sClassNo$, 3, 7)) < 3493.97) {
                sDewey$ = "891.73/5"
            } else if (Val(Mid(sClassNo$, 3, 4)) == 8721) {
                sDewey$ = "Period1800"
                Period1.Caption = "To 1799"
                Period2.Caption = "Period 1800-1899"
                Period3.Caption = "Period 1900-1991"
                sGenre$ = "Fiction"
                sCountry$ = "Lithuania"
            } else if (Val(Mid(sClassNo$, 3, 4)) > 8721 && Val(Mid(sClassNo$, 3, 6)) < 8722.37) {
                sDewey$ = "Period1900"
                Period1.Caption = "Period 1900-1991"
                Period2.Caption = "Period 1991-"
                sGenre$ = "Fiction"
                sCountry$ = "Lithuania"
            } else if (Val(Mid(sClassNo$, 3, 4)) > 8722 && Val(Mid(sClassNo$, 3, 6)) < 8723.37) {
                sDewey$ = "891/.9234"
            } else if (Val(Mid(sClassNo$, 3, 4)) == 9048) {
                sDewey$ = "Period1800"
                Period1.Caption = "To 1799"
                Period2.Caption = "Period 1800-1899"
                Period3.Caption = "Period 1900-1991"
                sGenre$ = "Fiction"
                sCountry$ = "Latvia"
            } else if (Val(Mid(sClassNo$, 3, 4)) > 9048 && Val(Mid(sClassNo$, 3, 6)) < 9049.37) {
                sDewey$ = "Period1900"
                Period1.Caption = "Period 1900-1991"
                Period2.Caption = "Period 1991-"
                sGenre$ = "Fiction"
                sCountry$ = "Latvia"
            } else if (Val(Mid(sClassNo$, 3, 4)) > 9049 && Val(Mid(sClassNo$, 3, 6)) < 9050.37) {
                sDewey$ = "891/.9334"
            }
        }

        const _convertClassPgPoetry = (sClassNo$) => {
            if (Val(Mid(sClassNo$, 3, 4)) > 3299 && Val(Mid(sClassNo$, 3, 4)) < 3309) {
                sDewey$ = "891.71/1"
            } else if (Val(Mid(sClassNo$, 3, 4)) > 3309 && Val(Mid(sClassNo$, 3, 4)) < 3320) {
                sDewey$ = "891.71/2"
            } else if (Val(Mid(sClassNo$, 3, 4)) > 3319 && Val(Mid(sClassNo$, 3, 4)) < 3448) {
                sDewey$ = "891.71/3"
            } else if (Val(Mid(sClassNo$, 3, 4)) > 3449 && Val(Mid(sClassNo$, 3, 4)) < 3471) {
                sDewey$ = "891.71/3"
            } else if (Val(Mid(sClassNo$, 3, 4)) > 3474 && Val(Mid(sClassNo$, 3, 4)) < 3477) {
                sDewey$ = "Period1917"
                Period1.Caption = "Period 1917-1945"
                Period2.Caption = "Period 1945-1991"
                sGenre$ = "Poetry"
                sCountry$ = "Russia"
            } else if (Val(Mid(sClassNo$, 3, 4)) > 3476 && Val(Mid(sClassNo$, 3, 4)) < 3491) {
                sDewey$ = "Period1945"
                Period1.Caption = "Period 1945-1991"
                Period2.Caption = "Period 1991-"
                sGenre$ = "Poetry"
                sCountry$ = "Russia"
            } else if (Val(Mid(sClassNo$, 3, 6)) > 3491.1 && Val(Mid(sClassNo$, 3, 7)) < 3493.97) {
                sDewey$ = "891.71/5"
            } else if (Val(Mid(sClassNo$, 3, 4)) == 8721) {
                sDewey$ = "Period1800"
                Period1.Caption = "To 1799"
                Period2.Caption = "Period 1800-1899"
                Period3.Caption = "Period 1900-1991"
                sGenre$ = "Poetry"
                sCountry$ = "Lithuania"
            } else if (Val(Mid(sClassNo$, 3, 4)) > 8721 && Val(Mid(sClassNo$, 3, 6)) < 8722.37) {
                sDewey$ = "Period1900"
                Period1.Caption = "Period 1900-1991"
                Period2.Caption = "Period 1991-"
                sGenre$ = "Poetry"
                sCountry$ = "Lithuania"
            } else if (Val(Mid(sClassNo$, 3, 4)) > 8722 && Val(Mid(sClassNo$, 3, 6)) < 8723.37) {
                sDewey$ = "891/.9214"
            } else if (Val(Mid(sClassNo$, 3, 4)) == 9048) {
                sDewey$ = "Period1800"
                Period1.Caption = "To 1799"
                Period2.Caption = "Period 1800-1899"
                Period3.Caption = "Period 1900-1991"
                sGenre$ = "Poetry"
                sCountry$ = "Latvia"
            } else if (Val(Mid(sClassNo$, 3, 4)) > 9048 && Val(Mid(sClassNo$, 3, 6)) < 9049.37) {
                sDewey$ = "Period1900"
                Period1.Caption = "Period 1900-1991"
                Period2.Caption = "Period 1991-"
                sGenre$ = "Poetry"
                sCountry$ = "Latvia"
            } else if (Val(Mid(sClassNo$, 3, 4)) > 9049 && Val(Mid(sClassNo$, 3, 6)) < 9050.37) {
                sDewey$ = "891/.9314"
            }
        }

        const _convertClassPhDrama = (sClassNo$) => {
            if (Val(Mid(sClassNo$, 3, 3)) == 353) {
                sDewey$ = "894/.54121"
            } else if (Val(Mid(sClassNo$, 3, 3)) == 355) {
                sDewey$ = "Period1800"
                Period1.Caption = "Period 1800-1899"
                Period2.Caption = "Period 1900-1999"
                sGenre$ = "Drama"
                sCountry$ = "Finland"
            } else if (Val(Mid(sClassNo$, 3, 3)) == 356) {
                sDewey$ = "894/.54124"
            } else if (Val(Mid(sClassNo$, 3, 3)) == 665) {
                sDewey$ = "Period1800"
                Period1.Caption = "Period to 1861"
                Period2.Caption = "Period 1861-1991"
                sGenre$ = "Drama"
                sCountry$ = "Estonia"
            } else if (Val(Mid(sClassNo$, 3, 3)) > 665 && Val(Mid(sClassNo$, 3, 5)) < 666.37) {
                sDewey$ = "Period1900"
                Period1.Caption = "Period 1861-1991"
                Period2.Caption = "Period 1991-"
                sGenre$ = "Drama"
                sCountry$ = "Estonia"
            } else if (Val(Mid(sClassNo$, 3, 3)) > 666 && Val(Mid(sClassNo$, 3, 5)) < 667.37) {
                sDewey$ = "894/.54523"
            }
        }

        const _convertClassPhFiction = (sClassNo$) => {
            if (Val(Mid(sClassNo$, 3, 3)) == 353) {
                sDewey$ = "894/.54131"
            } else if (Val(Mid(sClassNo$, 3, 3)) == 355) {
                sDewey$ = "Period1800"
                Period1.Caption = "Period 1800-1899"
                Period2.Caption = "Period 1900-1999"
                sGenre$ = "Fiction"
                sCountry$ = "Finland"
            } else if (Val(Mid(sClassNo$, 3, 3)) == 356) {
                sDewey$ = "894/.54134"
            } else if (Val(Mid(sClassNo$, 3, 3)) == 665) {
                sDewey$ = "Period1800"
                Period1.Caption = "Period to 1861"
                Period2.Caption = "Period 1861-1991"
                sGenre$ = "Fiction"
                sCountry$ = "Estonia"
            } else if (Val(Mid(sClassNo$, 3, 3)) > 665 && Val(Mid(sClassNo$, 3, 5)) < 666.37) {
                sDewey$ = "Period1900"
                Period1.Caption = "Period 1861-1991"
                Period2.Caption = "Period 1991-"
                sGenre$ = "Fiction"
                sCountry$ = "Estonia"
            } else if (Val(Mid(sClassNo$, 3, 3)) > 666 && Val(Mid(sClassNo$, 3, 5)) < 667.37) {
                sDewey$ = "894/.54533"
            }
        }

        const _convertClassPhPoetry = (sClassNo$) => {
            if (Val(Mid(sClassNo$, 3, 3)) == 353) {
                sDewey$ = "894/.54111"
            } else if (Val(Mid(sClassNo$, 3, 3)) == 355) {
                sDewey$ = "Period1800"
                Period1.Caption = "Period 1800-1899"
                Period2.Caption = "Period 1900-1999"
                sGenre$ = "Poetry"
                sCountry$ = "Finland"
            } else if (Val(Mid(sClassNo$, 3, 3)) == 356) {
                sDewey$ = "894/.54114"
            } else if (Val(Mid(sClassNo$, 3, 3)) == 665) {
                sDewey$ = "Period1800"
                Period1.Caption = "Period to 1861"
                Period2.Caption = "Period 1861-1991"
                sGenre$ = "Poetry"
                sCountry$ = "Estonia"
            } else if (Val(Mid(sClassNo$, 3, 3)) > 665 && Val(Mid(sClassNo$, 3, 5)) < 666.37) {
                sDewey$ = "Period1900"
                Period1.Caption = "Period 1861-1991"
                Period2.Caption = "Period 1991-"
                sGenre$ = "Poetry"
                sCountry$ = "Estonia"
            } else if (Val(Mid(sClassNo$, 3, 3)) > 666 && Val(Mid(sClassNo$, 3, 5)) < 667.37) {
                sDewey$ = "894/.54513"
            }
        }

        const _convertClassPqDrama = (sClassNo$) => {
            if (Val(Mid(sClassNo$, 3, 6)) > 1410.1 && Val(Mid(sClassNo$, 3, 4)) < 1546) {
                sDewey$ = "842/.1"
            } else if (Val(Mid(sClassNo$, 3, 4)) > 1550 && Val(Mid(sClassNo$, 3, 4)) < 1596) {
                sDewey$ = "Period1400"
                Period1.Caption = "Period 1400-1499"
                Period2.Caption = "Period 1500-1599"
                sGenre$ = "Drama"
                sCountry$ = "France"
            } else if (Val(Mid(sClassNo$, 3, 4)) > 1599 && Val(Mid(sClassNo$, 3, 4)) < 1710) {
                sDewey$ = "842/.3"
            } else if (Val(Mid(sClassNo$, 3, 4)) > 1709 && Val(Mid(sClassNo$, 3, 4)) < 1936) {
                sDewey$ = "842/.4"
            } else if (Val(Mid(sClassNo$, 3, 4)) > 1946 && Val(Mid(sClassNo$, 3, 4)) < 2148) {
                sDewey$ = "Period1600"
                Period1.Caption = "Period 1600-1715"
                Period2.Caption = "Period 1715-1789"
                Period3.Caption = "Period 1789-1815"
                sGenre$ = "Drama"
                sCountry$ = "France"
            } else if (Val(Mid(sClassNo$, 3, 4)) > 2148 && Val(Mid(sClassNo$, 3, 4)) < 2552) {
                sDewey$ = "Period1800"
                Period1.Caption = "Period 1789-1815"
                Period2.Caption = "Period 1815-1848"
                Period3.Caption = "Period 1848-1889"
                sGenre$ = "Drama"
                sCountry$ = "France"
            } else if (Val(Mid(sClassNo$, 3, 4)) > 2599 && Val(Mid(sClassNo$, 3, 4)) < 2652) {
                sDewey$ = "Period1945"
                Period1.Caption = "Period 1900-1945"
                Period2.Caption = "Period 1945-1999"
                sGenre$ = "Drama"
                sCountry$ = "France"
            } else if (Val(Mid(sClassNo$, 3, 4)) > 2659 && Val(Mid(sClassNo$, 3, 4)) < 2687) {
                sDewey$ = "842/.914"
            } else if (Val(Mid(sClassNo$, 3, 4)) > 2699 && Val(Mid(sClassNo$, 3, 4)) < 2727) {
                sDewey$ = "842/.92"
            } else if (Val(Mid(sClassNo$, 3, 6)) == 3919.2) { //Canada
                sDewey$ = "842/.914"
            } else if (Val(Mid(sClassNo$, 3, 6)) == 3919.3) { //Canada
                sDewey$ = "842/.92"
            } else if (Val(Mid(sClassNo$, 3, 4)) > 4264 && Val(Mid(sClassNo$, 3, 4)) < 4557) {
                sDewey$ = "Period1300"
                Period1.Caption = "Period to 1375"
                Period2.Caption = "Period 1375-1492"
                sGenre$ = "Drama"
                sCountry$ = "Italy"
            } else if (Val(Mid(sClassNo$, 3, 4)) > 4560 && Val(Mid(sClassNo$, 3, 4)) < 4665) {
                sDewey$ = "Period1400"
                Period1.Caption = "Period 1375-1492"
                Period2.Caption = "Period 1492-1542"
                Period3.Caption = "Period 1542-1585"
                Period4.Caption = "Period 1585-1748"
                sGenre$ = "Drama"
                sCountry$ = "Italy"
            } else if (Val(Mid(sClassNo$, 3, 4)) > 4674 && Val(Mid(sClassNo$, 3, 4)) < 4735) {
                sDewey$ = "Period1600"
                Period1.Caption = "Period 1585-1748"
                Period2.Caption = "Period 1748-1814"
                Period3.Caption = "Period 1814-1859"
                Period4.Caption = "Period 1859-1899"
                sGenre$ = "Drama"
                sCountry$ = "Italy"
            } else if (Val(Mid(sClassNo$, 3, 4)) > 4799 && Val(Mid(sClassNo$, 3, 4)) < 4852) {
                sDewey$ = "Period1945"
                Period1.Caption = "Period 1900-1945"
                Period2.Caption = "Period 1945-1999"
                sGenre$ = "Drama"
                sCountry$ = "Italy"
            } else if (Val(Mid(sClassNo$, 3, 4)) > 4859 && Val(Mid(sClassNo$, 3, 4)) < 4887) {
                sDewey$ = "852/.914"
            } else if (Val(Mid(sClassNo$, 3, 4)) > 4899 && Val(Mid(sClassNo$, 3, 4)) < 4927) {
                sDewey$ = "852/.92"
            } else if (Val(Mid(sClassNo$, 3, 4)) > 6273 && Val(Mid(sClassNo$, 3, 4)) < 6278) { //Spain
                sDewey$ = "863/.2"
            } else if (Val(Mid(sClassNo$, 3, 4)) > 6279 && Val(Mid(sClassNo$, 3, 4)) < 6320) { //Spain
                sDewey$ = "862/.3"
            } else if (Val(Mid(sClassNo$, 3, 4)) > 6321 && Val(Mid(sClassNo$, 3, 4)) < 6362) { //Spain
                sDewey$ = "862/.3"
            } else if (Val(Mid(sClassNo$, 3, 4)) > 6365 && Val(Mid(sClassNo$, 3, 4)) < 6387) { //Spain
                sDewey$ = "861/.1"
            } else if (Val(Mid(sClassNo$, 3, 4)) > 6390 && Val(Mid(sClassNo$, 3, 4)) < 6393) { //Spain
                sDewey$ = "861/.3"
            } else if (Val(Mid(sClassNo$, 3, 4)) > 6393 && Val(Mid(sClassNo$, 3, 4)) < 6396) { //Spain
                sDewey$ = "861/.3"
            } else if (Val(Mid(sClassNo$, 3, 4)) > 6406 && Val(Mid(sClassNo$, 3, 4)) < 6410) { //Spain
                sDewey$ = "863/.3"
            } else if (Val(Mid(sClassNo$, 3, 4)) > 6433 && Val(Mid(sClassNo$, 3, 4)) < 6437) { //Spain
                sDewey$ = "862/.3"
            } else if (Val(Mid(sClassNo$, 3, 4)) > 6437 && Val(Mid(sClassNo$, 3, 4)) < 6493) { //Spain
                sDewey$ = "862/.3"
            } else if (Val(Mid(sClassNo$, 3, 4)) == 6496) { //Spain
                sDewey$ = "862/.3"
            } else if (Val(Mid(sClassNo$, 3, 4)) > 6499 && Val(Mid(sClassNo$, 3, 4)) < 6577) { //Spain
                sDewey$ = "Period1800"
                Period1.Caption = "Period 1700-1799"
                Period2.Caption = "Period 1800-1899"
                sGenre$ = "Drama"
                sCountry$ = "Spain"
            } else if (Val(Mid(sClassNo$, 3, 4)) > 6599 && Val(Mid(sClassNo$, 3, 4)) < 6648) { //Spain
                sDewey$ = "Period1900"
                Period1.Caption = "Period 1800-1899"
                Period2.Caption = "Period 1900-1945"
                Period3.Caption = "Period 1945-1999"
                sGenre$ = "Drama"
                sCountry$ = "Spain"
            } else if (Val(Mid(sClassNo$, 3, 4)) > 6649 && Val(Mid(sClassNo$, 3, 4)) < 6677) { //Spain
                sDewey$ = "862/.64"
            } else if (Val(Mid(sClassNo$, 3, 4)) > 6699 && Val(Mid(sClassNo$, 3, 4)) < 6727) { //Spain
                sDewey$ = "862/.7"
            } else if (Val(Mid(sClassNo$, 3, 6)) == 7079.2) { //US & Canada
                sDewey$ = "862/.64"
            } else if (Val(Mid(sClassNo$, 3, 6)) == 7079.3) { //US & Canada
                sDewey$ = "862/.7"
            } else if (Val(Mid(sClassNo$, 3, 4)) == 7297) { //Mexico
                sDewey$ = "Period1900"
                Period1.Caption = "Period 1800-1899"
                Period2.Caption = "Period 1900-1945"
                Period3.Caption = "Period 1945-1999"
                sGenre$ = "Drama"
                sCountry$ = "Mexico"
            } else if (Val(Mid(sClassNo$, 3, 4)) > 7297 && Val(Mid(sClassNo$, 3, 7)) < 7298.37) { //Mexico
                sDewey$ = "862/.64"
            } else if (Val(Mid(sClassNo$, 3, 7)) > 7298.36 && Val(Mid(sClassNo$, 3, 7)) < 7298.437) { //Mexico
                sDewey$ = "862/.7"
            } else if (Val(Mid(sClassNo$, 3, 4)) == 7390) { //Cuba
                sDewey$ = "862/.64"
            } else if (Val(Mid(sClassNo$, 3, 4)) == 7392) { //Cuba
                sDewey$ = "862/.7"
            } else if (Val(Mid(sClassNo$, 3, 6)) == 7409.2) { //Dom. Rep.
                sDewey$ = "862/.64"
            } else if (Val(Mid(sClassNo$, 3, 6)) == 7409.3) { //Dom. Rep.
                sDewey$ = "862/.7"
            } else if (Val(Mid(sClassNo$, 3, 4)) == 7440) { //P.R.
                sDewey$ = "862/.64"
            } else if (Val(Mid(sClassNo$, 3, 4)) == 7442) { //P.R.
                sDewey$ = "862/.7"
            } else if (Val(Mid(sClassNo$, 3, 6)) == 7489.2) { //Costa Rica
                sDewey$ = "862/.64"
            } else if (Val(Mid(sClassNo$, 3, 6)) == 7489.3) { //Costa Rica
                sDewey$ = "862/.7"
            } else if (Val(Mid(sClassNo$, 3, 6)) == 7499.2) { //Guatemala
                sDewey$ = "862/.64"
            } else if (Val(Mid(sClassNo$, 3, 6)) == 7499.3) { //Guatemala
                sDewey$ = "862/.7"
            } else if (Val(Mid(sClassNo$, 3, 6)) == 7509.2) { //Honduras
                sDewey$ = "862/.64"
            } else if (Val(Mid(sClassNo$, 3, 6)) == 7509.3) { //Honduras
                sDewey$ = "862/.7"
            } else if (Val(Mid(sClassNo$, 3, 6)) == 7519.2) { //Nicaragua
                sDewey$ = "862/.64"
            } else if (Val(Mid(sClassNo$, 3, 6)) == 7519.3) { //Nicaragua
                sDewey$ = "862/.7"
            } else if (Val(Mid(sClassNo$, 3, 6)) == 7529.2) { //Panama
                sDewey$ = "862/.64"
            } else if (Val(Mid(sClassNo$, 3, 6)) == 7529.3) { //Panama
                sDewey$ = "862/.7"
            } else if (Val(Mid(sClassNo$, 3, 6)) == 7539.2) { //Salvador
                sDewey$ = "862/.64"
            } else if (Val(Mid(sClassNo$, 3, 6)) == 7539.3) { //Salvador
                sDewey$ = "862/.7"
            } else if (Val(Mid(sClassNo$, 3, 4)) == 7797) { //Argentina
                sDewey$ = "Period1900"
                Period1.Caption = "Period 1800-1899"
                Period2.Caption = "Period 1900-1945"
                Period3.Caption = "Period 1945-1999"
                sGenre$ = "Drama"
                sCountry$ = "Argentina"
            } else if (Val(Mid(sClassNo$, 3, 4)) > 7797 && Val(Mid(sClassNo$, 3, 7)) < 7798.37) { //Argentina
                sDewey$ = "862/.64"
            } else if (Val(Mid(sClassNo$, 3, 7)) > 7798.36 && Val(Mid(sClassNo$, 3, 7)) < 7798.437) { //Argentina
                sDewey$ = "862/.7"
            } else if (Val(Mid(sClassNo$, 3, 4)) == 7820) { //Bolivia
                sDewey$ = "862/.64"
            } else if (Val(Mid(sClassNo$, 3, 4)) == 7822) { //Bolivia
                sDewey$ = "862/.7"
            } else if (Val(Mid(sClassNo$, 3, 6)) == 7889.2) { //Brazil
                sDewey$ = "862/.64"
            } else if (Val(Mid(sClassNo$, 3, 6)) == 7889.3) { //Brazil
                sDewey$ = "862/.7"
            } else if (Val(Mid(sClassNo$, 3, 4)) == 8097) { //Chile
                sDewey$ = "Period1900"
                Period1.Caption = "Period 1800-1899"
                Period2.Caption = "Period 1900-1945"
                Period3.Caption = "Period 1945-1999"
                sGenre$ = "Drama"
                sCountry$ = "Chile"
            } else if (Val(Mid(sClassNo$, 3, 4)) > 8097 && Val(Mid(sClassNo$, 3, 7)) < 8098.37) { //Chile
                sDewey$ = "862/.64"
            } else if (Val(Mid(sClassNo$, 3, 7)) > 8098.36 && Val(Mid(sClassNo$, 3, 7)) < 8098.437) { //Chile
                sDewey$ = "862/.7"
            } else if (Val(Mid(sClassNo$, 3, 4)) > 8179 && Val(Mid(sClassNo$, 3, 7)) < 8180.37) { //Colombia
                sDewey$ = "862/.64"
            } else if (Val(Mid(sClassNo$, 3, 7)) > 8180.36 && Val(Mid(sClassNo$, 3, 7)) < 8180.437) { //Colombia
                sDewey$ = "862/.7"
            } else if (Val(Mid(sClassNo$, 3, 4)) > 8219 && Val(Mid(sClassNo$, 3, 7)) < 8220.37) { //Ecuador
                sDewey$ = "862/.64"
            } else if (Val(Mid(sClassNo$, 3, 7)) > 8220.36 && Val(Mid(sClassNo$, 3, 7)) < 8220.437) { //Ecuador
                sDewey$ = "862/.7"
            } else if (Val(Mid(sClassNo$, 3, 6)) == 8259.2) { //Paraguay
                sDewey$ = "862/.64"
            } else if (Val(Mid(sClassNo$, 3, 6)) == 8259.3) { //Paraguay
                sDewey$ = "862/.7"
            } else if (Val(Mid(sClassNo$, 3, 4)) == 8497) { //Peru
                sDewey$ = "Period1900"
                Period1.Caption = "Period 1800-1899"
                Period2.Caption = "Period 1900-1945"
                Period3.Caption = "Period 1945-1999"
                sGenre$ = "Drama"
                sCountry$ = "Peru"
            } else if (Val(Mid(sClassNo$, 3, 4)) > 8497 && Val(Mid(sClassNo$, 3, 7)) < 8498.37) { //Peru
                sDewey$ = "862/.64"
            } else if (Val(Mid(sClassNo$, 3, 7)) > 8498.36 && Val(Mid(sClassNo$, 3, 7)) < 8498.437) { //Peru
                sDewey$ = "862/.7"
            } else if (Val(Mid(sClassNo$, 3, 4)) > 8519 && Val(Mid(sClassNo$, 3, 7)) < 8520.37) { //Uruguay
                sDewey$ = "862/.64"
            } else if (Val(Mid(sClassNo$, 3, 7)) > 8520.36 && Val(Mid(sClassNo$, 3, 7)) < 8520.437) { //Uruguay
                sDewey$ = "862/.7"
            } else if (Val(Mid(sClassNo$, 3, 4)) > 8549 && Val(Mid(sClassNo$, 3, 7)) < 8550.37) { //Venezuela
                sDewey$ = "862/.64"
            } else if (Val(Mid(sClassNo$, 3, 7)) > 8550.36 && Val(Mid(sClassNo$, 3, 7)) < 8550.437) { //Venezuela
                sDewey$ = "862/.7"
            } else if (Val(Mid(sClassNo$, 3, 4)) == 9189) { //Portugal
                sDewey$ = "869.2/1"
            } else if (Val(Mid(sClassNo$, 3, 4)) > 9190 && Val(Mid(sClassNo$, 3, 4)) < 9256) { //Portugal
                sDewey$ = "869.2/2"
            } else if (Val(Mid(sClassNo$, 3, 4)) > 9261 && Val(Mid(sClassNo$, 3, 4)) < 9289) { //Portugal
                sDewey$ = "869.2/42"
            } else if (Val(Mid(sClassNo$, 3, 4)) > 9299 && Val(Mid(sClassNo$, 3, 4)) < 9327) { //Portugal
                sDewey$ = "869.2/5"
            } else if (Val(Mid(sClassNo$, 3, 4)) == 9696) { //Brazil
                sDewey$ = "Period1500"
                Period1.Caption = "Period to 1499"
                Period2.Caption = "Period 1500-1799"
                sGenre$ = "Drama"
                sCountry$ = "Brazil"
            } else if (Val(Mid(sClassNo$, 3, 4)) == 9697) { //Brazil
                sDewey$ = "Period1900"
                Period1.Caption = "Period 1800-1899"
                Period2.Caption = "Period 1900-1945"
                Period3.Caption = "Period 1945-1999"
                sGenre$ = "Drama"
                sCountry$ = "Brazil"
            } else if (Val(Mid(sClassNo$, 3, 4)) > 9697 && Val(Mid(sClassNo$, 3, 7)) < 9698.37) { //Brazil
                sDewey$ = "869.2/42"
            } else if (Val(Mid(sClassNo$, 3, 7)) > 9698.36 && Val(Mid(sClassNo$, 3, 7)) < 9698.437) { //Brazil
                sDewey$ = "869.2/5"
            }
        }

        const _convertClassPqFiction = (sClassNo$) => {
            if (Val(Mid(sClassNo$, 3, 6)) > 1410.1 && Val(Mid(sClassNo$, 3, 4)) < 1546) {
                sDewey$ = "843/.1"
            } else if (Val(Mid(sClassNo$, 3, 4)) > 1550 && Val(Mid(sClassNo$, 3, 4)) < 1596) {
                sDewey$ = "Period1400"
                Period1.Caption = "Period 1400-1499"
                Period2.Caption = "Period 1500-1599"
                sGenre$ = "Fiction"
                sCountry$ = "France"
            } else if (Val(Mid(sClassNo$, 3, 4)) > 1599 && Val(Mid(sClassNo$, 3, 4)) < 1710) {
                sDewey$ = "843/.3"
            } else if (Val(Mid(sClassNo$, 3, 4)) > 1709 && Val(Mid(sClassNo$, 3, 4)) < 1936) {
                sDewey$ = "843/.4"
            } else if (Val(Mid(sClassNo$, 3, 4)) > 1946 && Val(Mid(sClassNo$, 3, 4)) < 2148) {
                sDewey$ = "Period1600"
                Period1.Caption = "Period 1600-1715"
                Period2.Caption = "Period 1715-1789"
                Period3.Caption = "Period 1789-1815"
                sGenre$ = "Fiction"
                sCountry$ = "France"
            } else if (Val(Mid(sClassNo$, 3, 4)) > 2148 && Val(Mid(sClassNo$, 3, 4)) < 2552) {
                sDewey$ = "Period1800"
                Period1.Caption = "Period 1789-1815"
                Period2.Caption = "Period 1815-1848"
                Period3.Caption = "Period 1848-1889"
                sGenre$ = "Fiction"
                sCountry$ = "France"
            } else if (Val(Mid(sClassNo$, 3, 4)) > 2599 && Val(Mid(sClassNo$, 3, 4)) < 2652) {
                sDewey$ = "Period1945"
                Period1.Caption = "Period 1900-1945"
                Period2.Caption = "Period 1945-1999"
                sGenre$ = "Fiction"
                sCountry$ = "France"
            } else if (Val(Mid(sClassNo$, 3, 4)) > 2659 && Val(Mid(sClassNo$, 3, 4)) < 2687) {
                sDewey$ = "843/.914"
            } else if (Val(Mid(sClassNo$, 3, 4)) > 2699 && Val(Mid(sClassNo$, 3, 4)) < 2727) {
                sDewey$ = "843/.92"
            } else if (Val(Mid(sClassNo$, 3, 6)) == 3919.2) { //Canada
                sDewey$ = "843/.914"
            } else if (Val(Mid(sClassNo$, 3, 6)) == 3919.3) { //Canada
                sDewey$ = "843/.92"
            } else if (Val(Mid(sClassNo$, 3, 4)) > 4264 && Val(Mid(sClassNo$, 3, 4)) < 4557) {
                sDewey$ = "Period1300"
                Period1.Caption = "Period to 1375"
                Period2.Caption = "Period 1375-1492"
                sGenre$ = "Fiction"
                sCountry$ = "Italy"
            } else if (Val(Mid(sClassNo$, 3, 4)) > 4560 && Val(Mid(sClassNo$, 3, 4)) < 4665) {
                sDewey$ = "Period1400"
                Period1.Caption = "Period 1375-1492"
                Period2.Caption = "Period 1492-1542"
                Period3.Caption = "Period 1542-1585"
                Period4.Caption = "Period 1585-1748"
                sGenre$ = "Fiction"
                sCountry$ = "Italy"
            } else if (Val(Mid(sClassNo$, 3, 4)) > 4674 && Val(Mid(sClassNo$, 3, 4)) < 4735) {
                sDewey$ = "Period1600"
                Period1.Caption = "Period 1585-1748"
                Period2.Caption = "Period 1748-1814"
                Period3.Caption = "Period 1814-1859"
                Period4.Caption = "Period 1859-1899"
                sGenre$ = "Fiction"
                sCountry$ = "Italy"
            } else if (Val(Mid(sClassNo$, 3, 4)) > 4799 && Val(Mid(sClassNo$, 3, 4)) < 4852) {
                sDewey$ = "Period1945"
                Period1.Caption = "Period 1900-1945"
                Period2.Caption = "Period 1945-1999"
                sGenre$ = "Fiction"
                sCountry$ = "Italy"
            } else if (Val(Mid(sClassNo$, 3, 4)) > 4859 && Val(Mid(sClassNo$, 3, 4)) < 4887) {
                sDewey$ = "853/.914"
            } else if (Val(Mid(sClassNo$, 3, 4)) > 4899 && Val(Mid(sClassNo$, 3, 4)) < 4927) {
                sDewey$ = "853/.92"
            } else if (Val(Mid(sClassNo$, 3, 4)) > 6273 && Val(Mid(sClassNo$, 3, 4)) < 6278) { //Spain
                sDewey$ = "863/.2"
            } else if (Val(Mid(sClassNo$, 3, 4)) > 6279 && Val(Mid(sClassNo$, 3, 4)) < 6320) { //Spain
                sDewey$ = "863/.3"
            } else if (Val(Mid(sClassNo$, 3, 4)) > 6321 && Val(Mid(sClassNo$, 3, 4)) < 6362) { //Spain
                sDewey$ = "863/.3"
            } else if (Val(Mid(sClassNo$, 3, 4)) > 6365 && Val(Mid(sClassNo$, 3, 4)) < 6387) { //Spain
                sDewey$ = "861/.1"
            } else if (Val(Mid(sClassNo$, 3, 4)) > 6390 && Val(Mid(sClassNo$, 3, 4)) < 6393) { //Spain
                sDewey$ = "861/.3"
            } else if (Val(Mid(sClassNo$, 3, 4)) > 6393 && Val(Mid(sClassNo$, 3, 4)) < 6396) { //Spain
                sDewey$ = "861/.3"
            } else if (Val(Mid(sClassNo$, 3, 4)) > 6406 && Val(Mid(sClassNo$, 3, 4)) < 6410) { //Spain
                sDewey$ = "863/.3"
            } else if (Val(Mid(sClassNo$, 3, 4)) > 6433 && Val(Mid(sClassNo$, 3, 4)) < 6437) { //Spain
                sDewey$ = "863/.3"
            } else if (Val(Mid(sClassNo$, 3, 4)) > 6437 && Val(Mid(sClassNo$, 3, 4)) < 6493) { //Spain
                sDewey$ = "863/.3"
            } else if (Val(Mid(sClassNo$, 3, 4)) == 6496) { //Spain
                sDewey$ = "863/.3"
            } else if (Val(Mid(sClassNo$, 3, 4)) > 6499 && Val(Mid(sClassNo$, 3, 4)) < 6577) { //Spain
                sDewey$ = "Period1800"
                Period1.Caption = "Period 1700-1799"
                Period2.Caption = "Period 1800-1899"
                sGenre$ = "Fiction"
                sCountry$ = "Spain"
            } else if (Val(Mid(sClassNo$, 3, 4)) > 6599 && Val(Mid(sClassNo$, 3, 4)) < 6648) { //Spain
                sDewey$ = "Period1900"
                Period1.Caption = "Period 1800-1899"
                Period2.Caption = "Period 1900-1945"
                Period3.Caption = "Period 1945-1999"
                sGenre$ = "Fiction"
                sCountry$ = "Spain"
            } else if (Val(Mid(sClassNo$, 3, 4)) > 6649 && Val(Mid(sClassNo$, 3, 4)) < 6677) { //Spain
                sDewey$ = "863/.64"
            } else if (Val(Mid(sClassNo$, 3, 4)) > 6699 && Val(Mid(sClassNo$, 3, 4)) < 6727) { //Spain
                sDewey$ = "863/.7"
            } else if (Val(Mid(sClassNo$, 3, 6)) == 7079.2) { //US & Canada
                sDewey$ = "863/.64"
            } else if (Val(Mid(sClassNo$, 3, 6)) == 7079.3) { //US & Canada
                sDewey$ = "863/.7"
            } else if (Val(Mid(sClassNo$, 3, 4)) == 7297) { //Mexico
                sDewey$ = "Period1900"
                Period1.Caption = "Period 1800-1899"
                Period2.Caption = "Period 1900-1945"
                Period3.Caption = "Period 1945-1999"
                sGenre$ = "Fiction"
                sCountry$ = "Mexico"
            } else if (Val(Mid(sClassNo$, 3, 4)) > 7297 && Val(Mid(sClassNo$, 3, 7)) < 7298.37) { //Mexico
                sDewey$ = "863/.64"
            } else if (Val(Mid(sClassNo$, 3, 7)) > 7298.36 && Val(Mid(sClassNo$, 3, 7)) < 7298.437) { //Mexico
                sDewey$ = "863/.7"
            } else if (Val(Mid(sClassNo$, 3, 4)) == 7390) { //Cuba
                sDewey$ = "863/.64"
            } else if (Val(Mid(sClassNo$, 3, 4)) == 7392) { //Cuba
                sDewey$ = "863/.7"
            } else if (Val(Mid(sClassNo$, 3, 6)) == 7409.2) { //Dom. Rep.
                sDewey$ = "863/.64"
            } else if (Val(Mid(sClassNo$, 3, 6)) == 7409.3) { //Dom. Rep.
                sDewey$ = "863/.7"
            } else if (Val(Mid(sClassNo$, 3, 4)) == 7440) { //P.R.
                sDewey$ = "863/.64"
            } else if (Val(Mid(sClassNo$, 3, 4)) == 7442) { //P.R.
                sDewey$ = "863/.7"
            } else if (Val(Mid(sClassNo$, 3, 6)) == 7489.2) { //Costa Rica
                sDewey$ = "863/.64"
            } else if (Val(Mid(sClassNo$, 3, 6)) == 7489.3) { //Costa Rica
                sDewey$ = "863/.7"
            } else if (Val(Mid(sClassNo$, 3, 6)) == 7499.2) { //Guatemala
                sDewey$ = "863/.64"
            } else if (Val(Mid(sClassNo$, 3, 6)) == 7499.3) { //Guatemala
                sDewey$ = "863/.7"
            } else if (Val(Mid(sClassNo$, 3, 6)) == 7509.2) { //Honduras
                sDewey$ = "863/.64"
            } else if (Val(Mid(sClassNo$, 3, 6)) == 7509.3) { //Honduras
                sDewey$ = "863/.7"
            } else if (Val(Mid(sClassNo$, 3, 6)) == 7519.2) { //Nicaragua
                sDewey$ = "863/.64"
            } else if (Val(Mid(sClassNo$, 3, 6)) == 7519.3) { //Nicaragua
                sDewey$ = "863/.7"
            } else if (Val(Mid(sClassNo$, 3, 6)) == 7529.2) { //Panama
                sDewey$ = "863/.64"
            } else if (Val(Mid(sClassNo$, 3, 6)) == 7529.3) { //Panama
                sDewey$ = "863/.7"
            } else if (Val(Mid(sClassNo$, 3, 6)) == 7539.2) { //Salvador
                sDewey$ = "863/.64"
            } else if (Val(Mid(sClassNo$, 3, 6)) == 7539.3) { //Salvador
                sDewey$ = "863/.7"
            } else if (Val(Mid(sClassNo$, 3, 4)) == 7797) { //Argentina
                sDewey$ = "Period1900"
                Period1.Caption = "Period 1800-1899"
                Period2.Caption = "Period 1900-1945"
                Period3.Caption = "Period 1945-1999"
                sGenre$ = "Fiction"
                sCountry$ = "Argentina"
            } else if (Val(Mid(sClassNo$, 3, 4)) > 7797 && Val(Mid(sClassNo$, 3, 7)) < 7798.37) { //Argentina
                sDewey$ = "863/.64"
            } else if (Val(Mid(sClassNo$, 3, 7)) > 7798.36 && Val(Mid(sClassNo$, 3, 7)) < 7798.437) { //Argentina
                sDewey$ = "863/.7"
            } else if (Val(Mid(sClassNo$, 3, 4)) == 7820) { //Bolivia
                sDewey$ = "863/.64"
            } else if (Val(Mid(sClassNo$, 3, 4)) == 7822) { //Bolivia
                sDewey$ = "863/.7"
            } else if (Val(Mid(sClassNo$, 3, 6)) == 7889.2) { //Brazil
                sDewey$ = "863/.64"
            } else if (Val(Mid(sClassNo$, 3, 6)) == 7889.3) { //Brazil
                sDewey$ = "863/.7"
            } else if (Val(Mid(sClassNo$, 3, 4)) == 8097) { //Chile
                sDewey$ = "Period1900"
                Period1.Caption = "Period 1800-1899"
                Period2.Caption = "Period 1900-1945"
                Period3.Caption = "Period 1945-1999"
                sGenre$ = "Fiction"
                sCountry$ = "Chile"
            } else if (Val(Mid(sClassNo$, 3, 4)) > 8097 && Val(Mid(sClassNo$, 3, 7)) < 8098.37) { //Chile
                sDewey$ = "863/.64"
            } else if (Val(Mid(sClassNo$, 3, 7)) > 8098.36 && Val(Mid(sClassNo$, 3, 7)) < 8098.437) { //Chile
                sDewey$ = "863/.7"
            } else if (Val(Mid(sClassNo$, 3, 4)) > 8179 && Val(Mid(sClassNo$, 3, 7)) < 8180.37) { //Colombia
                sDewey$ = "863/.64"
            } else if (Val(Mid(sClassNo$, 3, 7)) > 8180.36 && Val(Mid(sClassNo$, 3, 7)) < 8180.437) { //Colombia
                sDewey$ = "863/.7"
            } else if (Val(Mid(sClassNo$, 3, 4)) > 8219 && Val(Mid(sClassNo$, 3, 7)) < 8220.37) { //Ecuador
                sDewey$ = "863/.64"
            } else if (Val(Mid(sClassNo$, 3, 7)) > 8220.36 && Val(Mid(sClassNo$, 3, 7)) < 8220.437) { //Ecuador
                sDewey$ = "863/.7"
            } else if (Val(Mid(sClassNo$, 3, 6)) == 8259.2) { //Paraguay
                sDewey$ = "863/.64"
            } else if (Val(Mid(sClassNo$, 3, 6)) == 8259.3) { //Paraguay
                sDewey$ = "863/.7"
            } else if (Val(Mid(sClassNo$, 3, 4)) == 8497) { //Peru
                sDewey$ = "Period1900"
                Period1.Caption = "Period 1800-1899"
                Period2.Caption = "Period 1900-1945"
                Period3.Caption = "Period 1945-1999"
                sGenre$ = "Fiction"
                sCountry$ = "Peru"
            } else if (Val(Mid(sClassNo$, 3, 4)) > 8497 && Val(Mid(sClassNo$, 3, 7)) < 8498.37) { //Peru
                sDewey$ = "863/.64"
            } else if (Val(Mid(sClassNo$, 3, 7)) > 8498.36 && Val(Mid(sClassNo$, 3, 7)) < 8498.437) { //Peru
                sDewey$ = "863/.7"
            } else if (Val(Mid(sClassNo$, 3, 4)) > 8519 && Val(Mid(sClassNo$, 3, 7)) < 8520.37) { //Uruguay
                sDewey$ = "863/.64"
            } else if (Val(Mid(sClassNo$, 3, 7)) > 8520.36 && Val(Mid(sClassNo$, 3, 7)) < 8520.437) { //Uruguay
                sDewey$ = "863/.7"
            } else if (Val(Mid(sClassNo$, 3, 4)) > 8549 && Val(Mid(sClassNo$, 3, 7)) < 8550.37) { //Venezuela
                sDewey$ = "863/.64"
            } else if (Val(Mid(sClassNo$, 3, 7)) > 8550.36 && Val(Mid(sClassNo$, 3, 7)) < 8550.437) { //Venezuela
                sDewey$ = "863/.7"
            } else if (Val(Mid(sClassNo$, 3, 4)) == 9189) { //Portugal
                sDewey$ = "869.3/1"
            } else if (Val(Mid(sClassNo$, 3, 4)) > 9190 && Val(Mid(sClassNo$, 3, 4)) < 9256) { //Portugal
                sDewey$ = "869.3/2"
            } else if (Val(Mid(sClassNo$, 3, 4)) > 9261 && Val(Mid(sClassNo$, 3, 4)) < 9289) { //Portugal
                sDewey$ = "869.3/42"
            } else if (Val(Mid(sClassNo$, 3, 4)) > 9299 && Val(Mid(sClassNo$, 3, 4)) < 9327) { //Portugal
                sDewey$ = "869.3/5"
            } else if (Val(Mid(sClassNo$, 3, 4)) == 9696) { //Brazil
                sDewey$ = "Period1500"
                Period1.Caption = "Period to 1499"
                Period2.Caption = "Period 1500-1799"
                sGenre$ = "Fiction"
                sCountry$ = "Brazil"
            } else if (Val(Mid(sClassNo$, 3, 4)) == 9697) { //Brazil
                sDewey$ = "Period1900"
                Period1.Caption = "Period 1800-1899"
                Period2.Caption = "Period 1900-1945"
                Period3.Caption = "Period 1945-1999"
                sGenre$ = "Fiction"
                sCountry$ = "Brazil"
            } else if (Val(Mid(sClassNo$, 3, 4)) > 9697 && Val(Mid(sClassNo$, 3, 7)) < 9698.37) { //Brazil
                sDewey$ = "869.3/42"
            } else if (Val(Mid(sClassNo$, 3, 7)) > 9698.36 && Val(Mid(sClassNo$, 3, 7)) < 9698.437) { //Brazil
                sDewey$ = "869.3/5"
            }
        }

        const _convertClassPqPoetry = (sClassNo$) => {
            if (Val(Mid(sClassNo$, 3, 6)) > 1410.1 && Val(Mid(sClassNo$, 3, 4)) < 1546) {
                sDewey$ = "841/.1"
            } else if (Val(Mid(sClassNo$, 3, 4)) > 1550 && Val(Mid(sClassNo$, 3, 4)) < 1596) {
                sDewey$ = "Period1400"
                Period1.Caption = "Period 1400-1499"
                Period2.Caption = "Period 1500-1599"
                sGenre$ = "Poetry"
                sCountry$ = "France"
            } else if (Val(Mid(sClassNo$, 3, 4)) > 1599 && Val(Mid(sClassNo$, 3, 4)) < 1710) {
                sDewey$ = "841/.3"
            } else if (Val(Mid(sClassNo$, 3, 4)) > 1709 && Val(Mid(sClassNo$, 3, 4)) < 1936) {
                sDewey$ = "841/.4"
            } else if (Val(Mid(sClassNo$, 3, 4)) > 1946 && Val(Mid(sClassNo$, 3, 4)) < 2148) {
                sDewey$ = "Period1600"
                Period1.Caption = "Period 1600-1715"
                Period2.Caption = "Period 1715-1789"
                Period3.Caption = "Period 1789-1815"
                sGenre$ = "Poetry"
                sCountry$ = "France"
            } else if (Val(Mid(sClassNo$, 3, 4)) > 2148 && Val(Mid(sClassNo$, 3, 4)) < 2552) {
                sDewey$ = "Period1800"
                Period1.Caption = "Period 1789-1815"
                Period2.Caption = "Period 1815-1848"
                Period3.Caption = "Period 1848-1889"
                sGenre$ = "Poetry"
                sCountry$ = "France"
            } else if (Val(Mid(sClassNo$, 3, 4)) > 2599 && Val(Mid(sClassNo$, 3, 4)) < 2652) {
                sDewey$ = "Period1945"
                Period1.Caption = "Period 1900-1945"
                Period2.Caption = "Period 1945-1999"
                sGenre$ = "Poetry"
                sCountry$ = "France"
            } else if (Val(Mid(sClassNo$, 3, 4)) > 2659 && Val(Mid(sClassNo$, 3, 4)) < 2687) {
                sDewey$ = "841/.914"
            } else if (Val(Mid(sClassNo$, 3, 4)) > 2699 && Val(Mid(sClassNo$, 3, 4)) < 2727) {
                sDewey$ = "841/.92"
            } else if (Val(Mid(sClassNo$, 3, 6)) == 3919.2) { //Canada
                sDewey$ = "841/.914"
            } else if (Val(Mid(sClassNo$, 3, 6)) == 3919.3) { //Canada
                sDewey$ = "841/.92"
            } else if (Val(Mid(sClassNo$, 3, 4)) > 4264 && Val(Mid(sClassNo$, 3, 4)) < 4557) {
                sDewey$ = "Period1300"
                Period1.Caption = "Period to 1375"
                Period2.Caption = "Period 1375-1492"
                sGenre$ = "Poetry"
                sCountry$ = "Italy"
            } else if (Val(Mid(sClassNo$, 3, 4)) > 4560 && Val(Mid(sClassNo$, 3, 4)) < 4665) {
                sDewey$ = "Period1400"
                Period1.Caption = "Period 1375-1492"
                Period2.Caption = "Period 1492-1542"
                Period3.Caption = "Period 1542-1585"
                Period4.Caption = "Period 1585-1748"
                sGenre$ = "Poetry"
                sCountry$ = "Italy"
            } else if (Val(Mid(sClassNo$, 3, 4)) > 4674 && Val(Mid(sClassNo$, 3, 4)) < 4735) {
                sDewey$ = "Period1600"
                Period1.Caption = "Period 1585-1748"
                Period2.Caption = "Period 1748-1814"
                Period3.Caption = "Period 1814-1859"
                Period4.Caption = "Period 1859-1899"
                sGenre$ = "Poetry"
                sCountry$ = "Italy"
            } else if (Val(Mid(sClassNo$, 3, 4)) > 4799 && Val(Mid(sClassNo$, 3, 4)) < 4852) {
                sDewey$ = "Period1945"
                Period1.Caption = "Period 1900-1945"
                Period2.Caption = "Period 1945-1999"
                sGenre$ = "Poetry"
                sCountry$ = "Italy"
            } else if (Val(Mid(sClassNo$, 3, 4)) > 4859 && Val(Mid(sClassNo$, 3, 4)) < 4887) {
                sDewey$ = "851/.914"
            } else if (Val(Mid(sClassNo$, 3, 4)) > 4899 && Val(Mid(sClassNo$, 3, 4)) < 4927) {
                sDewey$ = "851/.92"
            } else if (Val(Mid(sClassNo$, 3, 4)) > 6273 && Val(Mid(sClassNo$, 3, 4)) < 6278) { //Spain
                sDewey$ = "863/.2"
            } else if (Val(Mid(sClassNo$, 3, 4)) > 6279 && Val(Mid(sClassNo$, 3, 4)) < 6320) { //Spain
                sDewey$ = "861/.3"
            } else if (Val(Mid(sClassNo$, 3, 4)) > 6321 && Val(Mid(sClassNo$, 3, 4)) < 6362) { //Spain
                sDewey$ = "861/.3"
            } else if (Val(Mid(sClassNo$, 3, 4)) > 6365 && Val(Mid(sClassNo$, 3, 4)) < 6387) { //Spain
                sDewey$ = "861/.1"
            } else if (Val(Mid(sClassNo$, 3, 4)) > 6390 && Val(Mid(sClassNo$, 3, 4)) < 6393) { //Spain
                sDewey$ = "861/.3"
            } else if (Val(Mid(sClassNo$, 3, 4)) > 6393 && Val(Mid(sClassNo$, 3, 4)) < 6396) { //Spain
                sDewey$ = "861/.3"
            } else if (Val(Mid(sClassNo$, 3, 4)) > 6406 && Val(Mid(sClassNo$, 3, 4)) < 6410) { //Spain
                sDewey$ = "863/.3"
            } else if (Val(Mid(sClassNo$, 3, 4)) > 6433 && Val(Mid(sClassNo$, 3, 4)) < 6437) { //Spain
                sDewey$ = "861/.3"
            } else if (Val(Mid(sClassNo$, 3, 4)) > 6437 && Val(Mid(sClassNo$, 3, 4)) < 6493) { //Spain
                sDewey$ = "861/.3"
            } else if (Val(Mid(sClassNo$, 3, 4)) == 6496) { //Spain
                sDewey$ = "861/.3"
            } else if (Val(Mid(sClassNo$, 3, 4)) > 6499 && Val(Mid(sClassNo$, 3, 4)) < 6577) { //Spain
                sDewey$ = "Period1800"
                Period1.Caption = "Period 1700-1799"
                Period2.Caption = "Period 1800-1899"
                sGenre$ = "Poetry"
                sCountry$ = "Spain"
            } else if (Val(Mid(sClassNo$, 3, 4)) > 6599 && Val(Mid(sClassNo$, 3, 4)) < 6648) { //Spain
                sDewey$ = "Period1900"
                Period1.Caption = "Period 1800-1899"
                Period2.Caption = "Period 1900-1945"
                Period3.Caption = "Period 1945-1999"
                sGenre$ = "Poetry"
                sCountry$ = "Spain"
            } else if (Val(Mid(sClassNo$, 3, 4)) > 6649 && Val(Mid(sClassNo$, 3, 4)) < 6677) { //Spain
                sDewey$ = "861/.64"
            } else if (Val(Mid(sClassNo$, 3, 4)) > 6699 && Val(Mid(sClassNo$, 3, 4)) < 6727) { //Spain
                sDewey$ = "861/.7"
            } else if (Val(Mid(sClassNo$, 3, 6)) == 7079.2) { //US & Canada
                sDewey$ = "861/.64"
            } else if (Val(Mid(sClassNo$, 3, 6)) == 7079.3) { //US & Canada
                sDewey$ = "861/.7"
            } else if (Val(Mid(sClassNo$, 3, 4)) == 7297) { //Mexico
                sDewey$ = "Period1900"
                Period1.Caption = "Period 1800-1899"
                Period2.Caption = "Period 1900-1945"
                Period3.Caption = "Period 1945-1999"
                sGenre$ = "Poetry"
                sCountry$ = "Mexico"
            } else if (Val(Mid(sClassNo$, 3, 4)) > 7297 && Val(Mid(sClassNo$, 3, 7)) < 7298.37) { //Mexico
                sDewey$ = "861/.64"
            } else if (Val(Mid(sClassNo$, 3, 7)) > 7298.36 && Val(Mid(sClassNo$, 3, 7)) < 7298.437) { //Mexico
                sDewey$ = "861/.7"
            } else if (Val(Mid(sClassNo$, 3, 4)) == 7390) { //Cuba
                sDewey$ = "861/.64"
            } else if (Val(Mid(sClassNo$, 3, 4)) == 7392) { //Cuba
                sDewey$ = "861/.7"
            } else if (Val(Mid(sClassNo$, 3, 6)) == 7409.2) { //Dom. Rep.
                sDewey$ = "861/.64"
            } else if (Val(Mid(sClassNo$, 3, 6)) == 7409.3) { //Dom. Rep.
                sDewey$ = "861/.7"
            } else if (Val(Mid(sClassNo$, 3, 4)) == 7440) { //P.R.
                sDewey$ = "861/.64"
            } else if (Val(Mid(sClassNo$, 3, 4)) == 7442) { //P.R.
                sDewey$ = "861/.7"
            } else if (Val(Mid(sClassNo$, 3, 6)) == 7489.2) { //Costa Rica
                sDewey$ = "861/.64"
            } else if (Val(Mid(sClassNo$, 3, 6)) == 7489.3) { //Costa Rica
                sDewey$ = "861/.7"
            } else if (Val(Mid(sClassNo$, 3, 6)) == 7499.2) { //Guatemala
                sDewey$ = "861/.64"
            } else if (Val(Mid(sClassNo$, 3, 6)) == 7499.3) { //Guatemala
                sDewey$ = "861/.7"
            } else if (Val(Mid(sClassNo$, 3, 6)) == 7509.2) { //Honduras
                sDewey$ = "861/.64"
            } else if (Val(Mid(sClassNo$, 3, 6)) == 7509.3) { //Honduras
                sDewey$ = "861/.7"
            } else if (Val(Mid(sClassNo$, 3, 6)) == 7519.2) { //Nicaragua
                sDewey$ = "861/.64"
            } else if (Val(Mid(sClassNo$, 3, 6)) == 7519.3) { //Nicaragua
                sDewey$ = "861/.7"
            } else if (Val(Mid(sClassNo$, 3, 6)) == 7529.2) { //Panama
                sDewey$ = "861/.64"
            } else if (Val(Mid(sClassNo$, 3, 6)) == 7529.3) { //Panama
                sDewey$ = "861/.7"
            } else if (Val(Mid(sClassNo$, 3, 6)) == 7539.2) { //Salvador
                sDewey$ = "861/.64"
            } else if (Val(Mid(sClassNo$, 3, 6)) == 7539.3) { //Salvador
                sDewey$ = "861/.7"
            } else if (Val(Mid(sClassNo$, 3, 4)) == 7797) { //Argentina
                sDewey$ = "Period1900"
                Period1.Caption = "Period 1800-1899"
                Period2.Caption = "Period 1900-1945"
                Period3.Caption = "Period 1945-1999"
                sGenre$ = "Poetry"
                sCountry$ = "Argentina"
            } else if (Val(Mid(sClassNo$, 3, 4)) > 7797 && Val(Mid(sClassNo$, 3, 7)) < 7798.37) { //Argentina
                sDewey$ = "861/.64"
            } else if (Val(Mid(sClassNo$, 3, 7)) > 7798.36 && Val(Mid(sClassNo$, 3, 7)) < 7798.437) { //Argentina
                sDewey$ = "861/.7"
            } else if (Val(Mid(sClassNo$, 3, 4)) == 7820) { //Bolivia
                sDewey$ = "861/.64"
            } else if (Val(Mid(sClassNo$, 3, 4)) == 7822) { //Bolivia
                sDewey$ = "861/.7"
            } else if (Val(Mid(sClassNo$, 3, 6)) == 7889.2) { //Brazil
                sDewey$ = "861/.64"
            } else if (Val(Mid(sClassNo$, 3, 6)) == 7889.3) { //Brazil
                sDewey$ = "861/.7"
            } else if (Val(Mid(sClassNo$, 3, 4)) == 8097) { //Chile
                sDewey$ = "Period1900"
                Period1.Caption = "Period 1800-1899"
                Period2.Caption = "Period 1900-1945"
                Period3.Caption = "Period 1945-1999"
                sGenre$ = "Poetry"
                sCountry$ = "Chile"
            } else if (Val(Mid(sClassNo$, 3, 4)) > 8097 && Val(Mid(sClassNo$, 3, 7)) < 8098.37) { //Chile
                sDewey$ = "861/.64"
            } else if (Val(Mid(sClassNo$, 3, 7)) > 8098.36 && Val(Mid(sClassNo$, 3, 7)) < 8098.437) { //Chile
                sDewey$ = "861/.7"
            } else if (Val(Mid(sClassNo$, 3, 4)) > 8179 && Val(Mid(sClassNo$, 3, 7)) < 8180.37) { //Colombia
                sDewey$ = "861/.64"
            } else if (Val(Mid(sClassNo$, 3, 7)) > 8180.36 && Val(Mid(sClassNo$, 3, 7)) < 8180.437) { //Colombia
                sDewey$ = "861/.7"
            } else if (Val(Mid(sClassNo$, 3, 4)) > 8219 && Val(Mid(sClassNo$, 3, 7)) < 8220.37) { //Ecuador
                sDewey$ = "861/.64"
            } else if (Val(Mid(sClassNo$, 3, 7)) > 8220.36 && Val(Mid(sClassNo$, 3, 7)) < 8220.437) { //Ecuador
                sDewey$ = "861/.7"
            } else if (Val(Mid(sClassNo$, 3, 6)) == 8259.2) { //Paraguay
                sDewey$ = "861/.64"
            } else if (Val(Mid(sClassNo$, 3, 6)) == 8259.3) { //Paraguay
                sDewey$ = "861/.7"
            } else if (Val(Mid(sClassNo$, 3, 4)) == 8497) { //Peru
                sDewey$ = "Period1900"
                Period1.Caption = "Period 1800-1899"
                Period2.Caption = "Period 1900-1945"
                Period3.Caption = "Period 1945-1999"
                sGenre$ = "Poetry"
                sCountry$ = "Peru"
            } else if (Val(Mid(sClassNo$, 3, 4)) > 8497 && Val(Mid(sClassNo$, 3, 7)) < 8498.37) { //Peru
                sDewey$ = "861/.64"
            } else if (Val(Mid(sClassNo$, 3, 7)) > 8498.36 && Val(Mid(sClassNo$, 3, 7)) < 8498.437) { //Peru
                sDewey$ = "861/.7"
            } else if (Val(Mid(sClassNo$, 3, 4)) > 8519 && Val(Mid(sClassNo$, 3, 7)) < 8520.37) { //Uruguay
                sDewey$ = "861/.64"
            } else if (Val(Mid(sClassNo$, 3, 7)) > 8520.36 && Val(Mid(sClassNo$, 3, 7)) < 8520.437) { //Uruguay
                sDewey$ = "861/.7"
            } else if (Val(Mid(sClassNo$, 3, 4)) > 8549 && Val(Mid(sClassNo$, 3, 7)) < 8550.37) { //Venezuela
                sDewey$ = "861/.64"
            } else if (Val(Mid(sClassNo$, 3, 7)) > 8550.36 && Val(Mid(sClassNo$, 3, 7)) < 8550.437) { //Venezuela
                sDewey$ = "861/.7"
            } else if (Val(Mid(sClassNo$, 3, 4)) == 9189) { //Portugal
                sDewey$ = "869.1/1"
            } else if (Val(Mid(sClassNo$, 3, 4)) > 9190 && Val(Mid(sClassNo$, 3, 4)) < 9256) { //Portugal
                sDewey$ = "869.1/2"
            } else if (Val(Mid(sClassNo$, 3, 4)) > 9261 && Val(Mid(sClassNo$, 3, 4)) < 9289) { //Portugal
                sDewey$ = "869.1/42"
            } else if (Val(Mid(sClassNo$, 3, 4)) > 9299 && Val(Mid(sClassNo$, 3, 4)) < 9327) { //Portugal
                sDewey$ = "869.1/5"
            } else if (Val(Mid(sClassNo$, 3, 4)) == 9696) { //Brazil
                sDewey$ = "Period1500"
                Period1.Caption = "Period to 1499"
                Period2.Caption = "Period 1500-1799"
                sGenre$ = "Poetry"
                sCountry$ = "Brazil"
            } else if (Val(Mid(sClassNo$, 3, 4)) == 9697) { //Brazil
                sDewey$ = "Period1900"
                Period1.Caption = "Period 1800-1899"
                Period2.Caption = "Period 1900-1945"
                Period3.Caption = "Period 1945-1999"
                sGenre$ = "Poetry"
                sCountry$ = "Brazil"
            } else if (Val(Mid(sClassNo$, 3, 4)) > 9697 && Val(Mid(sClassNo$, 3, 7)) < 9698.37) { //Brazil
                sDewey$ = "869.1/42"
            } else if (Val(Mid(sClassNo$, 3, 7)) > 9698.36 && Val(Mid(sClassNo$, 3, 7)) < 9698.437) { //Brazil
                sDewey$ = "869.1/5"
            }
        }

        const _convertClassPrDrama = (sClassNo$) => {
            //British
            if (Val(Mid(sClassNo$, 3, 4)) > 1579 && Val(Mid(sClassNo$, 3, 4)) < 1589) {
                sDewey$ = "829/.3"
            } else if (Val(Mid(sClassNo$, 3, 4)) > 1599 && Val(Mid(sClassNo$, 3, 4)) < 1629) {
                sDewey$ = "829/.2"
            } else if (Val(Mid(sClassNo$, 3, 4)) > 1638 && Val(Mid(sClassNo$, 3, 4)) < 1669) {
                sDewey$ = "829/.4"
            } else if (Val(Mid(sClassNo$, 3, 4)) > 1802 && Val(Mid(sClassNo$, 3, 4)) < 2166) {
                sDewey$ = "Period1400"
                Period1.Caption = "Period 1066-1400"
                Period2.Caption = "Period 1400-1558"
                sGenre$ = "Drama"
                sCountry$ = "UK"
            } else if (Val(Mid(sClassNo$, 3, 4)) > 2198 && Val(Mid(sClassNo$, 3, 4)) < 2750) {
                sDewey$ = "Period1558"
                Period1.Caption = "Period 1400-1558"
                Period2.Caption = "Period 1558-1625"
                Period3.Caption = "Period 1625-1702"
                sGenre$ = "Drama"
                sCountry$ = "UK"
            } else if (Val(Mid(sClassNo$, 3, 4)) > 3134 && Val(Mid(sClassNo$, 3, 4)) < 3196) {
                if (Val(Mid(sClassNo$, 3, 6)) == 3195.2) {
                    sDewey$ = ""
                } else {
                    sDewey$ = "Period1625"
                    Period1.Caption = "Period 1400-1558"
                    Period2.Caption = "Period 1558-1625"
                    Period3.Caption = "Period 1625-1702"
                    sGenre$ = "Drama"
                    sCountry$ = "UK"
                }
            } else if (Val(Mid(sClassNo$, 3, 4)) > 3299 && Val(Mid(sClassNo$, 3, 4)) < 3786) {
                sDewey$ = "Period1702"
                Period1.Caption = "Period 1625-1702"
                Period2.Caption = "Period 1702-1745"
                Period3.Caption = "Period 1745-1799"
                sGenre$ = "Drama"
                sCountry$ = "UK"
            } else if (Val(Mid(sClassNo$, 3, 4)) > 3990 && Val(Mid(sClassNo$, 3, 4)) < 5991) {
                sDewey$ = "Period1800"
                Period1.Caption = "Period 1745-1799"
                Period2.Caption = "Period 1799-1837"
                Period3.Caption = "Period 1837-1899"
                sGenre$ = "Drama"
                sCountry$ = "UK"
            } else if (Val(Mid(sClassNo$, 3, 4)) > 5999 && Val(Mid(sClassNo$, 3, 4)) < 6050) {
                sDewey$ = "Period1945"
                Period1.Caption = "Period 1900-1945"
                Period2.Caption = "Period 1945-1999"
                sGenre$ = "Drama"
                sCountry$ = "UK"
            } else if (Val(Mid(sClassNo$, 3, 4)) > 6049 && Val(Mid(sClassNo$, 3, 4)) < 6077) {
                sDewey$ = "822/.914"
            } else if (Val(Mid(sClassNo$, 3, 4)) > 6100 && Val(Mid(sClassNo$, 3, 4)) < 6127) {
                sDewey$ = "822/.92"

                //Shakespeare drama
            } else if (Val(Mid(sClassNo$, 3, 4)) > 2749 && Val(Mid(sClassNo$, 3, 4)) < 3113) {
                sDewey$ = "822.3/3"


                //Canadian gets same as U.S. below in PS...
            } else if (Val(Mid(sClassNo$, 3, 6)) == "9199.2") {
                sDewey$ = "Period1867"
                Period1.Caption = "Period to 1867"
                Period2.Caption = "Period 1867-1899"
                sGenre$ = "Drama"
                sCountry$ = "Canada"

            } else if (Val(Mid(sClassNo$, 3, 6)) == 9199.3) {
                sDewey$ = "Period1945"
                Period1.Caption = "Period 1900-1945"
                Period2.Caption = "Period 1945-1999"
                sGenre$ = "Drama"
                sCountry$ = "Canada"

            } else if (Val(Mid(sClassNo$, 3, 6)) == 9199.4) {
                sDewey$ = "812/.6"

                //South Africa
            } else if (Val(Mid(sClassNo$, 3, 6)) == 9369.3) {
                sDewey$ = "Period1945"
                Period1.Caption = "Period 1900-1945"
                Period2.Caption = "Period 1945-1999"
                sGenre$ = "Drama"
                sCountry$ = "SoAf"

            } else if (Val(Mid(sClassNo$, 3, 6)) == 9369.4) {
                sDewey$ = "822/.92"

                //Australia
            } else if (Val(Mid(sClassNo$, 3, 6)) == 9619.3) {
                sDewey$ = "Period1945"
                Period1.Caption = "Period 1900-1945"
                Period2.Caption = "Period 1945-1999"
                sGenre$ = "Drama"
                sCountry$ = "Aust"

            } else if (Val(Mid(sClassNo$, 3, 6)) == 9619.4) {
                sDewey$ = "822/.92"

                //New Zealand
            } else if (Val(Mid(sClassNo$, 3, 6)) == 9639.3) {
                sDewey$ = "Period1945"
                Period1.Caption = "Period 1900-1945"
                Period2.Caption = "Period 1945-1999"
                sGenre$ = "Drama"
                sCountry$ = "NZ"

            } else if (Val(Mid(sClassNo$, 3, 6)) == 9639.4) {
                sDewey$ = "822/.92"
            }
        }

        const _convertClassPrFiction = (sClassNo$) => {
            //British
            if (Val(Mid(sClassNo$, 3, 4)) > 1579 && Val(Mid(sClassNo$, 3, 4)) < 1589) {
                sDewey$ = "829/.3"
            } else if (Val(Mid(sClassNo$, 3, 4)) > 1599 && Val(Mid(sClassNo$, 3, 4)) < 1629) {
                sDewey$ = "829/.2"
            } else if (Val(Mid(sClassNo$, 3, 4)) > 1638 && Val(Mid(sClassNo$, 3, 4)) < 1669) {
                sDewey$ = "829/.4"
            } else if (Val(Mid(sClassNo$, 3, 4)) > 1802 && Val(Mid(sClassNo$, 3, 4)) < 2166) {
                sDewey$ = "Period1400"
                Period1.Caption = "Period 1066-1400"
                Period2.Caption = "Period 1400-1558"
                sGenre$ = "Fiction"
                sCountry$ = "UK"
            } else if (Val(Mid(sClassNo$, 3, 4)) > 2198 && Val(Mid(sClassNo$, 3, 4)) < 2750) {
                sDewey$ = "Period1558"
                Period1.Caption = "Period 1400-1558"
                Period2.Caption = "Period 1558-1625"
                Period3.Caption = "Period 1625-1702"
                sGenre$ = "Fiction"
                sCountry$ = "UK"
            } else if (Val(Mid(sClassNo$, 3, 4)) > 3134 && Val(Mid(sClassNo$, 3, 4)) < 3196) {
                if (Val(Mid(sClassNo$, 3, 6)) == 3195.2) {
                    sDewey$ = ""
                } else {
                    sDewey$ = "Period1625"
                    Period1.Caption = "Period 1400-1558"
                    Period2.Caption = "Period 1558-1625"
                    Period3.Caption = "Period 1625-1702"
                    sGenre$ = "Fiction"
                    sCountry$ = "UK"
                }
            } else if (Val(Mid(sClassNo$, 3, 4)) > 3299 && Val(Mid(sClassNo$, 3, 4)) < 3786) {
                sDewey$ = "Period1702"
                Period1.Caption = "Period 1625-1702"
                Period2.Caption = "Period 1702-1745"
                Period3.Caption = "Period 1745-1799"
                sGenre$ = "Fiction"
                sCountry$ = "UK"
            } else if (Val(Mid(sClassNo$, 3, 4)) > 3990 && Val(Mid(sClassNo$, 3, 4)) < 5991) {
                sDewey$ = "Period1800"
                Period1.Caption = "Period 1745-1799"
                Period2.Caption = "Period 1799-1837"
                Period3.Caption = "Period 1837-1899"
                sGenre$ = "Fiction"
                sCountry$ = "UK"
            } else if (Val(Mid(sClassNo$, 3, 4)) > 5999 && Val(Mid(sClassNo$, 3, 4)) < 6050) {
                sDewey$ = "Period1945"
                Period1.Caption = "Period 1900-1945"
                Period2.Caption = "Period 1945-1999"
                sGenre$ = "Fiction"
                sCountry$ = "UK"
            } else if (Val(Mid(sClassNo$, 3, 4)) > 6049 && Val(Mid(sClassNo$, 3, 4)) < 6077) {
                sDewey$ = "823/.914"
            } else if (Val(Mid(sClassNo$, 3, 4)) > 6100 && Val(Mid(sClassNo$, 3, 4)) < 6127) {
                sDewey$ = "823/.92"

                //Canadian gets same as U.S. below in PS...
            } else if (Val(Mid(sClassNo$, 3, 6)) == "9199.2") {
                sDewey$ = "Period1867"
                Period1.Caption = "Period to 1867"
                Period2.Caption = "Period 1867-1899"
                sGenre$ = "Fiction"
                sCountry$ = "Canada"

            } else if (Val(Mid(sClassNo$, 3, 6)) == 9199.3) {
                sDewey$ = "Period1945"
                Period1.Caption = "Period 1900-1945"
                Period2.Caption = "Period 1945-1999"
                sGenre$ = "Fiction"
                sCountry$ = "Canada"

            } else if (Val(Mid(sClassNo$, 3, 6)) == 9199.4) {
                sDewey$ = "813/.6"

                //South Africa
            } else if (Val(Mid(sClassNo$, 3, 6)) == 9369.3) {
                sDewey$ = "Period1945"
                Period1.Caption = "Period 1900-1945"
                Period2.Caption = "Period 1945-1999"
                sGenre$ = "Fiction"
                sCountry$ = "SoAf"

            } else if (Val(Mid(sClassNo$, 3, 6)) == 9369.4) {
                sDewey$ = "823/.92"


                //Australia
            } else if (Val(Mid(sClassNo$, 3, 6)) == 9619.3) {
                sDewey$ = "Period1945"
                Period1.Caption = "Period 1900-1945"
                Period2.Caption = "Period 1945-1999"
                sGenre$ = "Fiction"
                sCountry$ = "Aust"

            } else if (Val(Mid(sClassNo$, 3, 6)) == 9619.4) {
                sDewey$ = "823/.92"

                //New Zealand
            } else if (Val(Mid(sClassNo$, 3, 6)) == 9639.3) {
                sDewey$ = "Period1945"
                Period1.Caption = "Period 1900-1945"
                Period2.Caption = "Period 1945-1999"
                sGenre$ = "Fiction"
                sCountry$ = "NZ"

            } else if (Val(Mid(sClassNo$, 3, 6)) == 9639.4) {
                sDewey$ = "823/.92"

            }
        }

        const _convertClassPrPoetry = (sClassNo$) => {
            //British
            if (Val(Mid(sClassNo$, 3, 4)) > 1579 && Val(Mid(sClassNo$, 3, 4)) < 1589) {
                sDewey$ = "829/.3"
            } else if (Val(Mid(sClassNo$, 3, 4)) > 1599 && Val(Mid(sClassNo$, 3, 4)) < 1629) {
                sDewey$ = "829/.2"
            } else if (Val(Mid(sClassNo$, 3, 4)) > 1638 && Val(Mid(sClassNo$, 3, 4)) < 1669) {
                sDewey$ = "829/.4"
            } else if (Val(Mid(sClassNo$, 3, 4)) > 1802 && Val(Mid(sClassNo$, 3, 4)) < 2166) {
                sDewey$ = "Period1400"
                Period1.Caption = "Period 1066-1400"
                Period2.Caption = "Period 1400-1558"
                sGenre$ = "Poetry"
                sCountry$ = "UK"
            } else if (Val(Mid(sClassNo$, 3, 4)) > 2198 && Val(Mid(sClassNo$, 3, 4)) < 2750) {
                sDewey$ = "Period1558"
                Period1.Caption = "Period 1400-1558"
                Period2.Caption = "Period 1558-1625"
                Period3.Caption = "Period 1625-1702"
                sGenre$ = "Poetry"
                sCountry$ = "UK"
            } else if (Val(Mid(sClassNo$, 3, 4)) > 3134 && Val(Mid(sClassNo$, 3, 4)) < 3196) {
                if (Val(Mid(sClassNo$, 3, 6)) == 3195.2) {
                    sDewey$ = ""
                } else {
                    sDewey$ = "Period1625"
                    Period1.Caption = "Period 1400-1558"
                    Period2.Caption = "Period 1558-1625"
                    Period3.Caption = "Period 1625-1702"
                    sGenre$ = "Poetry"
                    sCountry$ = "UK"
                }
            } else if (Val(Mid(sClassNo$, 3, 4)) > 3299 && Val(Mid(sClassNo$, 3, 4)) < 3786) {
                sDewey$ = "Period1702"
                Period1.Caption = "Period 1625-1702"
                Period2.Caption = "Period 1702-1745"
                Period3.Caption = "Period 1745-1799"
                sGenre$ = "Poetry"
                sCountry$ = "UK"
            } else if (Val(Mid(sClassNo$, 3, 4)) > 3990 && Val(Mid(sClassNo$, 3, 4)) < 5991) {
                sDewey$ = "Period1800"
                Period1.Caption = "Period 1745-1799"
                Period2.Caption = "Period 1799-1837"
                Period3.Caption = "Period 1837-1899"
                sGenre$ = "Poetry"
                sCountry$ = "UK"
            } else if (Val(Mid(sClassNo$, 3, 4)) > 5999 && Val(Mid(sClassNo$, 3, 4)) < 6050) {
                sDewey$ = "Period1945"
                Period1.Caption = "Period 1900-1945"
                Period2.Caption = "Period 1945-1999"
                sGenre$ = "Poetry"
                sCountry$ = "UK"
            } else if (Val(Mid(sClassNo$, 3, 4)) > 6049 && Val(Mid(sClassNo$, 3, 4)) < 6077) {
                sDewey$ = "821/.914"
            } else if (Val(Mid(sClassNo$, 3, 4)) > 6100 && Val(Mid(sClassNo$, 3, 4)) < 6127) {
                sDewey$ = "821/.92"
                //Shakespeare poetry
            } else if (Val(Mid(sClassNo$, 3, 4)) > 2749 && Val(Mid(sClassNo$, 3, 4)) < 3113) {
                sDewey$ = "821/.3"
                //Canadian gets same as U.S. below in PS...
            } else if (Val(Mid(sClassNo$, 3, 6)) == "9199.2") {
                sDewey$ = "Period1867"
                Period1.Caption = "Period to 1867"
                Period2.Caption = "Period 1867-1899"
                sGenre$ = "Poetry"
                sCountry$ = "Canada"
            } else if (Val(Mid(sClassNo$, 3, 6)) == 9199.3) {
                sDewey$ = "Period1945"
                Period1.Caption = "Period 1900-1945"
                Period2.Caption = "Period 1945-1999"
                sGenre$ = "Poetry"
                sCountry$ = "Canada"
            } else if (Val(Mid(sClassNo$, 3, 6)) == "9199.4") {
                sDewey$ = "811/.6"
                //South Africa
            } else if (Val(Mid(sClassNo$, 3, 6)) == 9369.3) {
                sDewey$ = "Period1945"
                Period1.Caption = "Period 1900-1945"
                Period2.Caption = "Period 1945-1999"
                sGenre$ = "Poetry"
                sCountry$ = "SoAf"
            } else if (Val(Mid(sClassNo$, 3, 6)) == 9369.4) {
                sDewey$ = "821/.92"
                //Australia
            } else if (Val(Mid(sClassNo$, 3, 6)) == 9619.3) {
                sDewey$ = "Period1945"
                Period1.Caption = "Period 1900-1945"
                Period2.Caption = "Period 1945-1999"
                sGenre$ = "Poetry"
                sCountry$ = "Aust"
            } else if (Val(Mid(sClassNo$, 3, 6)) == "9619.4") {
                sDewey$ = "821/.92"
                //New Zealand
            } else if (Val(Mid(sClassNo$, 3, 6)) == 9639.3) {
                sDewey$ = "Period1945"
                Period1.Caption = "Period 1900-1945"
                Period2.Caption = "Period 1945-1999"
                sGenre$ = "Poetry"
                sCountry$ = "NZ"
            } else if (Val(Mid(sClassNo$, 3, 6)) == 9639.4) {
                sDewey$ = "821/.92"
            }
        }

        const _convertClassPsDrama = (sClassNo$) => {
            if (Val(Mid(sClassNo$, 3, 3)) > 699 && Val(Mid(sClassNo$, 3, 3)) < 894) {
                sDewey$ = "Period1776"
                Period1.Caption = "Period 1607-1776"
                Period2.Caption = "Period 1776-1829"
                sGenre$ = "Drama"
                sCountry$ = "US"
            } else if (Val(Mid(sClassNo$, 3, 4)) > 990 && Val(Mid(sClassNo$, 3, 4)) < 3391) {
                sDewey$ = "Period1830"
                Period1.Caption = "Period 1776-1830"
                Period2.Caption = "Period 1830-1861"
                Period3.Caption = "Period 1861-1899"
                sGenre$ = "Drama"
                sCountry$ = "US"
            } else if (Val(Mid(sClassNo$, 3, 4)) > 3499 && Val(Mid(sClassNo$, 3, 4)) < 3550) {
                sDewey$ = "Period1945"
                Period1.Caption = "Period 1900-1945"
                Period2.Caption = "Period 1945-1999"
                sGenre$ = "Drama"
                sCountry$ = "US"
            } else if (Val(Mid(sClassNo$, 3, 4)) > 3549 && Val(Mid(sClassNo$, 3, 4)) < 3577) {
                sDewey$ = "812/.54"
            } else if (Val(Mid(sClassNo$, 3, 4)) > 3599 && Val(Mid(sClassNo$, 3, 4)) < 3627) {
                sDewey$ = "812/.6"
            }
        }

        const _convertClassPsFiction = (sClassNo$) => {
            if (Val(Mid(sClassNo$, 3, 3)) > 699 && Val(Mid(sClassNo$, 3, 3)) < 894) {
                sDewey$ = "Period1776"
                Period1.Caption = "Period 1607-1776"
                Period2.Caption = "Period 1776-1829"
                sGenre$ = "Fiction"
                sCountry$ = "US"
            } else if (Val(Mid(sClassNo$, 3, 4)) > 990 && Val(Mid(sClassNo$, 3, 4)) < 3391) {
                sDewey$ = "Period1830"
                Period1.Caption = "Period 1776-1830"
                Period2.Caption = "Period 1830-1861"
                Period3.Caption = "Period 1861-1899"
                sGenre$ = "Fiction"
                sCountry$ = "US"
            } else if (Val(Mid(sClassNo$, 3, 4)) > 3499 && Val(Mid(sClassNo$, 3, 4)) < 3550) {
                sDewey$ = "Period1945"
                Period1.Caption = "Period 1900-1945"
                Period2.Caption = "Period 1945-1999"
                sGenre$ = "Fiction"
                sCountry$ = "US"
            } else if (Val(Mid(sClassNo$, 3, 4)) > 3549 && Val(Mid(sClassNo$, 3, 4)) < 3577) {
                sDewey$ = "813/.54"
            } else if (Val(Mid(sClassNo$, 3, 4)) > 3599 && Val(Mid(sClassNo$, 3, 4)) < 3627) {
                sDewey$ = "813/.6"
            }
        }

        const _convertClassPsPoetry = (sClassNo$) => {
            if (Val(Mid(sClassNo$, 3, 3)) > 699 && Val(Mid(sClassNo$, 3, 3)) < 894) {
                sDewey$ = "Period1776"
                Period1.Caption = "Period 1607-1776"
                Period2.Caption = "Period 1776-1829"
                sGenre$ = "Poetry"
                sCountry$ = "US"
            } else if (Val(Mid(sClassNo$, 3, 4)) > 990 && Val(Mid(sClassNo$, 3, 4)) < 3391) {
                sDewey$ = "Period1830"
                Period1.Caption = "Period 1776-1830"
                Period2.Caption = "Period 1830-1861"
                Period3.Caption = "Period 1861-1899"
                sGenre$ = "Poetry"
                sCountry$ = "US"
            } else if (Val(Mid(sClassNo$, 3, 4)) > 3499 && Val(Mid(sClassNo$, 3, 4)) < 3550) {
                sDewey$ = "Period1945"
                Period1.Caption = "Period 1900-1945"
                Period2.Caption = "Period 1945-1999"
                sGenre$ = "Poetry"
                sCountry$ = "US"
            } else if (Val(Mid(sClassNo$, 3, 4)) > 3549 && Val(Mid(sClassNo$, 3, 4)) < 3577) {
                sDewey$ = "811/.54"
            } else if (Val(Mid(sClassNo$, 3, 4)) > 3599 && Val(Mid(sClassNo$, 3, 4)) < 3627) {
                sDewey$ = "811/.6"
            }
        }

        const _convertClassPtDrama = (sClassNo$) => {
            if (Val(Mid(sClassNo$, 3, 4)) > 1500 && Val(Mid(sClassNo$, 3, 4)) < 1696) {
                sDewey$ = "Period1100"
                Period1.Caption = "Period to 1099"
                Period2.Caption = "Period 1100-1249"
                Period3.Caption = "Period 1250-1349"
                Period4.Caption = "Period 1350-1517"
                sGenre$ = "Drama"
                sCountry$ = "Germany"
            } else if (Val(Mid(sClassNo$, 3, 4)) > 1700 && Val(Mid(sClassNo$, 3, 4)) < 1798) {
                sDewey$ = "Period1300"
                Period1.Caption = "Period 1350-1517"
                Period2.Caption = "Period 1517-1625"
                Period3.Caption = "Period 1625-1749"
                sGenre$ = "Drama"
                sCountry$ = "Germany"
            } else if (Val(Mid(sClassNo$, 3, 4)) > 1798 && Val(Mid(sClassNo$, 3, 4)) < 2593) {
                sDewey$ = "Period1600"
                Period1.Caption = "Period 1625-1749"
                Period2.Caption = "Period 1750-1832"
                Period3.Caption = "Period 1832-1856"
                Period4.Caption = "Period 1856-1899"
                sGenre$ = "Drama"
                sCountry$ = "Germany"
            } else if (Val(Mid(sClassNo$, 3, 4)) > 2599 && Val(Mid(sClassNo$, 3, 4)) < 2654) {
                sDewey$ = "Period1800"
                Period1.Caption = "Period 1856-1899"
                Period2.Caption = "Period 1900-1945"
                Period3.Caption = "Period 1945-1990"
                sGenre$ = "Drama"
                sCountry$ = "Germany"
            } else if (Val(Mid(sClassNo$, 3, 4)) > 2659 && Val(Mid(sClassNo$, 3, 4)) < 2689) {
                sDewey$ = "Period1900"
                Period1.Caption = "Period 1945-1990"
                Period2.Caption = "Period 1990-"
                sGenre$ = "Drama"
                sCountry$ = "Germany"
            } else if (Val(Mid(sClassNo$, 3, 4)) > 2699 && Val(Mid(sClassNo$, 3, 4)) < 2729) {
                sDewey$ = "832/.92"
            } else if (Val(Mid(sClassNo$, 3, 4)) > 7499 && Val(Mid(sClassNo$, 3, 4)) < 7502) {
                sDewey$ = "Period1500"
                Period1.Caption = "Period 1500-1719"
                Period2.Caption = "Period 1720-1835"
                sGenre$ = "Drama"
                sCountry$ = "Iceland"
            } else if (Val(Mid(sClassNo$, 3, 4)) > 7509 && Val(Mid(sClassNo$, 3, 4)) < 7512) {
                sDewey$ = "Period1700"
                Period1.Caption = "Period 1720-1835"
                Period2.Caption = "Period 1835-1899"
                Period3.Caption = "Period 1900-1999"
                sGenre$ = "Drama"
                sCountry$ = "Iceland"
            } else if (Val(Mid(sClassNo$, 3, 4)) > 7511 && Val(Mid(sClassNo$, 3, 4)) < 7514) {
                sDewey$ = "839/.6925"
            } else if (Val(Mid(sClassNo$, 3, 4)) == 8050) {
                sDewey$ = "Period1400"
                Period1.Caption = "Period to 1499"
                Period2.Caption = "Period 1500-1559"
                sGenre$ = "Drama"
                sCountry$ = "Denmark"
            } else if (Val(Mid(sClassNo$, 3, 4)) > 8059 && Val(Mid(sClassNo$, 3, 4)) < 8099) {
                sDewey$ = "Period1500"
                Period1.Caption = "Period 1500-1559"
                Period2.Caption = "Period 1560-1699"
                Period3.Caption = "Period 1700-1749"
                Period4.Caption = "Period 1750-1799"
                sGenre$ = "Drama"
                sCountry$ = "Denmark"
            } else if (Val(Mid(sClassNo$, 3, 4)) > 8099 && Val(Mid(sClassNo$, 3, 4)) < 8168) {
                sDewey$ = "839.812/6"
            } else if (Val(Mid(sClassNo$, 3, 4)) > 8173 && Val(Mid(sClassNo$, 3, 4)) < 8176) {
                sDewey$ = "Period1900"
                Period1.Caption = "Period 1900-1945"
                Period2.Caption = "Period 1945-1999"
                sGenre$ = "Drama"
                sCountry$ = "Denmark"
            } else if (Val(Mid(sClassNo$, 3, 4)) > 8175 && Val(Mid(sClassNo$, 3, 4)) < 8176.37) {
                sDewey$ = "839.812/74"
            } else if (Val(Mid(sClassNo$, 3, 4)) > 8176 && Val(Mid(sClassNo$, 3, 4)) < 8177.37) {
                sDewey$ = "839.812/8"
            } else if (Val(Mid(sClassNo$, 3, 4)) > 8749 && Val(Mid(sClassNo$, 3, 4)) < 8776) {
                sDewey$ = "Period1500"
                Period1.Caption = "Period 1500-1559"
                Period2.Caption = "Period 1560-1699"
                Period3.Caption = "Period 1700-1749"
                Period4.Caption = "Period 1750-1799"
                sGenre$ = "Drama"
                sCountry$ = "Norway"
            } else if (Val(Mid(sClassNo$, 3, 4)) > 8950 && Val(Mid(sClassNo$, 3, 4)) < 8951.37) {
                sDewey$ = "839.822/74"
            } else if (Val(Mid(sClassNo$, 3, 4)) > 8951 && Val(Mid(sClassNo$, 3, 4)) < 8952.37) {
                sDewey$ = "839.822/8"
            } else if (Val(Mid(sClassNo$, 3, 4)) == 9651) {
                sDewey$ = "Period1500"
                Period1.Caption = "Period to 1519"
                Period2.Caption = "Period 1520-1639"
                sGenre$ = "Drama"
                sCountry$ = "Sweden"
            } else if (Val(Mid(sClassNo$, 3, 4)) > 9673 && Val(Mid(sClassNo$, 3, 4)) < 9711) {
                sDewey$ = "Period1600"
                Period1.Caption = "Period to 1519"
                Period2.Caption = "Period 1520-1639"
                Period3.Caption = "Period 1640-1739"
                Period4.Caption = "Period 1740-1779"
                Period5.Caption = "Period 1780-1809"
                sGenre$ = "Drama"
                sCountry$ = "Sweden"
            } else if (Val(Mid(sClassNo$, 3, 4)) > 9724 && Val(Mid(sClassNo$, 3, 4)) < 9851) {
                sDewey$ = "Period1800"
                Period1.Caption = "Period 1780-1809"
                Period2.Caption = "Period 1809-1830"
                Period3.Caption = "Period 1830-1879"
                Period4.Caption = "Period 1879-1909"
                sGenre$ = "Drama"
                sCountry$ = "Sweden"
            } else if (Val(Mid(sClassNo$, 3, 4)) > 9869 && Val(Mid(sClassNo$, 3, 4)) < 9876) {
                sDewey$ = "Period1900"
                Period1.Caption = "Period 1879-1909"
                Period2.Caption = "Period 1909-1945"
                Period3.Caption = "Period 1945-1999"
                sGenre$ = "Drama"
                sCountry$ = "Sweden"
            } else if (Val(Mid(sClassNo$, 3, 4)) > 9875 && Val(Mid(sClassNo$, 3, 4)) < 9876.37) {
                sDewey$ = "839.72/74"
            } else if (Val(Mid(sClassNo$, 3, 4)) > 9876 && Val(Mid(sClassNo$, 3, 4)) < 9877.37) {
                sDewey$ = "839.72/8"
            }
        }

        const _convertClassPtFiction = (sClassNo$) => {
            if (Val(Mid(sClassNo$, 3, 4)) > 1500 && Val(Mid(sClassNo$, 3, 4)) < 1696) {
                sDewey$ = "Period1100"
                Period1.Caption = "Period to 1099"
                Period2.Caption = "Period 1100-1249"
                Period3.Caption = "Period 1250-1349"
                Period4.Caption = "Period 1350-1517"
                sGenre$ = "Fiction"
                sCountry$ = "Germany"
            } else if (Val(Mid(sClassNo$, 3, 4)) > 1700 && Val(Mid(sClassNo$, 3, 4)) < 1798) {
                sDewey$ = "Period1300"
                Period1.Caption = "Period 1350-1517"
                Period2.Caption = "Period 1517-1625"
                Period3.Caption = "Period 1625-1749"
                sGenre$ = "Fiction"
                sCountry$ = "Germany"
            } else if (Val(Mid(sClassNo$, 3, 4)) > 1798 && Val(Mid(sClassNo$, 3, 4)) < 2593) {
                sDewey$ = "Period1600"
                Period1.Caption = "Period 1625-1749"
                Period2.Caption = "Period 1750-1832"
                Period3.Caption = "Period 1832-1856"
                Period4.Caption = "Period 1856-1899"
                sGenre$ = "Fiction"
                sCountry$ = "Germany"
            } else if (Val(Mid(sClassNo$, 3, 4)) > 2599 && Val(Mid(sClassNo$, 3, 4)) < 2654) {
                sDewey$ = "Period1800"
                Period1.Caption = "Period 1856-1899"
                Period2.Caption = "Period 1900-1945"
                Period3.Caption = "Period 1945-1990"
                sGenre$ = "Fiction"
                sCountry$ = "Germany"
            } else if (Val(Mid(sClassNo$, 3, 4)) > 2659 && Val(Mid(sClassNo$, 3, 4)) < 2689) {
                sDewey$ = "Period1900"
                Period1.Caption = "Period 1945-1990"
                Period2.Caption = "Period 1990-"
                sGenre$ = "Fiction"
                sCountry$ = "Germany"
            } else if (Val(Mid(sClassNo$, 3, 4)) > 2699 && Val(Mid(sClassNo$, 3, 4)) < 2729) {
                sDewey$ = "833/.92"
            } else if (Val(Mid(sClassNo$, 3, 4)) > 7499 && Val(Mid(sClassNo$, 3, 4)) < 7502) {
                sDewey$ = "Period1500"
                Period1.Caption = "Period 1500-1719"
                Period2.Caption = "Period 1720-1835"
                sGenre$ = "Fiction"
                sCountry$ = "Iceland"
            } else if (Val(Mid(sClassNo$, 3, 4)) > 7509 && Val(Mid(sClassNo$, 3, 4)) < 7512) {
                sDewey$ = "Period1700"
                Period1.Caption = "Period 1720-1835"
                Period2.Caption = "Period 1835-1899"
                Period3.Caption = "Period 1900-1999"
                sGenre$ = "Fiction"
                sCountry$ = "Iceland"
            } else if (Val(Mid(sClassNo$, 3, 4)) > 7511 && Val(Mid(sClassNo$, 3, 4)) < 7514) {
                sDewey$ = "839/.6935"
            } else if (Val(Mid(sClassNo$, 3, 4)) == 8050) {
                sDewey$ = "Period1400"
                Period1.Caption = "Period to 1499"
                Period2.Caption = "Period 1500-1559"
                sGenre$ = "Fiction"
                sCountry$ = "Denmark"
            } else if (Val(Mid(sClassNo$, 3, 4)) > 8059 && Val(Mid(sClassNo$, 3, 4)) < 8099) {
                sDewey$ = "Period1500"
                Period1.Caption = "Period 1500-1559"
                Period2.Caption = "Period 1560-1699"
                Period3.Caption = "Period 1700-1749"
                Period4.Caption = "Period 1750-1799"
                sGenre$ = "Fiction"
                sCountry$ = "Denmark"
            } else if (Val(Mid(sClassNo$, 3, 4)) > 8099 && Val(Mid(sClassNo$, 3, 4)) < 8168) {
                sDewey$ = "839.813/6"
            } else if (Val(Mid(sClassNo$, 3, 4)) > 8173 && Val(Mid(sClassNo$, 3, 4)) < 8176) {
                sDewey$ = "Period1900"
                Period1.Caption = "Period 1900-1945"
                Period2.Caption = "Period 1945-1999"
                sGenre$ = "Fiction"
                sCountry$ = "Denmark"
            } else if (Val(Mid(sClassNo$, 3, 4)) > 8175 && Val(Mid(sClassNo$, 3, 4)) < 8176.37) {
                sDewey$ = "839.813/74"
            } else if (Val(Mid(sClassNo$, 3, 4)) > 8176 && Val(Mid(sClassNo$, 3, 4)) < 8177.37) {
                sDewey$ = "839.813/8"
            } else if (Val(Mid(sClassNo$, 3, 4)) > 8749 && Val(Mid(sClassNo$, 3, 4)) < 8776) {
                sDewey$ = "Period1500"
                Period1.Caption = "Period 1500-1559"
                Period2.Caption = "Period 1560-1699"
                Period3.Caption = "Period 1700-1749"
                Period4.Caption = "Period 1750-1799"
                sGenre$ = "Fiction"
                sCountry$ = "Norway"
            } else if (Val(Mid(sClassNo$, 3, 4)) > 8950 && Val(Mid(sClassNo$, 3, 4)) < 8951.37) {
                sDewey$ = "839.823/74"
            } else if (Val(Mid(sClassNo$, 3, 4)) > 8951 && Val(Mid(sClassNo$, 3, 4)) < 8952.37) {
                sDewey$ = "839.823/8"
            } else if (Val(Mid(sClassNo$, 3, 4)) == 9651) {
                sDewey$ = "Period1500"
                Period1.Caption = "Period to 1519"
                Period2.Caption = "Period 1520-1639"
                sGenre$ = "Fiction"
                sCountry$ = "Sweden"
            } else if (Val(Mid(sClassNo$, 3, 4)) > 9673 && Val(Mid(sClassNo$, 3, 4)) < 9711) {
                sDewey$ = "Period1600"
                Period1.Caption = "Period to 1519"
                Period2.Caption = "Period 1520-1639"
                Period3.Caption = "Period 1640-1739"
                Period4.Caption = "Period 1740-1779"
                Period5.Caption = "Period 1780-1809"
                sGenre$ = "Fiction"
                sCountry$ = "Sweden"
            } else if (Val(Mid(sClassNo$, 3, 4)) > 9724 && Val(Mid(sClassNo$, 3, 4)) < 9851) {
                sDewey$ = "Period1800"
                Period1.Caption = "Period 1780-1809"
                Period2.Caption = "Period 1809-1830"
                Period3.Caption = "Period 1830-1879"
                Period4.Caption = "Period 1879-1909"
                sGenre$ = "Fiction"
                sCountry$ = "Sweden"
            } else if (Val(Mid(sClassNo$, 3, 4)) > 9869 && Val(Mid(sClassNo$, 3, 4)) < 9876) {
                sDewey$ = "Period1900"
                Period1.Caption = "Period 1879-1909"
                Period2.Caption = "Period 1909-1945"
                Period3.Caption = "Period 1945-1999"
                sGenre$ = "Fiction"
                sCountry$ = "Sweden"
            } else if (Val(Mid(sClassNo$, 3, 4)) > 9875 && Val(Mid(sClassNo$, 3, 4)) < 9876.37) {
                sDewey$ = "839.73/74"
            } else if (Val(Mid(sClassNo$, 3, 4)) > 9876 && Val(Mid(sClassNo$, 3, 4)) < 9877.37) {
                sDewey$ = "839.73/8"
            }
        }

        const _convertClassPtPoetry = (sClassNo$) => {
            if (Val(Mid(sClassNo$, 3, 4)) > 1500 && Val(Mid(sClassNo$, 3, 4)) < 1696) {
                sDewey$ = "Period1100"
                Period1.Caption = "Period to 1099"
                Period2.Caption = "Period 1100-1249"
                Period3.Caption = "Period 1250-1349"
                Period4.Caption = "Period 1350-1517"
                sGenre$ = "Poetry"
                sCountry$ = "Germany"
            } else if (Val(Mid(sClassNo$, 3, 4)) > 1700 && Val(Mid(sClassNo$, 3, 4)) < 1798) {
                sDewey$ = "Period1300"
                Period1.Caption = "Period 1350-1517"
                Period2.Caption = "Period 1517-1625"
                Period3.Caption = "Period 1625-1749"
                sGenre$ = "Poetry"
                sCountry$ = "Germany"
            } else if (Val(Mid(sClassNo$, 3, 4)) > 1798 && Val(Mid(sClassNo$, 3, 4)) < 2593) {
                sDewey$ = "Period1600"
                Period1.Caption = "Period 1625-1749"
                Period2.Caption = "Period 1750-1832"
                Period3.Caption = "Period 1832-1856"
                Period4.Caption = "Period 1856-1899"
                sGenre$ = "Poetry"
                sCountry$ = "Germany"
            } else if (Val(Mid(sClassNo$, 3, 4)) > 2599 && Val(Mid(sClassNo$, 3, 4)) < 2654) {
                sDewey$ = "Period1800"
                Period1.Caption = "Period 1856-1899"
                Period2.Caption = "Period 1900-1945"
                Period3.Caption = "Period 1945-1990"
                sGenre$ = "Poetry"
                sCountry$ = "Germany"
            } else if (Val(Mid(sClassNo$, 3, 4)) > 2659 && Val(Mid(sClassNo$, 3, 4)) < 2689) {
                sDewey$ = "Period1900"
                Period1.Caption = "Period 1945-1990"
                Period2.Caption = "Period 1990-"
                sGenre$ = "Poetry"
                sCountry$ = "Germany"
            } else if (Val(Mid(sClassNo$, 3, 4)) > 2699 && Val(Mid(sClassNo$, 3, 4)) < 2729) {
                sDewey$ = "831/.92"
            } else if (Val(Mid(sClassNo$, 3, 4)) > 7499 && Val(Mid(sClassNo$, 3, 4)) < 7502) {
                sDewey$ = "Period1500"
                Period1.Caption = "Period 1500-1719"
                Period2.Caption = "Period 1720-1835"
                sGenre$ = "Poetry"
                sCountry$ = "Iceland"
            } else if (Val(Mid(sClassNo$, 3, 4)) > 7509 && Val(Mid(sClassNo$, 3, 4)) < 7512) {
                sDewey$ = "Period1700"
                Period1.Caption = "Period 1720-1835"
                Period2.Caption = "Period 1835-1899"
                Period3.Caption = "Period 1900-1999"
                sGenre$ = "Poetry"
                sCountry$ = "Iceland"
            } else if (Val(Mid(sClassNo$, 3, 4)) > 7511 && Val(Mid(sClassNo$, 3, 4)) < 7514) {
                sDewey$ = "839/.6915"
            } else if (Val(Mid(sClassNo$, 3, 4)) == 8050) {
                sDewey$ = "Period1400"
                Period1.Caption = "Period to 1499"
                Period2.Caption = "Period 1500-1559"
                sGenre$ = "Poetry"
                sCountry$ = "Denmark"
            } else if (Val(Mid(sClassNo$, 3, 4)) > 8059 && Val(Mid(sClassNo$, 3, 4)) < 8099) {
                sDewey$ = "Period1500"
                Period1.Caption = "Period 1500-1559"
                Period2.Caption = "Period 1560-1699"
                Period3.Caption = "Period 1700-1749"
                Period4.Caption = "Period 1750-1799"
                sGenre$ = "Poetry"
                sCountry$ = "Denmark"
            } else if (Val(Mid(sClassNo$, 3, 4)) > 8099 && Val(Mid(sClassNo$, 3, 4)) < 8168) {
                sDewey$ = "839.811/6"
            } else if (Val(Mid(sClassNo$, 3, 4)) > 8173 && Val(Mid(sClassNo$, 3, 4)) < 8176) {
                sDewey$ = "Period1900"
                Period1.Caption = "Period 1900-1945"
                Period2.Caption = "Period 1945-1999"
                sGenre$ = "Poetry"
                sCountry$ = "Denmark"
            } else if (Val(Mid(sClassNo$, 3, 4)) > 8175 && Val(Mid(sClassNo$, 3, 4)) < 8176.37) {
                sDewey$ = "839.811/74"
            } else if (Val(Mid(sClassNo$, 3, 4)) > 8176 && Val(Mid(sClassNo$, 3, 4)) < 8177.37) {
                sDewey$ = "839.811/8"
            } else if (Val(Mid(sClassNo$, 3, 4)) > 8749 && Val(Mid(sClassNo$, 3, 4)) < 8776) {
                sDewey$ = "Period1500"
                Period1.Caption = "Period 1500-1559"
                Period2.Caption = "Period 1560-1699"
                Period3.Caption = "Period 1700-1749"
                Period4.Caption = "Period 1750-1799"
                sGenre$ = "Poetry"
                sCountry$ = "Norway"
            } else if (Val(Mid(sClassNo$, 3, 4)) > 8950 && Val(Mid(sClassNo$, 3, 4)) < 8951.37) {
                sDewey$ = "839.821/74"
            } else if (Val(Mid(sClassNo$, 3, 4)) > 8951 && Val(Mid(sClassNo$, 3, 4)) < 8952.37) {
                sDewey$ = "839.821/8"
            } else if (Val(Mid(sClassNo$, 3, 4)) == 9651) {
                sDewey$ = "Period1500"
                Period1.Caption = "Period to 1519"
                Period2.Caption = "Period 1520-1639"
                sGenre$ = "Poetry"
                sCountry$ = "Sweden"
            } else if (Val(Mid(sClassNo$, 3, 4)) > 9673 && Val(Mid(sClassNo$, 3, 4)) < 9711) {
                sDewey$ = "Period1600"
                Period1.Caption = "Period to 1519"
                Period2.Caption = "Period 1520-1639"
                Period3.Caption = "Period 1640-1739"
                Period4.Caption = "Period 1740-1779"
                Period5.Caption = "Period 1780-1809"
                sGenre$ = "Poetry"
                sCountry$ = "Sweden"
            } else if (Val(Mid(sClassNo$, 3, 4)) > 9724 && Val(Mid(sClassNo$, 3, 4)) < 9851) {
                sDewey$ = "Period1800"
                Period1.Caption = "Period 1780-1809"
                Period2.Caption = "Period 1809-1830"
                Period3.Caption = "Period 1830-1879"
                Period4.Caption = "Period 1879-1909"
                sGenre$ = "Poetry"
                sCountry$ = "Sweden"
            } else if (Val(Mid(sClassNo$, 3, 4)) > 9869 && Val(Mid(sClassNo$, 3, 4)) < 9876) {
                sDewey$ = "Period1900"
                Period1.Caption = "Period 1879-1909"
                Period2.Caption = "Period 1909-1945"
                Period3.Caption = "Period 1945-1999"
                sGenre$ = "Poetry"
                sCountry$ = "Sweden"
            } else if (Val(Mid(sClassNo$, 3, 4)) > 9875 && Val(Mid(sClassNo$, 3, 4)) < 9876.37) {
                sDewey$ = "839.71/74"
            } else if (Val(Mid(sClassNo$, 3, 4)) > 9876 && Val(Mid(sClassNo$, 3, 4)) < 9877.37) {
                sDewey$ = "839.71/8"
            }
        }

        //GV
        const _convertClassGvSport = (sClassNo$) => {
            if (Mid(sClassNo$, 3, 8) == "1003.62.") sDewey$ = "796.343092"
            if (Mid(sClassNo$, 3, 8) == "1005.22.") sDewey$ = "796.34/6092"
            if (Mid(sClassNo$, 3, 8) == "1006.52.") sDewey$ = "796.345092"
            if (Mid(sClassNo$, 3, 8) == "1010.32.") sDewey$ = "796.35/3092"
            if (Mid(sClassNo$, 3, 8) == "1015.26.") sDewey$ = "796.325092"
            if (Mid(sClassNo$, 3, 5) == "1032." && Len(sClassNo$) > 8 && InStr(sClassNo$, "1032.A1") == 0) sDewey$ = "796.72092"
            if (Mid(sClassNo$, 3, 5) == "1132.") sDewey$ = "796.83092"
            if (Mid(sClassNo$, 3, 5) == "1186.") sDewey$ = "799.3/2092"
            if (Mid(sClassNo$, 3, 5) == "1196." && Len(sClassNo$) > 8 && InStr(sClassNo$, "1196.A1") == 0) sDewey$ = "796.812092"
            if (Mid(sClassNo$, 3, 7) == "545.52.") sDewey$ = "796.41092"
            if (Mid(sClassNo$, 3, 6) == "848.5." && Len(sClassNo$) > 9 && InStr(sClassNo$, "848.5.A1") == 0) sDewey$ = "796.962092"
            if (Mid(sClassNo$, 3, 4) == "850." && IsNumeric(Mid(sClassNo$, 7, 1)) == false && Len(sClassNo$) > 8 && (InStr(sClassNo$, "850.A1") == 0 && InStr(sClassNo$, "850.A2") == 0)) {
                sDewey$ = [
                    {
                        caption: 'Figure skating',
                        dewey: '796.91/2092'
                    },
                    {
                        caption: 'Speed skating',
                        dewey: '796.91/4092'
                    }
                ]
            }
            if (Mid(sClassNo$, 3, 4) == "865." && Len(sClassNo$) > 8 && InStr(sClassNo$, "865.A1") == 0) sDewey$ = "796.357092"
            if (Mid(sClassNo$, 3, 4) == "884." && Len(sClassNo$) > 8 && InStr(sClassNo$, "884.A1") == 0) sDewey$ = "796.323092"
            if (Mid(sClassNo$, 3, 4) == "915." && Len(sClassNo$) > 8 && InStr(sClassNo$, "915.A1") == 0) sDewey$ = "796.358092"
            if (Mid(sClassNo$, 3, 4) == "939." && Len(sClassNo$) > 8 && InStr(sClassNo$, "939.A1") == 0) {
                sDewey$ = [
                    {
                        caption: 'American football',
                        dewey: '796.332092'
                    },
                    {
                        caption: 'Canadian football',
                        dewey: '796.335092'
                    }
                ]
            }
            if (Mid(sClassNo$, 3, 6) == "942.7." && Len(sClassNo$) > 9 && InStr(sClassNo$, "942.7.A1") == 0) sDewey$ = "796.334092"
            if (Mid(sClassNo$, 3, 6) == "944.9." && Len(sClassNo$) > 9 && InStr(sClassNo$, "944.9.A1") == 0) sDewey$ = "796.333092"
            if (Mid(sClassNo$, 3, 6) == "946.5." && Len(sClassNo$) > 9 && InStr(sClassNo$, "946.5.A1") == 0) sDewey$ = "796.33/6092"
            if (Mid(sClassNo$, 3, 6) == "948.6." && Len(sClassNo$) > 9 && InStr(sClassNo$, "948.6.A1") == 0) sDewey$ = "796.33"
            if (Mid(sClassNo$, 3, 4) == "964." && Len(sClassNo$) > 8 && InStr(sClassNo$, "964.A1") == 0) sDewey$ = "796.352092"
            if (Mid(sClassNo$, 3, 4) == "994." && Len(sClassNo$) > 8 && InStr(sClassNo$, "994.A1") == 0) sDewey$ = "796.342092"
        }

        if (letter == 'PG') {
            if (autoDeweyGenre == 'fiction') {
                _convertClassPgFiction(letter + number)
            } else if (autoDeweyGenre == 'poetry') {
                _convertClassPgPoetry(letter + number)
            } else if (autoDeweyGenre == 'drama') {
                _convertClassPgDrama(letter + number)
            }
        } else if (letter == 'PH') {
            if (autoDeweyGenre == 'fiction') {
                _convertClassPhFiction(letter + number)
            } else if (autoDeweyGenre == 'poetry') {
                _convertClassPhPoetry(letter + number)
            } else if (autoDeweyGenre == 'drama') {
                _convertClassPhDrama(letter + number)
            }
        } else if (letter == 'PQ') {
            if (autoDeweyGenre == 'fiction') {
                _convertClassPqFiction(letter + number)
            } else if (autoDeweyGenre == 'poetry') {
                _convertClassPqPoetry(letter + number)
            } else if (autoDeweyGenre == 'drama') {
                _convertClassPqDrama(letter + number)
            }
        } else if (letter == 'PR') {
            if (autoDeweyGenre == 'fiction') {
                _convertClassPrFiction(letter + number)
            } else if (autoDeweyGenre == 'poetry') {
                _convertClassPrPoetry(letter + number)
            } else if (autoDeweyGenre == 'drama') {
                _convertClassPrDrama(letter + number)
            }
        } else if (letter == 'PS') {
            if (autoDeweyGenre == 'fiction') {
                _convertClassPsFiction(letter + number)
            } else if (autoDeweyGenre == 'poetry') {
                _convertClassPsPoetry(letter + number)
            } else if (autoDeweyGenre == 'drama') {
                _convertClassPsDrama(letter + number)
            }
        } else if (letter == 'PT') {
            if (autoDeweyGenre == 'fiction') {
                _convertClassPtFiction(letter + number)
            } else if (autoDeweyGenre == 'poetry') {
                _convertClassPtPoetry(letter + number)
            } else if (autoDeweyGenre == 'drama') {
                _convertClassPtDrama(letter + number)
            }
        } else if (letter == 'GV') {
            _convertClassGvSport(letter + number)
        }

        if (autoDeweyGenre && !sDewey$) return [
            false,
            {
                error: 'autoDewey mode cannot convert this LCC'
            }
        ]

        const deweyInfo = {
            mode: 'autoDewey',
            dewey: sDewey$,
            genre: sGenre$,
            country: sCountry$,
            periods: []
        }

        if (Period1.Caption) deweyInfo.periods.push(Period1.Caption)
        if (Period2.Caption) deweyInfo.periods.push(Period2.Caption)
        if (Period3.Caption) deweyInfo.periods.push(Period3.Caption)
        if (Period4.Caption) deweyInfo.periods.push(Period4.Caption)
        if (Period5.Caption) deweyInfo.periods.push(Period5.Caption)

        return [
            sDewey$,
            deweyInfo
        ]

    }

    const onAutoDeweyGenreClick = (genre) => {
        if (genre == autoDeweyGenre) return

        setAutoDeweyResult()
        setAutoDeweyGenre(genre)

    }

    const onPeriodClicked = (periodNumber, sDewey$, sGenre$, sCountry$) => {

        console.log('onPeriodClicked', periodNumber, sDewey$, sGenre$, sCountry$)

        let dewey

        if (periodNumber == 1) {
            if (sGenre$ == "Fiction" && sCountry$ == "US" && sDewey$ == "Period1945") dewey = "813/.52"
            if (sGenre$ == "Poetry" && sCountry$ == "US" && sDewey$ == "Period1945") dewey = "811/.52"
            if (sGenre$ == "Drama" && sCountry$ == "US" && sDewey$ == "Period1945") dewey = "812/.52"
            if (sGenre$ == "Fiction" && sCountry$ == "US" && sDewey$ == "Period1776") dewey = "813/.1"
            if (sGenre$ == "Poetry" && sCountry$ == "US" && sDewey$ == "Period1776") dewey = "811/.1"
            if (sGenre$ == "Drama" && sCountry$ == "US" && sDewey$ == "Period1776") dewey = "812/.1"
            if (sGenre$ == "Fiction" && sCountry$ == "US" && sDewey$ == "Period1830") dewey = "813/.2"
            if (sGenre$ == "Poetry" && sCountry$ == "US" && sDewey$ == "Period1830") dewey = "811/.2"
            if (sGenre$ == "Drama" && sCountry$ == "US" && sDewey$ == "Period1830") dewey = "812/.2"
            if (sGenre$ == "Fiction" && sCountry$ == "UK" && sDewey$ == "Period1400") dewey = "823/.1"
            if (sGenre$ == "Poetry" && sCountry$ == "UK" && sDewey$ == "Period1400") dewey = "821/.1"
            if (sGenre$ == "Drama" && sCountry$ == "UK" && sDewey$ == "Period1400") dewey = "822/.1"
            if (sGenre$ == "Fiction" && sCountry$ == "UK" && sDewey$ == "Period1558") dewey = "823/.2"
            if (sGenre$ == "Poetry" && sCountry$ == "UK" && sDewey$ == "Period1558") dewey = "821/.2"
            if (sGenre$ == "Drama" && sCountry$ == "UK" && sDewey$ == "Period1558") dewey = "822/.2"
            if (sGenre$ == "Fiction" && sCountry$ == "UK" && sDewey$ == "Period1625") dewey = "823/.2"
            if (sGenre$ == "Poetry" && sCountry$ == "UK" && sDewey$ == "Period1625") dewey = "821/.2"
            if (sGenre$ == "Drama" && sCountry$ == "UK" && sDewey$ == "Period1625") dewey = "822/.2"
            if (sGenre$ == "Fiction" && sCountry$ == "UK" && sDewey$ == "Period1702") dewey = "823/.4"
            if (sGenre$ == "Poetry" && sCountry$ == "UK" && sDewey$ == "Period1702") dewey = "821/.4"
            if (sGenre$ == "Drama" && sCountry$ == "UK" && sDewey$ == "Period1702") dewey = "822/.4"
            if (sGenre$ == "Fiction" && sCountry$ == "UK" && sDewey$ == "Period1800") dewey = "823/.6"
            if (sGenre$ == "Poetry" && sCountry$ == "UK" && sDewey$ == "Period1800") dewey = "821/.6"
            if (sGenre$ == "Drama" && sCountry$ == "UK" && sDewey$ == "Period1800") dewey = "822/.6"
            if (sGenre$ == "Fiction" && sCountry$ == "UK" && sDewey$ == "Period1945") dewey = "823/.912"
            if (sGenre$ == "Poetry" && sCountry$ == "UK" && sDewey$ == "Period1945") dewey = "821/.912"
            if (sGenre$ == "Drama" && sCountry$ == "UK" && sDewey$ == "Period1945") dewey = "822/.912"
            if (sGenre$ == "Fiction" && sCountry$ == "Canada" && sDewey$ == "Period1867") dewey = "813/.3"
            if (sGenre$ == "Poetry" && sCountry$ == "Canada" && sDewey$ == "Period1867") dewey = "811/.3"
            if (sGenre$ == "Drama" && sCountry$ == "Canada" && sDewey$ == "Period1867") dewey = "812/.3"
            if (sGenre$ == "Fiction" && sCountry$ == "Canada" && sDewey$ == "Period1945") dewey = "813/.52"
            if (sGenre$ == "Poetry" && sCountry$ == "Canada" && sDewey$ == "Period1945") dewey = "811/.52"
            if (sGenre$ == "Drama" && sCountry$ == "Canada" && sDewey$ == "Period1945") dewey = "812/.52"
            if (sGenre$ == "Fiction" && sCountry$ == "SoAf" && sDewey$ == "Period1945") dewey = "823/.912"
            if (sGenre$ == "Poetry" && sCountry$ == "SoAf" && sDewey$ == "Period1945") dewey = "821/.912"
            if (sGenre$ == "Drama" && sCountry$ == "SoAf" && sDewey$ == "Period1945") dewey = "822/.912"
            if (sGenre$ == "Fiction" && sCountry$ == "NZ" && sDewey$ == "Period1945") dewey = "823/.912"
            if (sGenre$ == "Poetry" && sCountry$ == "NZ" && sDewey$ == "Period1945") dewey = "821/.912"
            if (sGenre$ == "Drama" && sCountry$ == "NZ" && sDewey$ == "Period1945") dewey = "822/.912"
            if (sGenre$ == "Fiction" && sCountry$ == "France" && sDewey$ == "Period1400") dewey = "843/.2"
            if (sGenre$ == "Poetry" && sCountry$ == "France" && sDewey$ == "Period1400") dewey = "841/.2"
            if (sGenre$ == "Drama" && sCountry$ == "France" && sDewey$ == "Period1400") dewey = "842/.2"
            if (sGenre$ == "Fiction" && sCountry$ == "France" && sDewey$ == "Period1600") dewey = "843/.4"
            if (sGenre$ == "Poetry" && sCountry$ == "France" && sDewey$ == "Period1600") dewey = "841/.4"
            if (sGenre$ == "Drama" && sCountry$ == "France" && sDewey$ == "Period1600") dewey = "842/.4"
            if (sGenre$ == "Fiction" && sCountry$ == "France" && sDewey$ == "Period1800") dewey = "843/.6"
            if (sGenre$ == "Poetry" && sCountry$ == "France" && sDewey$ == "Period1800") dewey = "841/.6"
            if (sGenre$ == "Drama" && sCountry$ == "France" && sDewey$ == "Period1800") dewey = "842/.6"
            if (sGenre$ == "Fiction" && sCountry$ == "France" && sDewey$ == "Period1945") dewey = "843/.912"
            if (sGenre$ == "Poetry" && sCountry$ == "France" && sDewey$ == "Period1945") dewey = "841/.912"
            if (sGenre$ == "Drama" && sCountry$ == "France" && sDewey$ == "Period1945") dewey = "842/.912"
            if (sGenre$ == "Fiction" && sCountry$ == "Germany" && sDewey$ == "Period1100") dewey = "833/.1"
            if (sGenre$ == "Poetry" && sCountry$ == "Germany" && sDewey$ == "Period1100") dewey = "831/.1"
            if (sGenre$ == "Drama" && sCountry$ == "Germany" && sDewey$ == "Period1100") dewey = "832/.1"
            if (sGenre$ == "Fiction" && sCountry$ == "Germany" && sDewey$ == "Period1300") dewey = "833/.3"
            if (sGenre$ == "Poetry" && sCountry$ == "Germany" && sDewey$ == "Period1300") dewey = "831/.3"
            if (sGenre$ == "Drama" && sCountry$ == "Germany" && sDewey$ == "Period1300") dewey = "832/.3"
            if (sGenre$ == "Fiction" && sCountry$ == "Germany" && sDewey$ == "Period1600") dewey = "833/.5"
            if (sGenre$ == "Poetry" && sCountry$ == "Germany" && sDewey$ == "Period1600") dewey = "831/.5"
            if (sGenre$ == "Drama" && sCountry$ == "Germany" && sDewey$ == "Period1600") dewey = "832/.5"
            if (sGenre$ == "Fiction" && sCountry$ == "Germany" && sDewey$ == "Period1800") dewey = "833/.8"
            if (sGenre$ == "Poetry" && sCountry$ == "Germany" && sDewey$ == "Period1800") dewey = "831/.8"
            if (sGenre$ == "Drama" && sCountry$ == "Germany" && sDewey$ == "Period1800") dewey = "832/.8"
            if (sGenre$ == "Fiction" && sCountry$ == "Germany" && sDewey$ == "Period1900") dewey = "833/.914"
            if (sGenre$ == "Poetry" && sCountry$ == "Germany" && sDewey$ == "Period1900") dewey = "831/.914"
            if (sGenre$ == "Drama" && sCountry$ == "Germany" && sDewey$ == "Period1900") dewey = "832/.914"
            if (sGenre$ == "Fiction" && sCountry$ == "Icel&&" && sDewey$ == "Period1500") dewey = "839/.6931"
            if (sGenre$ == "Poetry" && sCountry$ == "Icel&&" && sDewey$ == "Period1500") dewey = "839/.6911"
            if (sGenre$ == "Drama" && sCountry$ == "Icel&&" && sDewey$ == "Period1500") dewey = "839/.6921"
            if (sGenre$ == "Fiction" && sCountry$ == "Icel&&" && sDewey$ == "Period1700") dewey = "839/.6932"
            if (sGenre$ == "Poetry" && sCountry$ == "Icel&&" && sDewey$ == "Period1700") dewey = "839/.6912"
            if (sGenre$ == "Drama" && sCountry$ == "Icel&&" && sDewey$ == "Period1700") dewey = "839/.6922"
            if (sGenre$ == "Fiction" && sCountry$ == "Sweden" && sDewey$ == "Period1500") dewey = "839.73/1"
            if (sGenre$ == "Poetry" && sCountry$ == "Sweden" && sDewey$ == "Period1500") dewey = "839.71/1"
            if (sGenre$ == "Drama" && sCountry$ == "Sweden" && sDewey$ == "Period1500") dewey = "839.72/1"
            if (sGenre$ == "Fiction" && sCountry$ == "Sweden" && sDewey$ == "Period1600") dewey = "839.73/1"
            if (sGenre$ == "Poetry" && sCountry$ == "Sweden" && sDewey$ == "Period1600") dewey = "839.71/1"
            if (sGenre$ == "Drama" && sCountry$ == "Sweden" && sDewey$ == "Period1600") dewey = "839.72/1"
            if (sGenre$ == "Fiction" && sCountry$ == "Sweden" && sDewey$ == "Period1800") dewey = "839.73/5"
            if (sGenre$ == "Poetry" && sCountry$ == "Sweden" && sDewey$ == "Period1800") dewey = "839.71/5"
            if (sGenre$ == "Drama" && sCountry$ == "Sweden" && sDewey$ == "Period1800") dewey = "839.72/5"
            if (sGenre$ == "Fiction" && sCountry$ == "Sweden" && sDewey$ == "Period1900") dewey = "839.73/67"
            if (sGenre$ == "Poetry" && sCountry$ == "Sweden" && sDewey$ == "Period1900") dewey = "839.71/67"
            if (sGenre$ == "Drama" && sCountry$ == "Sweden" && sDewey$ == "Period1900") dewey = "839.72/67"
            if (sGenre$ == "Fiction" && sCountry$ == "Denmark" && sDewey$ == "Period1400") dewey = "839.813/1"
            if (sGenre$ == "Poetry" && sCountry$ == "Denmark" && sDewey$ == "Period1400") dewey = "839.811/1"
            if (sGenre$ == "Drama" && sCountry$ == "Denmark" && sDewey$ == "Period1400") dewey = "839.812/1"
            if (sGenre$ == "Fiction" && sCountry$ == "Denmark" && sDewey$ == "Period1500") dewey = "839.813/2"
            if (sGenre$ == "Poetry" && sCountry$ == "Denmark" && sDewey$ == "Period1500") dewey = "839.811/2"
            if (sGenre$ == "Drama" && sCountry$ == "Denmark" && sDewey$ == "Period1500") dewey = "839.812/2"
            if (sGenre$ == "Fiction" && sCountry$ == "Denmark" && sDewey$ == "Period1900") dewey = "839.813/72"
            if (sGenre$ == "Poetry" && sCountry$ == "Denmark" && sDewey$ == "Period1900") dewey = "839.811/72"
            if (sGenre$ == "Drama" && sCountry$ == "Denmark" && sDewey$ == "Period1900") dewey = "839.812/72"
            if (sGenre$ == "Fiction" && sCountry$ == "Norway" && sDewey$ == "Period1500") dewey = "839.823/2"
            if (sGenre$ == "Poetry" && sCountry$ == "Norway" && sDewey$ == "Period1500") dewey = "839.821/2"
            if (sGenre$ == "Drama" && sCountry$ == "Norway" && sDewey$ == "Period1500") dewey = "839.822/2"
            if (sGenre$ == "Fiction" && sCountry$ == "Italy" && sDewey$ == "Period1300") dewey = "853/.1"
            if (sGenre$ == "Poetry" && sCountry$ == "Italy" && sDewey$ == "Period1300") dewey = "851/.1"
            if (sGenre$ == "Drama" && sCountry$ == "Italy" && sDewey$ == "Period1300") dewey = "852/.1"
            if (sGenre$ == "Fiction" && sCountry$ == "Italy" && sDewey$ == "Period1400") dewey = "853/.2"
            if (sGenre$ == "Poetry" && sCountry$ == "Italy" && sDewey$ == "Period1400") dewey = "851/.2"
            if (sGenre$ == "Drama" && sCountry$ == "Italy" && sDewey$ == "Period1400") dewey = "852/.2"
            if (sGenre$ == "Fiction" && sCountry$ == "Italy" && sDewey$ == "Period1600") dewey = "853/.5"
            if (sGenre$ == "Poetry" && sCountry$ == "Italy" && sDewey$ == "Period1600") dewey = "851/.5"
            if (sGenre$ == "Drama" && sCountry$ == "Italy" && sDewey$ == "Period1600") dewey = "852/.5"
            if (sGenre$ == "Fiction" && sCountry$ == "Italy" && sDewey$ == "Period1945") dewey = "853/.912"
            if (sGenre$ == "Poetry" && sCountry$ == "Italy" && sDewey$ == "Period1945") dewey = "851/.912"
            if (sGenre$ == "Drama" && sCountry$ == "Italy" && sDewey$ == "Period1945") dewey = "852/.912"
            if (sGenre$ == "Fiction" && sCountry$ == "Aust" && sDewey$ == "Period1945") dewey = "823/.912"
            if (sGenre$ == "Poetry" && sCountry$ == "Aust" && sDewey$ == "Period1945") dewey = "821/.912"
            if (sGenre$ == "Drama" && sCountry$ == "Aust" && sDewey$ == "Period1945") dewey = "822/.912"
            if (sGenre$ == "Fiction" && sCountry$ == "Spain" && sDewey$ == "Period1800") dewey = "863/.4"
            if (sGenre$ == "Poetry" && sCountry$ == "Spain" && sDewey$ == "Period1800") dewey = "861/.4"
            if (sGenre$ == "Drama" && sCountry$ == "Spain" && sDewey$ == "Period1800") dewey = "862/.4"
            if (sGenre$ == "Fiction" && sCountry$ == "Spain" && sDewey$ == "Period1900") dewey = "863/.5"
            if (sGenre$ == "Poetry" && sCountry$ == "Spain" && sDewey$ == "Period1900") dewey = "861/.5"
            if (sGenre$ == "Drama" && sCountry$ == "Spain" && sDewey$ == "Period1900") dewey = "862/.5"
            if (sGenre$ == "Fiction" && sCountry$ == "Mexico" && sDewey$ == "Period1900") dewey = "863/.5"
            if (sGenre$ == "Poetry" && sCountry$ == "Mexico" && sDewey$ == "Period1900") dewey = "861/.5"
            if (sGenre$ == "Drama" && sCountry$ == "Mexico" && sDewey$ == "Period1900") dewey = "862/.5"
            if (sGenre$ == "Fiction" && sCountry$ == "Argentina" && sDewey$ == "Period1900") dewey = "863/.5"
            if (sGenre$ == "Poetry" && sCountry$ == "Argentina" && sDewey$ == "Period1900") dewey = "861/.5"
            if (sGenre$ == "Drama" && sCountry$ == "Argentina" && sDewey$ == "Period1900") dewey = "862/.5"
            if (sGenre$ == "Fiction" && sCountry$ == "Chile" && sDewey$ == "Period1900") dewey = "863/.5"
            if (sGenre$ == "Poetry" && sCountry$ == "Chile" && sDewey$ == "Period1900") dewey = "861/.5"
            if (sGenre$ == "Drama" && sCountry$ == "Chile" && sDewey$ == "Period1900") dewey = "862/.5"
            if (sGenre$ == "Fiction" && sCountry$ == "Peru" && sDewey$ == "Period1900") dewey = "863/.5"
            if (sGenre$ == "Poetry" && sCountry$ == "Peru" && sDewey$ == "Period1900") dewey = "861/.5"
            if (sGenre$ == "Drama" && sCountry$ == "Peru" && sDewey$ == "Period1900") dewey = "862/.5"
            if (sGenre$ == "Fiction" && sCountry$ == "Brazil" && sDewey$ == "Period1500") dewey = "869.3/1"
            if (sGenre$ == "Poetry" && sCountry$ == "Brazil" && sDewey$ == "Period1500") dewey = "869.1/1"
            if (sGenre$ == "Drama" && sCountry$ == "Brazil" && sDewey$ == "Period1500") dewey = "869.2/1"
            if (sGenre$ == "Fiction" && sCountry$ == "Brazil" && sDewey$ == "Period1900") dewey = "869.3/3"
            if (sGenre$ == "Poetry" && sCountry$ == "Brazil" && sDewey$ == "Period1900") dewey = "869.1/3"
            if (sGenre$ == "Drama" && sCountry$ == "Brazil" && sDewey$ == "Period1900") dewey = "869.2/3"
            if (sGenre$ == "Fiction" && sCountry$ == "Russia" && sDewey$ == "Period1917") dewey = "891.73/42"
            if (sGenre$ == "Poetry" && sCountry$ == "Russia" && sDewey$ == "Period1917") dewey = "891.71/42"
            if (sGenre$ == "Drama" && sCountry$ == "Russia" && sDewey$ == "Period1917") dewey = "891.72/42"
            if (sGenre$ == "Fiction" && sCountry$ == "Russia" && sDewey$ == "Period1945") dewey = "891.73/44"
            if (sGenre$ == "Poetry" && sCountry$ == "Russia" && sDewey$ == "Period1945") dewey = "891.71/44"
            if (sGenre$ == "Drama" && sCountry$ == "Russia" && sDewey$ == "Period1945") dewey = "891.72/44"
            if (sGenre$ == "Fiction" && sCountry$ == "Lithuania" && sDewey$ == "Period1800") dewey = "891/.9231"
            if (sGenre$ == "Poetry" && sCountry$ == "Lithuania" && sDewey$ == "Period1800") dewey = "891/.9211"
            if (sGenre$ == "Drama" && sCountry$ == "Lithuania" && sDewey$ == "Period1800") dewey = "891/.9221"
            if (sGenre$ == "Fiction" && sCountry$ == "Lithuania" && sDewey$ == "Period1900") dewey = "891/.9233"
            if (sGenre$ == "Poetry" && sCountry$ == "Lithuania" && sDewey$ == "Period1900") dewey = "891/.9213"
            if (sGenre$ == "Drama" && sCountry$ == "Lithuania" && sDewey$ == "Period1900") dewey = "891/.9223"
            if (sGenre$ == "Fiction" && sCountry$ == "Latvia" && sDewey$ == "Period1800") dewey = "891/.9331"
            if (sGenre$ == "Poetry" && sCountry$ == "Latvia" && sDewey$ == "Period1800") dewey = "891/.9311"
            if (sGenre$ == "Drama" && sCountry$ == "Latvia" && sDewey$ == "Period1800") dewey = "891/.9321"
            if (sGenre$ == "Fiction" && sCountry$ == "Latvia" && sDewey$ == "Period1900") dewey = "891/.9333"
            if (sGenre$ == "Poetry" && sCountry$ == "Latvia" && sDewey$ == "Period1900") dewey = "891/.9313"
            if (sGenre$ == "Drama" && sCountry$ == "Latvia" && sDewey$ == "Period1900") dewey = "891/.9323"
            if (sGenre$ == "Fiction" && sCountry$ == "Finland" && sDewey$ == "Period1800") dewey = "894/.54132"
            if (sGenre$ == "Poetry" && sCountry$ == "Finland" && sDewey$ == "Period1800") dewey = "894/.54112"
            if (sGenre$ == "Drama" && sCountry$ == "Finland" && sDewey$ == "Period1800") dewey = "894/.54122"
            if (sGenre$ == "Fiction" && sCountry$ == "Estonia" && sDewey$ == "Period1800") dewey = "894/.54531"
            if (sGenre$ == "Poetry" && sCountry$ == "Estonia" && sDewey$ == "Period1800") dewey = "894/.54511"
            if (sGenre$ == "Drama" && sCountry$ == "Estonia" && sDewey$ == "Period1800") dewey = "894/.54521"
            if (sGenre$ == "Fiction" && sCountry$ == "Estonia" && sDewey$ == "Period1900") dewey = "894/.54532"
            if (sGenre$ == "Poetry" && sCountry$ == "Estonia" && sDewey$ == "Period1900") dewey = "894/.54512"
            if (sGenre$ == "Drama" && sCountry$ == "Estonia" && sDewey$ == "Period1900") dewey = "894/.54522"
        } else if (periodNumber == 2) {
            if (sGenre$ = "Fiction" && sCountry$ == "US" && sDewey$ == "Period1945") dewey = "813/.54"
            if (sGenre$ = "Poetry" && sCountry$ == "US" && sDewey$ == "Period1945") dewey = "811/.54"
            if (sGenre$ = "Drama" && sCountry$ == "US" && sDewey$ == "Period1945") dewey = "812/.54"
            if (sGenre$ = "Fiction" && sCountry$ == "US" && sDewey$ == "Period1776") dewey = "813/.2"
            if (sGenre$ = "Poetry" && sCountry$ == "US" && sDewey$ == "Period1776") dewey = "811/.2"
            if (sGenre$ = "Drama" && sCountry$ == "US" && sDewey$ == "Period1776") dewey = "812/.2"
            if (sGenre$ = "Fiction" && sCountry$ == "US" && sDewey$ == "Period1830") dewey = "813/.3"
            if (sGenre$ = "Poetry" && sCountry$ == "US" && sDewey$ == "Period1830") dewey = "811/.3"
            if (sGenre$ = "Drama" && sCountry$ == "US" && sDewey$ == "Period1830") dewey = "812/.3"
            if (sGenre$ = "Fiction" && sCountry$ == "UK" && sDewey$ == "Period1400") dewey = "823/.2"
            if (sGenre$ = "Poetry" && sCountry$ == "UK" && sDewey$ == "Period1400") dewey = "821/.2"
            if (sGenre$ = "Drama" && sCountry$ == "UK" && sDewey$ == "Period1400") dewey = "822/.2"
            if (sGenre$ = "Fiction" && sCountry$ == "UK" && sDewey$ == "Period1558") dewey = "823/.3"
            if (sGenre$ = "Poetry" && sCountry$ == "UK" && sDewey$ == "Period1558") dewey = "821/.3"
            if (sGenre$ = "Drama" && sCountry$ == "UK" && sDewey$ == "Period1558") dewey = "822/.3"
            if (sGenre$ = "Fiction" && sCountry$ == "UK" && sDewey$ == "Period1625") dewey = "823/.3"
            if (sGenre$ = "Poetry" && sCountry$ == "UK" && sDewey$ == "Period1625") dewey = "821/.3"
            if (sGenre$ = "Drama" && sCountry$ == "UK" && sDewey$ == "Period1625") dewey = "822/.3"
            if (sGenre$ = "Fiction" && sCountry$ == "UK" && sDewey$ == "Period1702") dewey = "823/.5"
            if (sGenre$ = "Poetry" && sCountry$ == "UK" && sDewey$ == "Period1702") dewey = "821/.5"
            if (sGenre$ = "Drama" && sCountry$ == "UK" && sDewey$ == "Period1702") dewey = "822/.5"
            if (sGenre$ = "Fiction" && sCountry$ == "UK" && sDewey$ == "Period1800") dewey = "823/.7"
            if (sGenre$ = "Poetry" && sCountry$ == "UK" && sDewey$ == "Period1800") dewey = "821/.7"
            if (sGenre$ = "Drama" && sCountry$ == "UK" && sDewey$ == "Period1800") dewey = "822/.7"
            if (sGenre$ = "Fiction" && sCountry$ == "UK" && sDewey$ == "Period1945") dewey = "823/.914"
            if (sGenre$ = "Poetry" && sCountry$ == "UK" && sDewey$ == "Period1945") dewey = "821/.914"
            if (sGenre$ = "Drama" && sCountry$ == "UK" && sDewey$ == "Period1945") dewey = "822/.914"
            if (sGenre$ = "Fiction" && sCountry$ == "Canada" && sDewey$ == "Period1867") dewey = "813/.4"
            if (sGenre$ = "Poetry" && sCountry$ == "Canada" && sDewey$ == "Period1867") dewey = "811/.4"
            if (sGenre$ = "Drama" && sCountry$ == "Canada" && sDewey$ == "Period1867") dewey = "812/.4"
            if (sGenre$ = "Fiction" && sCountry$ == "Canada" && sDewey$ == "Period1945") dewey = "813/.54"
            if (sGenre$ = "Poetry" && sCountry$ == "Canada" && sDewey$ == "Period1945") dewey = "811/.54"
            if (sGenre$ = "Drama" && sCountry$ == "Canada" && sDewey$ == "Period1945") dewey = "812/.54"
            if (sGenre$ = "Fiction" && sCountry$ == "SoAf" && sDewey$ == "Period1945") dewey = "823/.914"
            if (sGenre$ = "Poetry" && sCountry$ == "SoAf" && sDewey$ == "Period1945") dewey = "821/.914"
            if (sGenre$ = "Drama" && sCountry$ == "SoAf" && sDewey$ == "Period1945") dewey = "822/.914"
            if (sGenre$ = "Fiction" && sCountry$ == "NZ" && sDewey$ == "Period1945") dewey = "823/.914"
            if (sGenre$ = "Poetry" && sCountry$ == "NZ" && sDewey$ == "Period1945") dewey = "821/.914"
            if (sGenre$ = "Drama" && sCountry$ == "NZ" && sDewey$ == "Period1945") dewey = "822/.914"
            if (sGenre$ = "Fiction" && sCountry$ == "France" && sDewey$ == "Period1400") dewey = "843/.3"
            if (sGenre$ = "Poetry" && sCountry$ == "France" && sDewey$ == "Period1400") dewey = "841/.3"
            if (sGenre$ = "Drama" && sCountry$ == "France" && sDewey$ == "Period1400") dewey = "842/.3"
            if (sGenre$ = "Fiction" && sCountry$ == "France" && sDewey$ == "Period1600") dewey = "843/.5"
            if (sGenre$ = "Poetry" && sCountry$ == "France" && sDewey$ == "Period1600") dewey = "841/.5"
            if (sGenre$ = "Drama" && sCountry$ == "France" && sDewey$ == "Period1600") dewey = "842/.5"
            if (sGenre$ = "Fiction" && sCountry$ == "France" && sDewey$ == "Period1800") dewey = "843/.7"
            if (sGenre$ = "Poetry" && sCountry$ == "France" && sDewey$ == "Period1800") dewey = "841/.7"
            if (sGenre$ = "Drama" && sCountry$ == "France" && sDewey$ == "Period1800") dewey = "842/.7"
            if (sGenre$ = "Fiction" && sCountry$ == "France" && sDewey$ == "Period1945") dewey = "843/.914"
            if (sGenre$ = "Poetry" && sCountry$ == "France" && sDewey$ == "Period1945") dewey = "841/.914"
            if (sGenre$ = "Drama" && sCountry$ == "France" && sDewey$ == "Period1945") dewey = "842/.914"
            if (sGenre$ = "Fiction" && sCountry$ == "Germany" && sDewey$ == "Period1100") dewey = "833/.21"
            if (sGenre$ = "Poetry" && sCountry$ == "Germany" && sDewey$ == "Period1100") dewey = "831/.21"
            if (sGenre$ = "Drama" && sCountry$ == "Germany" && sDewey$ == "Period1100") dewey = "832/.21"
            if (sGenre$ = "Fiction" && sCountry$ == "Germany" && sDewey$ == "Period1300") dewey = "833/.4"
            if (sGenre$ = "Poetry" && sCountry$ == "Germany" && sDewey$ == "Period1300") dewey = "831/.4"
            if (sGenre$ = "Drama" && sCountry$ == "Germany" && sDewey$ == "Period1300") dewey = "832/.4"
            if (sGenre$ = "Fiction" && sCountry$ == "Germany" && sDewey$ == "Period1600") dewey = "833/.6"
            if (sGenre$ = "Poetry" && sCountry$ == "Germany" && sDewey$ == "Period1600") dewey = "831/.6"
            if (sGenre$ = "Drama" && sCountry$ == "Germany" && sDewey$ == "Period1600") dewey = "832/.6"
            if (sGenre$ = "Fiction" && sCountry$ == "Germany" && sDewey$ == "Period1800") dewey = "833/.912"
            if (sGenre$ = "Poetry" && sCountry$ == "Germany" && sDewey$ == "Period1800") dewey = "831/.912"
            if (sGenre$ = "Drama" && sCountry$ == "Germany" && sDewey$ == "Period1800") dewey = "832/.912"
            if (sGenre$ = "Fiction" && sCountry$ == "Germany" && sDewey$ == "Period1900") dewey = "833/.92"
            if (sGenre$ = "Poetry" && sCountry$ == "Germany" && sDewey$ == "Period1900") dewey = "831/.92"
            if (sGenre$ = "Drama" && sCountry$ == "Germany" && sDewey$ == "Period1900") dewey = "832/.92"
            if (sGenre$ = "Fiction" && sCountry$ == "Iceland" && sDewey$ == "Period1500") dewey = "839/.6932"
            if (sGenre$ = "Poetry" && sCountry$ == "Iceland" && sDewey$ == "Period1500") dewey = "839/.6912"
            if (sGenre$ = "Drama" && sCountry$ == "Iceland" && sDewey$ == "Period1500") dewey = "839/.6922"
            if (sGenre$ = "Fiction" && sCountry$ == "Iceland" && sDewey$ == "Period1700") dewey = "839/.6933"
            if (sGenre$ = "Poetry" && sCountry$ == "Iceland" && sDewey$ == "Period1700") dewey = "839/.6913"
            if (sGenre$ = "Drama" && sCountry$ == "Iceland" && sDewey$ == "Period1700") dewey = "839/.6923"
            if (sGenre$ = "Fiction" && sCountry$ == "Sweden" && sDewey$ == "Period1500") dewey = "839.73/2"
            if (sGenre$ = "Poetry" && sCountry$ == "Sweden" && sDewey$ == "Period1500") dewey = "839.71/2"
            if (sGenre$ = "Drama" && sCountry$ == "Sweden" && sDewey$ == "Period1500") dewey = "839.72/2"
            if (sGenre$ = "Fiction" && sCountry$ == "Sweden" && sDewey$ == "Period1600") dewey = "839.73/2"
            if (sGenre$ = "Poetry" && sCountry$ == "Sweden" && sDewey$ == "Period1600") dewey = "839.71/2"
            if (sGenre$ = "Drama" && sCountry$ == "Sweden" && sDewey$ == "Period1600") dewey = "839.72/2"
            if (sGenre$ = "Fiction" && sCountry$ == "Sweden" && sDewey$ == "Period1800") dewey = "839.73/62"
            if (sGenre$ = "Poetry" && sCountry$ == "Sweden" && sDewey$ == "Period1800") dewey = "839.71/62"
            if (sGenre$ = "Drama" && sCountry$ == "Sweden" && sDewey$ == "Period1800") dewey = "839.72/62"
            if (sGenre$ = "Fiction" && sCountry$ == "Sweden" && sDewey$ == "Period1900") dewey = "839.73/72"
            if (sGenre$ = "Poetry" && sCountry$ == "Sweden" && sDewey$ == "Period1900") dewey = "839.71/72"
            if (sGenre$ = "Drama" && sCountry$ == "Sweden" && sDewey$ == "Period1900") dewey = "839.72/72"
            if (sGenre$ = "Fiction" && sCountry$ == "Denmark" && sDewey$ == "Period1400") dewey = "839.813/2"
            if (sGenre$ = "Poetry" && sCountry$ == "Denmark" && sDewey$ == "Period1400") dewey = "839.811/2"
            if (sGenre$ = "Drama" && sCountry$ == "Denmark" && sDewey$ == "Period1400") dewey = "839.812/2"
            if (sGenre$ = "Fiction" && sCountry$ == "Denmark" && sDewey$ == "Period1500") dewey = "839.813/3"
            if (sGenre$ = "Poetry" && sCountry$ == "Denmark" && sDewey$ == "Period1500") dewey = "839.811/3"
            if (sGenre$ = "Drama" && sCountry$ == "Denmark" && sDewey$ == "Period1500") dewey = "839.812/3"
            if (sGenre$ = "Fiction" && sCountry$ == "Denmark" && sDewey$ == "Period1900") dewey = "839.813/74"
            if (sGenre$ = "Poetry" && sCountry$ == "Denmark" && sDewey$ == "Period1900") dewey = "839.811/74"
            if (sGenre$ = "Drama" && sCountry$ == "Denmark" && sDewey$ == "Period1900") dewey = "839.812/74"
            if (sGenre$ = "Fiction" && sCountry$ == "Norway" && sDewey$ == "Period1500") dewey = "839.823/3"
            if (sGenre$ = "Poetry" && sCountry$ == "Norway" && sDewey$ == "Period1500") dewey = "839.821/3"
            if (sGenre$ = "Drama" && sCountry$ == "Norway" && sDewey$ == "Period1500") dewey = "839.822/3"
            if (sGenre$ = "Fiction" && sCountry$ == "Italy" && sDewey$ == "Period1300") dewey = "853/.2"
            if (sGenre$ = "Poetry" && sCountry$ == "Italy" && sDewey$ == "Period1300") dewey = "851/.2"
            if (sGenre$ = "Drama" && sCountry$ == "Italy" && sDewey$ == "Period1300") dewey = "852/.2"
            if (sGenre$ = "Fiction" && sCountry$ == "Italy" && sDewey$ == "Period1400") dewey = "853/.3"
            if (sGenre$ = "Poetry" && sCountry$ == "Italy" && sDewey$ == "Period1400") dewey = "851/.3"
            if (sGenre$ = "Drama" && sCountry$ == "Italy" && sDewey$ == "Period1400") dewey = "852/.3"
            if (sGenre$ = "Fiction" && sCountry$ == "Italy" && sDewey$ == "Period1600") dewey = "853/.6"
            if (sGenre$ = "Poetry" && sCountry$ == "Italy" && sDewey$ == "Period1600") dewey = "851/.6"
            if (sGenre$ = "Drama" && sCountry$ == "Italy" && sDewey$ == "Period1600") dewey = "852/.6"
            if (sGenre$ = "Fiction" && sCountry$ == "Italy" && sDewey$ == "Period1945") dewey = "853/.914"
            if (sGenre$ = "Poetry" && sCountry$ == "Italy" && sDewey$ == "Period1945") dewey = "851/.914"
            if (sGenre$ = "Drama" && sCountry$ == "Italy" && sDewey$ == "Period1945") dewey = "852/.914"
            if (sGenre$ = "Fiction" && sCountry$ == "Aust" && sDewey$ == "Period1945") dewey = "823/.914"
            if (sGenre$ = "Poetry" && sCountry$ == "Aust" && sDewey$ == "Period1945") dewey = "821/.914"
            if (sGenre$ = "Drama" && sCountry$ == "Aust" && sDewey$ == "Period1945") dewey = "822/.914"
            if (sGenre$ = "Fiction" && sCountry$ == "Spain" && sDewey$ == "Period1800") dewey = "863/.5"
            if (sGenre$ = "Poetry" && sCountry$ == "Spain" && sDewey$ == "Period1800") dewey = "861/.5"
            if (sGenre$ = "Drama" && sCountry$ == "Spain" && sDewey$ == "Period1800") dewey = "862/.5"
            if (sGenre$ = "Fiction" && sCountry$ == "Spain" && sDewey$ == "Period1900") dewey = "863/.62"
            if (sGenre$ = "Poetry" && sCountry$ == "Spain" && sDewey$ == "Period1900") dewey = "861/.62"
            if (sGenre$ = "Drama" && sCountry$ == "Spain" && sDewey$ == "Period1900") dewey = "862/.62"
            if (sGenre$ = "Fiction" && sCountry$ == "Mexico" && sDewey$ == "Period1900") dewey = "863/.62"
            if (sGenre$ = "Poetry" && sCountry$ == "Mexico" && sDewey$ == "Period1900") dewey = "861/.62"
            if (sGenre$ = "Drama" && sCountry$ == "Mexico" && sDewey$ == "Period1900") dewey = "862/.62"
            if (sGenre$ = "Fiction" && sCountry$ == "Argentina" && sDewey$ == "Period1900") dewey = "863/.62"
            if (sGenre$ = "Poetry" && sCountry$ == "Argentina" && sDewey$ == "Period1900") dewey = "861/.62"
            if (sGenre$ = "Drama" && sCountry$ == "Argentina" && sDewey$ == "Period1900") dewey = "862/.62"
            if (sGenre$ = "Fiction" && sCountry$ == "Chile" && sDewey$ == "Period1900") dewey = "863/.62"
            if (sGenre$ = "Poetry" && sCountry$ == "Chile" && sDewey$ == "Period1900") dewey = "861/.62"
            if (sGenre$ = "Drama" && sCountry$ == "Chile" && sDewey$ == "Period1900") dewey = "862/.62"
            if (sGenre$ = "Fiction" && sCountry$ == "Peru" && sDewey$ == "Period1900") dewey = "863/.62"
            if (sGenre$ = "Poetry" && sCountry$ == "Peru" && sDewey$ == "Period1900") dewey = "861/.62"
            if (sGenre$ = "Drama" && sCountry$ == "Peru" && sDewey$ == "Period1900") dewey = "862/.62"
            if (sGenre$ = "Fiction" && sCountry$ == "Brazil" && sDewey$ == "Period1500") dewey = "869.3/2"
            if (sGenre$ = "Poetry" && sCountry$ == "Brazil" && sDewey$ == "Period1500") dewey = "869.1/2"
            if (sGenre$ = "Drama" && sCountry$ == "Brazil" && sDewey$ == "Period1500") dewey = "869.2/2"
            if (sGenre$ = "Fiction" && sCountry$ == "Brazil" && sDewey$ == "Period1900") dewey = "869.3/41"
            if (sGenre$ = "Poetry" && sCountry$ == "Brazil" && sDewey$ == "Period1900") dewey = "869.1/41"
            if (sGenre$ = "Drama" && sCountry$ == "Brazil" && sDewey$ == "Period1900") dewey = "869.2/41"
            if (sGenre$ = "Fiction" && sCountry$ == "Russia" && sDewey$ == "Period1917") dewey = "891.73/44"
            if (sGenre$ = "Poetry" && sCountry$ == "Russia" && sDewey$ == "Period1917") dewey = "891.71/44"
            if (sGenre$ = "Drama" && sCountry$ == "Russia" && sDewey$ == "Period1917") dewey = "891.72/44"
            if (sGenre$ = "Fiction" && sCountry$ == "Russia" && sDewey$ == "Period1945") dewey = "891.73/5"
            if (sGenre$ = "Poetry" && sCountry$ == "Russia" && sDewey$ == "Period1945") dewey = "891.71/5"
            if (sGenre$ = "Drama" && sCountry$ == "Russia" && sDewey$ == "Period1945") dewey = "891.72/5"
            if (sGenre$ = "Fiction" && sCountry$ == "Lithuania" && sDewey$ == "Period1800") dewey = "891/.9232"
            if (sGenre$ = "Poetry" && sCountry$ == "Lithuania" && sDewey$ == "Period1800") dewey = "891/.9212"
            if (sGenre$ = "Drama" && sCountry$ == "Lithuania" && sDewey$ == "Period1800") dewey = "891/.9222"
            if (sGenre$ = "Fiction" && sCountry$ == "Lithuania" && sDewey$ == "Period1900") dewey = "891/.9234"
            if (sGenre$ = "Poetry" && sCountry$ == "Lithuania" && sDewey$ == "Period1900") dewey = "891/.9214"
            if (sGenre$ = "Drama" && sCountry$ == "Lithuania" && sDewey$ == "Period1900") dewey = "891/.9224"
            if (sGenre$ = "Fiction" && sCountry$ == "Latvia" && sDewey$ == "Period1800") dewey = "891/.9332"
            if (sGenre$ = "Poetry" && sCountry$ == "Latvia" && sDewey$ == "Period1800") dewey = "891/.9312"
            if (sGenre$ = "Drama" && sCountry$ == "Latvia" && sDewey$ == "Period1800") dewey = "891/.9322"
            if (sGenre$ = "Fiction" && sCountry$ == "Latvia" && sDewey$ == "Period1900") dewey = "891/.9334"
            if (sGenre$ = "Poetry" && sCountry$ == "Latvia" && sDewey$ == "Period1900") dewey = "891/.9314"
            if (sGenre$ = "Drama" && sCountry$ == "Latvia" && sDewey$ == "Period1900") dewey = "891/.9324"
            if (sGenre$ = "Fiction" && sCountry$ == "Finland" && sDewey$ == "Period1800") dewey = "894/.54133"
            if (sGenre$ = "Poetry" && sCountry$ == "Finland" && sDewey$ == "Period1800") dewey = "894/.54113"
            if (sGenre$ = "Drama" && sCountry$ == "Finland" && sDewey$ == "Period1800") dewey = "894/.54123"
            if (sGenre$ = "Fiction" && sCountry$ == "Estonia" && sDewey$ == "Period1800") dewey = "894/.54532"
            if (sGenre$ = "Poetry" && sCountry$ == "Estonia" && sDewey$ == "Period1800") dewey = "894/.54512"
            if (sGenre$ = "Drama" && sCountry$ == "Estonia" && sDewey$ == "Period1800") dewey = "894/.54522"
            if (sGenre$ = "Fiction" && sCountry$ == "Estonia" && sDewey$ == "Period1900") dewey = "894/.54533"
            if (sGenre$ = "Poetry" && sCountry$ == "Estonia" && sDewey$ == "Period1900") dewey = "894/.54513"
            if (sGenre$ = "Drama" && sCountry$ == "Estonia" && sDewey$ == "Period1900") dewey = "894/.54523"
        } else if (periodNumber == 3) {
            if (sGenre$ = "Fiction" && sCountry$ == "US" && sDewey$ == "Period1830") dewey = "813/.4"
            if (sGenre$ = "Poetry" && sCountry$ == "US" && sDewey$ == "Period1830") dewey = "811/.4"
            if (sGenre$ = "Drama" && sCountry$ == "US" && sDewey$ == "Period1830") dewey = "812/.4"
            if (sGenre$ = "Fiction" && sCountry$ == "UK" && sDewey$ == "Period1558") dewey = "823/.4"
            if (sGenre$ = "Poetry" && sCountry$ == "UK" && sDewey$ == "Period1558") dewey = "821/.4"
            if (sGenre$ = "Drama" && sCountry$ == "UK" && sDewey$ == "Period1558") dewey = "822/.4"
            if (sGenre$ = "Fiction" && sCountry$ == "UK" && sDewey$ == "Period1625") dewey = "823/.4"
            if (sGenre$ = "Poetry" && sCountry$ == "UK" && sDewey$ == "Period1625") dewey = "821/.4"
            if (sGenre$ = "Drama" && sCountry$ == "UK" && sDewey$ == "Period1625") dewey = "822/.4"
            if (sGenre$ = "Fiction" && sCountry$ == "UK" && sDewey$ == "Period1702") dewey = "823/.6"
            if (sGenre$ = "Poetry" && sCountry$ == "UK" && sDewey$ == "Period1702") dewey = "821/.6"
            if (sGenre$ = "Drama" && sCountry$ == "UK" && sDewey$ == "Period1702") dewey = "822/.6"
            if (sGenre$ = "Fiction" && sCountry$ == "UK" && sDewey$ == "Period1800") dewey = "823/.8"
            if (sGenre$ = "Poetry" && sCountry$ == "UK" && sDewey$ == "Period1800") dewey = "821/.8"
            if (sGenre$ = "Drama" && sCountry$ == "UK" && sDewey$ == "Period1800") dewey = "822/.8"
            if (sGenre$ = "Fiction" && sCountry$ == "Germany" && sDewey$ == "Period1100") dewey = "833/.22"
            if (sGenre$ = "Poetry" && sCountry$ == "Germany" && sDewey$ == "Period1100") dewey = "831/.22"
            if (sGenre$ = "Drama" && sCountry$ == "Germany" && sDewey$ == "Period1100") dewey = "832/.22"
            if (sGenre$ = "Fiction" && sCountry$ == "Germany" && sDewey$ == "Period1300") dewey = "833/.5"
            if (sGenre$ = "Poetry" && sCountry$ == "Germany" && sDewey$ == "Period1300") dewey = "831/.5"
            if (sGenre$ = "Drama" && sCountry$ == "Germany" && sDewey$ == "Period1300") dewey = "832/.5"
            if (sGenre$ = "Fiction" && sCountry$ == "Germany" && sDewey$ == "Period1600") dewey = "833/.7"
            if (sGenre$ = "Poetry" && sCountry$ == "Germany" && sDewey$ == "Period1600") dewey = "831/.7"
            if (sGenre$ = "Drama" && sCountry$ == "Germany" && sDewey$ == "Period1600") dewey = "832/.7"
            if (sGenre$ = "Fiction" && sCountry$ == "Germany" && sDewey$ == "Period1800") dewey = "833/.914"
            if (sGenre$ = "Poetry" && sCountry$ == "Germany" && sDewey$ == "Period1800") dewey = "831/.914"
            if (sGenre$ = "Drama" && sCountry$ == "Germany" && sDewey$ == "Period1800") dewey = "832/.914"
            if (sGenre$ = "Fiction" && sCountry$ == "Iceland" && sDewey$ == "Period1700") dewey = "839/.6934"
            if (sGenre$ = "Poetry" && sCountry$ == "Iceland" && sDewey$ == "Period1700") dewey = "839/.6914"
            if (sGenre$ = "Drama" && sCountry$ == "Iceland" && sDewey$ == "Period1700") dewey = "839/.6924"
            if (sGenre$ = "Fiction" && sCountry$ == "Sweden" && sDewey$ == "Period1600") dewey = "839.73/3"
            if (sGenre$ = "Poetry" && sCountry$ == "Sweden" && sDewey$ == "Period1600") dewey = "839.71/3"
            if (sGenre$ = "Drama" && sCountry$ == "Sweden" && sDewey$ == "Period1600") dewey = "839.72/3"
            if (sGenre$ = "Fiction" && sCountry$ == "Sweden" && sDewey$ == "Period1800") dewey = "839.73/64"
            if (sGenre$ = "Poetry" && sCountry$ == "Sweden" && sDewey$ == "Period1800") dewey = "839.71/64"
            if (sGenre$ = "Drama" && sCountry$ == "Sweden" && sDewey$ == "Period1800") dewey = "839.72/64"
            if (sGenre$ = "Fiction" && sCountry$ == "Sweden" && sDewey$ == "Period1900") dewey = "839.73/74"
            if (sGenre$ = "Poetry" && sCountry$ == "Sweden" && sDewey$ == "Period1900") dewey = "839.71/74"
            if (sGenre$ = "Drama" && sCountry$ == "Sweden" && sDewey$ == "Period1900") dewey = "839.72/74"
            if (sGenre$ = "Fiction" && sCountry$ == "Denmark" && sDewey$ == "Period1500") dewey = "839.813/4"
            if (sGenre$ = "Poetry" && sCountry$ == "Denmark" && sDewey$ == "Period1500") dewey = "839.811/4"
            if (sGenre$ = "Drama" && sCountry$ == "Denmark" && sDewey$ == "Period1500") dewey = "839.812/4"
            if (sGenre$ = "Fiction" && sCountry$ == "Norway" && sDewey$ == "Period1500") dewey = "839.823/4"
            if (sGenre$ = "Poetry" && sCountry$ == "Norway" && sDewey$ == "Period1500") dewey = "839.821/4"
            if (sGenre$ = "Drama" && sCountry$ == "Norway" && sDewey$ == "Period1500") dewey = "839.822/4"
            if (sGenre$ = "Fiction" && sCountry$ == "Italy" && sDewey$ == "Period1400") dewey = "853/.4"
            if (sGenre$ = "Poetry" && sCountry$ == "Italy" && sDewey$ == "Period1400") dewey = "851/.4"
            if (sGenre$ = "Drama" && sCountry$ == "Italy" && sDewey$ == "Period1400") dewey = "852/.4"
            if (sGenre$ = "Fiction" && sCountry$ == "Italy" && sDewey$ == "Period1600") dewey = "853/.7"
            if (sGenre$ = "Poetry" && sCountry$ == "Italy" && sDewey$ == "Period1600") dewey = "851/.7"
            if (sGenre$ = "Drama" && sCountry$ == "Italy" && sDewey$ == "Period1600") dewey = "852/.7"
            if (sGenre$ = "Fiction" && sCountry$ == "Spain" && sDewey$ == "Period1900") dewey = "863/.64"
            if (sGenre$ = "Poetry" && sCountry$ == "Spain" && sDewey$ == "Period1900") dewey = "861/.64"
            if (sGenre$ = "Drama" && sCountry$ == "Spain" && sDewey$ == "Period1900") dewey = "862/.64"
            if (sGenre$ = "Fiction" && sCountry$ == "Mexico" && sDewey$ == "Period1900") dewey = "863/.64"
            if (sGenre$ = "Poetry" && sCountry$ == "Mexico" && sDewey$ == "Period1900") dewey = "861/.64"
            if (sGenre$ = "Drama" && sCountry$ == "Mexico" && sDewey$ == "Period1900") dewey = "862/.64"
            if (sGenre$ = "Fiction" && sCountry$ == "Argentina" && sDewey$ == "Period1900") dewey = "863/.64"
            if (sGenre$ = "Poetry" && sCountry$ == "Argentina" && sDewey$ == "Period1900") dewey = "861/.64"
            if (sGenre$ = "Drama" && sCountry$ == "Argentina" && sDewey$ == "Period1900") dewey = "862/.64"
            if (sGenre$ = "Fiction" && sCountry$ == "Chile" && sDewey$ == "Period1900") dewey = "863/.64"
            if (sGenre$ = "Poetry" && sCountry$ == "Chile" && sDewey$ == "Period1900") dewey = "861/.64"
            if (sGenre$ = "Drama" && sCountry$ == "Chile" && sDewey$ == "Period1900") dewey = "862/.64"
            if (sGenre$ = "Fiction" && sCountry$ == "Peru" && sDewey$ == "Period1900") dewey = "863/.64"
            if (sGenre$ = "Poetry" && sCountry$ == "Peru" && sDewey$ == "Period1900") dewey = "861/.64"
            if (sGenre$ = "Drama" && sCountry$ == "Peru" && sDewey$ == "Period1900") dewey = "862/.64"
            if (sGenre$ = "Fiction" && sCountry$ == "Brazil" && sDewey$ == "Period1900") dewey = "869.3/42"
            if (sGenre$ = "Poetry" && sCountry$ == "Brazil" && sDewey$ == "Period1900") dewey = "869.1/42"
            if (sGenre$ = "Drama" && sCountry$ == "Brazil" && sDewey$ == "Period1900") dewey = "869.2/42"
            if (sGenre$ = "Fiction" && sCountry$ == "Lithuania" && sDewey$ == "Period1800") dewey = "891/.9233"
            if (sGenre$ = "Poetry" && sCountry$ == "Lithuania" && sDewey$ == "Period1800") dewey = "891/.9213"
            if (sGenre$ = "Drama" && sCountry$ == "Lithuania" && sDewey$ == "Period1800") dewey = "891/.9223"
            if (sGenre$ = "Fiction" && sCountry$ == "Latvia" && sDewey$ == "Period1800") dewey = "891/.9333"
            if (sGenre$ = "Poetry" && sCountry$ == "Latvia" && sDewey$ == "Period1800") dewey = "891/.9313"
            if (sGenre$ = "Drama" && sCountry$ == "Latvia" && sDewey$ == "Period1800") dewey = "891/.9323"
            if (sGenre$ = "Fiction" && sCountry$ == "France" && sDewey$ == "Period1600") dewey = "843/.6"
            if (sGenre$ = "Poetry" && sCountry$ == "France" && sDewey$ == "Period1600") dewey = "841/.6"
            if (sGenre$ = "Drama" && sCountry$ == "France" && sDewey$ == "Period1600") dewey = "842/.6"
            if (sGenre$ = "Fiction" && sCountry$ == "France" && sDewey$ == "Period1800") dewey = "843/.8"
            if (sGenre$ = "Poetry" && sCountry$ == "France" && sDewey$ == "Period1800") dewey = "841/.8"
            if (sGenre$ = "Drama" && sCountry$ == "France" && sDewey$ == "Period1800") dewey = "842/.8"
        } else if (periodNumber == 4) {
            if (sGenre$ == "Fiction" && sCountry$ == "Germany" && sDewey$ == "Period1100") dewey = "833/.3"
            if (sGenre$ == "Poetry" && sCountry$ == "Germany" && sDewey$ == "Period1100") dewey = "831/.3"
            if (sGenre$ == "Drama" && sCountry$ == "Germany" && sDewey$ == "Period1100") dewey = "832/.3"
            if (sGenre$ == "Fiction" && sCountry$ == "Germany" && sDewey$ == "Period1600") dewey = "833/.8"
            if (sGenre$ == "Poetry" && sCountry$ == "Germany" && sDewey$ == "Period1600") dewey = "831/.8"
            if (sGenre$ == "Drama" && sCountry$ == "Germany" && sDewey$ == "Period1600") dewey = "832/.8"
            if (sGenre$ == "Fiction" && sCountry$ == "Sweden" && sDewey$ == "Period1600") dewey = "839.73/4"
            if (sGenre$ == "Poetry" && sCountry$ == "Sweden" && sDewey$ == "Period1600") dewey = "839.71/4"
            if (sGenre$ == "Drama" && sCountry$ == "Sweden" && sDewey$ == "Period1600") dewey = "839.72/4"
            if (sGenre$ == "Fiction" && sCountry$ == "Sweden" && sDewey$ == "Period1800") dewey = "839.73/67"
            if (sGenre$ == "Poetry" && sCountry$ == "Sweden" && sDewey$ == "Period1800") dewey = "839.71/67"
            if (sGenre$ == "Drama" && sCountry$ == "Sweden" && sDewey$ == "Period1800") dewey = "839.72/67"
            if (sGenre$ == "Fiction" && sCountry$ == "Denmark" && sDewey$ == "Period1500") dewey = "839.813/5"
            if (sGenre$ == "Poetry" && sCountry$ == "Denmark" && sDewey$ == "Period1500") dewey = "839.811/5"
            if (sGenre$ == "Drama" && sCountry$ == "Denmark" && sDewey$ == "Period1500") dewey = "839.812/5"
            if (sGenre$ == "Fiction" && sCountry$ == "Norway" && sDewey$ == "Period1500") dewey = "839.823/5"
            if (sGenre$ == "Poetry" && sCountry$ == "Norway" && sDewey$ == "Period1500") dewey = "839.821/5"
            if (sGenre$ == "Drama" && sCountry$ == "Norway" && sDewey$ == "Period1500") dewey = "839.822/5"
            if (sGenre$ == "Fiction" && sCountry$ == "Italy" && sDewey$ == "Period1400") dewey = "853/.5"
            if (sGenre$ == "Poetry" && sCountry$ == "Italy" && sDewey$ == "Period1400") dewey = "851/.5"
            if (sGenre$ == "Drama" && sCountry$ == "Italy" && sDewey$ == "Period1400") dewey = "852/.5"
            if (sGenre$ == "Fiction" && sCountry$ == "Italy" && sDewey$ == "Period1600") dewey = "853/.8"
            if (sGenre$ == "Poetry" && sCountry$ == "Italy" && sDewey$ == "Period1600") dewey = "851/.8"
            if (sGenre$ == "Drama" && sCountry$ == "Italy" && sDewey$ == "Period1600") dewey = "852/.8"
        } else if (periodNumber == 5) {
            if (sGenre$ == "Fiction" && sCountry$ == "Sweden" && sDewey$ == "Period1600") dewey = "839.73/5"
            if (sGenre$ == "Poetry" && sCountry$ == "Sweden" && sDewey$ == "Period1600") dewey = "839.71/5"
            if (sGenre$ == "Drama" && sCountry$ == "Sweden" && sDewey$ == "Period1600") dewey = "839.72/5"
        }



        setAutoDeweyResult(dewey)
        // return dewey

    }

    const convertLccBasic = (letter, number) => {
        const ruleMatches = lccDeweyMap.filter(rule => rule.LCC == letter)
        console.log('convertLccBasic', letter, ruleMatches)
        if (ruleMatches.length == 1) {
            ruleMatches[0].mode = 'basic'
            return [ruleMatches[0].DDC, ruleMatches[0]]
        }

        if (ruleMatches.length > 1) {
            for (const rule of ruleMatches) {
                let range = rule['LCC Range'].replace(rule.LCC, '').trim()
                if (range.charAt(range.length - 1) == '+') {
                    range = range.replace('+', ' - 999999999')
                }
                const [rangeStart, rangeEnd] = range.split(' - ')
                console.log('range', range, rangeStart, rangeEnd)
                console.log('number', number)
                if (number * 1 >= rangeStart * 1 && number * 1 <= rangeEnd * 1) {
                    // console.log('number WITHIN range', number)
                    rule.mode = 'basic'
                    return [rule.DDC, rule]
                }
            }

            //if no range found just use first (generic) one
            return [ruleMatches[0].DDC, ruleMatches[0]]
        }

        return [false, { error: 'Unable to convert this LCC' }]


    }

    const [dewey, deweyInfo] = useMemo(
        () => {
            const [match, letter, number] = lcCall.trim().match(/^([A-Z]*)(.*)/)
            // console.log('letter', letter)
            // console.log(lccDeweyMap)
            const deweys = lccDeweyMap.filter(ddc => ddc.LCC == letter)
            // console.log(deweys)

            if (lccsWithLocalLogics.includes(letter)) {
                return convertLccWithLocalLogics(letter, number)
            }

            return convertLccBasic(letter, number)
        },
        [lcCall, autoDeweyGenre]
    )

    console.log(lcCall, dewey, deweyInfo)

    if (deweyInfo.mode == 'autoDewey') return (
        deweyInfo
        // <div style={{ background: 'lavender', padding: '1em', marginTop: '1em', marginBottom: '1em' }}>
        //     <div>LCC: {lcCall}</div>
        //     {!lcCall.startsWith('GV') && (
        //         <>
        //             <div>Please choose genre of this item</div>
        //             <ButtonGroup>
        //                 {autoDeweyGenres.map((genre, i) => (
        //                     <Button
        //                         key={`genre-${i}`}
        //                         onClick={() => onAutoDeweyGenreClick(genre)}
        //                         buttonStyle={
        //                             genre === autoDeweyGenre
        //                                 ? 'primary'
        //                                 : 'default'
        //                         }
        //                     >
        //                         <span style={{ textTransform: 'capitalize' }}>{genre}</span>
        //                     </Button>
        //                 )
        //                 )}
        //             </ButtonGroup>
        //         </>
        //     )}
        //     <>
        //         {(deweyInfo.periods.length > 0) ? (
        //             <>
        //                 <div>
        //                     Please choose time period of this item
        //                     <br />
        //                     {deweyInfo.periods.map((period, i) => (
        //                         <Button
        //                             key={`period-${i}`}
        //                             onClick={() => onPeriodClicked(i + 1, dewey, deweyInfo.genre, deweyInfo.country)}
        //                         >
        //                             {period}
        //                         </Button>
        //                     )
        //                     )}
        //                 </div>

        //                 {autoDeweyResult && (
        //                     <>
        //                     <div>
        //                         {autoDeweyResult}
        //                     </div>
        //                     <div>
        //                         <Button onClick={() => parentPhone({action: 'copyToClipboard', value: autoDeweyResult})}>Copy</Button>
        //                     </div>
        //                     </>
        //                 )}
        //             </>
        //         ) : (
        //             dewey ? (
        //                 <>
        //                     {Array.isArray(dewey) ? (
        //                         <>
        //                             <div>Dewies:</div>
        //                             <ul>
        //                                 {dewey.map(result => <li key={result.dewey}>{result.caption}: {result.dewey}</li>)}
        //                             </ul>
        //                         </>
        //                     ) : (
        //                         <>
        //                         <div>Dewey: {dewey}</div>
        //                         <div>
        //                         <Button onClick={() => parentPhone({action: 'copyToClipboard', value: dewey})}>Copy</Button>
        //                         </div>
        //                         </>

        //                     )}

        //                 </>
        //             ) : (
        //                 (dewey === false) && (
        //                     <>
        //                         <div>Can't convert this LCC to Dewey 😔</div>
        //                     </>
        //                 )
        //             )
        //         )}
        //     </>

        // </div>
    )


    //basic mode
    return ( deweyInfo

        // <div style={{ background: 'antiquewhite', padding: '1em', marginTop: '1em', marginBottom: '1em' }}>
        //     <div>LC Call#: {lcCall}
        //             {deweyInfo && (
        //                 <Badge>
        //                     <small>{deweyInfo['LCC Caption']}</small>
        //                 </Badge>
        //             )}
        //     </div>

        //     {dewey && (
        //         <>
        //             <div>Dewey: <strong>{dewey}</strong>
        //                 {deweyInfo && (
        //                     <Badge>
        //                         <small>{deweyInfo['DDC Caption']}</small>
        //                     </Badge>
        //                 )}
        //             </div>
        //         </>
        //     )}

        //     {dewey === false && (
        //         <div>Can't convert this LCC to Dewey 😔</div>
        //     )}

        // </div>
    )

}

