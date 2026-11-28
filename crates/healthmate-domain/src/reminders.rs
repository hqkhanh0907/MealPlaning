use serde::{Deserialize, Serialize};

const MANAGED_IDS: [u16; 11] = [101, 102, 103, 104, 151, 152, 153, 154, 155, 156, 157];

#[derive(Deserialize)]
pub struct Preferences {
    pub notif_morning: Option<f64>,
    pub notif_lunch: Option<f64>,
    pub notif_evening: Option<f64>,
    pub notif_weekly: Option<f64>,
}
#[derive(Deserialize)]
pub struct TrainingDay {
    pub weekday: Option<f64>,
    pub rest: Option<f64>,
    pub exercises: usize,
}

#[derive(Deserialize)]
#[serde(rename_all = "camelCase")]
pub struct Input {
    pub profile: Option<Preferences>,
    pub granted: bool,
    pub workout_enabled: bool,
    pub days: Vec<TrainingDay>,
}

#[derive(Serialize, PartialEq, Debug)]
pub struct LocalTime {
    pub hour: u8,
    pub minute: u8,
    #[serde(skip_serializing_if = "Option::is_none")]
    pub weekday: Option<u8>,
}
#[derive(Serialize, PartialEq, Debug)]
pub struct Schedule {
    pub on: LocalTime,
    pub repeats: bool,
}
#[derive(Serialize, PartialEq, Debug)]
pub struct Notification {
    pub id: u16,
    pub title: &'static str,
    pub body: &'static str,
    pub schedule: Schedule,
}
#[derive(Serialize)]
#[serde(rename_all = "camelCase")]
pub struct Plan {
    pub cancel_ids: [u16; 11],
    pub notifications: Vec<Notification>,
}

fn notification(
    id: u16,
    title: &'static str,
    body: &'static str,
    hour: u8,
    minute: u8,
    weekday: Option<u8>,
) -> Notification {
    Notification {
        id,
        title,
        body,
        schedule: Schedule {
            on: LocalTime {
                hour,
                minute,
                weekday,
            },
            repeats: true,
        },
    }
}
pub fn plan(input: &Input) -> Plan {
    let mut result = Plan {
        cancel_ids: MANAGED_IDS,
        notifications: Vec::new(),
    };
    let Some(profile) = input.profile.as_ref().filter(|_| input.granted) else {
        return result;
    };
    for (flag, entry) in [
        (
            profile.notif_morning,
            notification(101, "Bữa sáng", "Hôm nay ăn gì? Ghi lại nhé.", 7, 30, None),
        ),
        (
            profile.notif_lunch,
            notification(102, "Bữa trưa", "Đừng quên log bữa trưa.", 12, 0, None),
        ),
        (
            profile.notif_evening,
            notification(103, "Bữa tối", "Cập nhật bữa tối nào.", 18, 30, None),
        ),
        (
            profile.notif_weekly,
            notification(
                104,
                "Tổng kết tuần",
                "Xem tiến độ tuần qua.",
                20,
                0,
                Some(1),
            ),
        ),
    ] {
        if flag.is_some_and(|value| value != 0.) {
            result.notifications.push(entry);
        }
    }
    if input.workout_enabled {
        for weekday in 0u8..7 {
            if input.days.iter().any(|d| {
                d.weekday == Some(f64::from(weekday))
                    && d.rest.unwrap_or_default() == 0.
                    && d.exercises > 0
            }) {
                result.notifications.push(notification(
                    151 + u16::from(weekday),
                    "Nhắc buổi tập",
                    "Mở ứng dụng để xem lịch hôm nay.",
                    17,
                    30,
                    Some(weekday + 1),
                ));
            }
        }
    }
    result
}
