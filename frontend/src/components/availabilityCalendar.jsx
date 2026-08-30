import { useMemo, useState } from "react";

import "../styles/booking.css";


/*
=====================================================
DATE HELPERS
=====================================================

All dates are represented as plain "YYYY-MM-DD"
strings everywhere outside of calendar-grid rendering.
That format compares/sorts correctly with normal
string operators, so there's no risk of timezone
drift from JS Date objects leaking into comparisons.
=====================================================
*/

const WEEKDAY_LABELS = ["Su", "Mo", "Tu", "We", "Th", "Fr", "Sa"];

const MONTH_LABELS = [
    "January", "February", "March", "April", "May", "June",
    "July", "August", "September", "October", "November", "December"
];

const pad2 = (value) => String(value).padStart(2, "0");

const formatDate = (date) =>
    `${date.getFullYear()}-${pad2(date.getMonth() + 1)}-${pad2(date.getDate())}`;

const todayDateString = () => formatDate(new Date());

const addDaysToDateString = (dateString, days) => {

    const [year, month, day] = dateString.split("-").map(Number);

    const date = new Date(year, month - 1, day + days);

    return formatDate(date);

};

const addMonths = (date, count) =>
    new Date(date.getFullYear(), date.getMonth() + count, 1);

const buildMonthGrid = (monthDate) => {

    const year = monthDate.getFullYear();
    const month = monthDate.getMonth();

    const firstWeekday = new Date(year, month, 1).getDay();
    const daysInMonth = new Date(year, month + 1, 0).getDate();

    const cells = [];

    for (let i = 0; i < firstWeekday; i++) {
        cells.push(null);
    }

    for (let day = 1; day <= daysInMonth; day++) {
        cells.push(new Date(year, month, day));
    }

    return cells;

};

const isDateInRanges = (dateString, ranges) =>
    ranges.some((range) => dateString >= range.start && dateString < range.end);

const rangeHasDisabledDay = (startInclusive, endExclusive, ranges) => {

    let cursor = startInclusive;

    while (cursor < endExclusive) {

        if (isDateInRanges(cursor, ranges)) {
            return true;
        }

        cursor = addDaysToDateString(cursor, 1);

    }

    return false;

};


/*
=====================================================
AVAILABILITY CALENDAR
=====================================================

A self-contained date-range picker. The parent doesn't
need to manage selection state — it just reads the
current selection back through onRangeChange and
renders whatever total/summary it needs from it.

Props:

  bookedRanges   [{ start, end }]  — guest bookings (shown in red, always disabled)
  blockedRanges  [{ start, end }]  — host-blocked dates (shown in gray, always disabled)
  minDate        "YYYY-MM-DD"      — earliest selectable date (defaults to today)
  onRangeChange  (range) => void   — called with { checkIn, checkOut } on every change
                                      (checkOut is null while a selection is in progress)
=====================================================
*/

function AvailabilityCalendar({
    bookedRanges = [],
    blockedRanges = [],
    minDate,
    mode = "range",
    onRangeChange,
    onDatesChange
}) {

    const effectiveMinDate = minDate || todayDateString();

    const [viewMonth, setViewMonth] = useState(() => {

        const [year, month, day] = effectiveMinDate.split("-").map(Number);

        return new Date(year, month - 1, 1);

    });

    const [checkIn, setCheckIn] = useState(null);
    const [checkOut, setCheckOut] = useState(null);
    const [selectedDates, setSelectedDates] = useState([]);


    const disabledRanges = useMemo(
        () => [...bookedRanges, ...blockedRanges],
        [bookedRanges, blockedRanges]
    );


    const monthCells = useMemo(
        () => buildMonthGrid(viewMonth),
        [viewMonth]
    );


    const canGoToPreviousMonth = useMemo(() => {

        const previousMonth = addMonths(viewMonth, -1);

        const lastDayOfPreviousMonth =
            new Date(previousMonth.getFullYear(), previousMonth.getMonth() + 1, 0);

        return formatDate(lastDayOfPreviousMonth) >= effectiveMinDate;

    }, [viewMonth, effectiveMinDate]);

    const canGoToNextMonth = useMemo(() => {

        const [year, month] = effectiveMinDate.split("-").map(Number);
        const maxViewMonth = addMonths(new Date(year, month - 1, 1), 2);

        return viewMonth < maxViewMonth;

    }, [viewMonth, effectiveMinDate]);


    const emitChange = (checkIn, checkOut) => {
        if (onRangeChange) {
            let dayCount = 0;
 
            if (checkIn && checkOut) {
                // Count every calendar date from checkIn through checkOut inclusive
                const start = new Date(checkIn);
                const end = new Date(checkOut);
                const diffDays = Math.round((end - start) / (1000 * 60 * 60 * 24));
                // diffDays=0 means same day selected (single date): 1 day
                // diffDays=1 means two adjacent dates selected: 2 days
                dayCount = diffDays + 1;
            } else if (checkIn) {
                // Only check-in selected so far: 1 day
                dayCount = 1;
            }
 
            onRangeChange({ checkIn, checkOut, dayCount });
        }
    };



    const handleDayClick = (dateString) => {

        const isPast = dateString < effectiveMinDate;
        const isDisabled = isDateInRanges(dateString, disabledRanges);

        if (isPast || isDisabled) {
            return;
        }


        if (mode === "multi") {

            setSelectedDates((prev) => {

                const next = prev.includes(dateString)
                    ? prev.filter((d) => d !== dateString)
                    : [...prev, dateString].sort();

                if (onDatesChange) {
                    onDatesChange(next);
                }

                return next;

            });

            return;

        }


        /*
        No selection yet, or a full range is already
        selected -> start a brand new selection.
        */

        if (!checkIn || (checkIn && checkOut)) {

            setCheckIn(dateString);
            setCheckOut(null);
            emitChange(dateString, null);

            return;

        }


        /*
        A check-in is picked, waiting for check-out.
        */

        if (dateString <= checkIn) {

            /*
            Clicked on or before the current check-in ->
            treat it as picking a new check-in date.
            */

            setCheckIn(dateString);
            setCheckOut(null);
            emitChange(dateString, null);

            return;

        }

        const spanHasDisabledDay =
            rangeHasDisabledDay(checkIn, dateString, disabledRanges);

        if (spanHasDisabledDay) {

            /*
            The requested range would cross an already
            booked/blocked date -> start a fresh
            selection at the clicked date instead of
            silently failing.
            */

            setCheckIn(dateString);
            setCheckOut(null);
            emitChange(dateString, null);

            return;

        }

        setCheckOut(dateString);
        emitChange(checkIn, dateString);

    };


    const handleClearSelection = () => {

        setCheckIn(null);
        setCheckOut(null);
        emitChange(null, null);

        setSelectedDates([]);

        if (onDatesChange) {
            onDatesChange([]);
        }

    };


    return (

        <div className="availability-calendar">

            <div className="availability-calendar-header">

                <button
                    type="button"
                    className="availability-calendar-nav"
                    disabled={!canGoToPreviousMonth}
                    onClick={() =>
                        setViewMonth((current) => addMonths(current, -1))
                    }
                    aria-label="Previous month"
                >
                    ‹
                </button>

                <div className="availability-calendar-title">
                    {MONTH_LABELS[viewMonth.getMonth()]} {viewMonth.getFullYear()}
                </div>

                <button
                    type="button"
                    className="availability-calendar-nav"
                    disabled={!canGoToNextMonth}
                    onClick={() =>
                        setViewMonth((current) => addMonths(current, 1))
                    }
                    aria-label="Next month"
                >
                    ›
                </button>

            </div>

            <div className="availability-calendar-weekdays">

                {WEEKDAY_LABELS.map((label) => (
                    <div key={label} className="availability-calendar-weekday">
                        {label}
                    </div>
                ))}

            </div>

            <div className="availability-calendar-grid">

                {monthCells.map((cellDate, index) => {

                    if (!cellDate) {
                        return <div key={`empty-${index}`} className="availability-day empty" />;
                    }

                    const dateString = formatDate(cellDate);

                    const isPast = dateString < effectiveMinDate;
                    const isBooked = isDateInRanges(dateString, bookedRanges);
                    const isBlocked = !isBooked && isDateInRanges(dateString, blockedRanges);
                    const isDisabled = isPast || isBooked || isBlocked;

                    const isCheckIn = mode === "range" && dateString === checkIn;
                    const isCheckOut = mode === "range" && dateString === checkOut;

                    const isInRange =
                        mode === "range" && checkIn && checkOut &&
                        dateString > checkIn && dateString < checkOut;

                    const isMultiSelected =
                        mode === "multi" && selectedDates.includes(dateString);

                    const classNames = ["availability-day"];

                    if (isDisabled) classNames.push("disabled");
                    if (isBooked) classNames.push("booked");
                    if (isBlocked) classNames.push("blocked");
                    if (isCheckIn) classNames.push("range-start");
                    if (isCheckOut) classNames.push("range-end");
                    if (isInRange) classNames.push("in-range");
                    if (isMultiSelected) classNames.push("range-start");

                    return (

                        <button
                            key={dateString}
                            type="button"
                            className={classNames.join(" ")}
                            disabled={isDisabled}
                            onClick={() => handleDayClick(dateString)}
                            title={
                                isBooked
                                    ? "Already booked"
                                    : isBlocked
                                        ? "Unavailable"
                                        : dateString
                            }
                        >
                            {cellDate.getDate()}
                        </button>

                    );

                })}

            </div>

            <div className="availability-calendar-legend">

                <span className="legend-item">
                    <span className="legend-dot available" /> Available
                </span>

                <span className="legend-item">
                    <span className="legend-dot selected" /> Selected
                </span>

                <span className="legend-item">
                    <span className="legend-dot booked" /> Booked
                </span>

                <span className="legend-item">
                    <span className="legend-dot blocked" /> Unavailable
                </span>

            </div>

            {mode === "multi" && selectedDates.length > 0 && (

                <div className="availability-calendar-selection">

                    <span>
                        {selectedDates.length} day{selectedDates.length > 1 ? "s" : ""} selected
                    </span>

                    <button
                        type="button"
                        className="availability-calendar-clear"
                        onClick={handleClearSelection}
                    >
                        Clear
                    </button>

                </div>

            )}

            {mode === "range" && (checkIn || checkOut) && (

                <div className="availability-calendar-selection">

                    <span>
                        {checkIn ? `Check-in: ${checkIn}` : "Pick a check-in date"}
                        {"  "}
                        {checkOut ? `→ Check-out: ${checkOut}` : ""}
                    </span>

                    <button
                        type="button"
                        className="availability-calendar-clear"
                        onClick={handleClearSelection}
                    >
                        Clear
                    </button>

                </div>

            )}

        </div>

    );

}


export default AvailabilityCalendar;
export { todayDateString, addDaysToDateString };