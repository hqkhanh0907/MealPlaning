pub use chrono::NaiveDate;
use chrono::{Datelike, Days};

pub fn parse_local_date(value: &str) -> Option<NaiveDate> {
    let bytes = value.as_bytes();
    if bytes.len() != 10
        || !bytes.iter().enumerate().all(|(i, b)| match i {
            4 | 7 => *b == b'-',
            _ => b.is_ascii_digit(),
        })
    {
        return None;
    }
    NaiveDate::parse_from_str(value, "%Y-%m-%d").ok()
}

pub fn add_calendar_days(date: NaiveDate, days: i64) -> Option<NaiveDate> {
    let span = Days::new(days.unsigned_abs());
    if days < 0 {
        date.checked_sub_days(span)
    } else {
        date.checked_add_days(span)
    }
}

pub fn monday_of_week(date: NaiveDate) -> Option<NaiveDate> {
    add_calendar_days(date, -i64::from(date.weekday().num_days_from_monday()))
}

pub fn week_dates(start: &str) -> Vec<NaiveDate> {
    parse_local_date(start)
        .into_iter()
        .flat_map(|d| (0..7).filter_map(move |n| add_calendar_days(d, n)))
        .collect()
}

pub fn age_on_date(birth_date: Option<&str>, today: NaiveDate) -> Option<i32> {
    let birth = parse_local_date(birth_date?)?;
    if birth > today {
        return None;
    }
    let anniversary = birth
        .with_year(today.year())
        .or_else(|| NaiveDate::from_ymd_opt(today.year(), 2, 28))?;
    Some(today.year() - birth.year() - i32::from(today < anniversary))
}
