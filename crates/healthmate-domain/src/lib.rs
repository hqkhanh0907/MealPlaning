pub mod dates;
pub mod fitness;
pub mod nutrition;
pub mod profile;
pub mod progress;
pub mod recommendation;

fn js_round(value: f64) -> f64 {
    let floor = value.floor();
    if value - floor >= 0.5 {
        floor + 1.0
    } else {
        floor
    }
}
