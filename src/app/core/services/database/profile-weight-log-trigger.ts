export function profileWeightLogTriggerSql(): string {
  return `CREATE TRIGGER IF NOT EXISTS log_profile_weight_change
    AFTER UPDATE OF weight_kg ON user_profile
    WHEN OLD.weight_kg IS NOT NEW.weight_kg
    BEGIN
      INSERT INTO weight_log (id, weight_kg, date)
      VALUES (lower(hex(randomblob(16))), NEW.weight_kg, date('now', 'localtime'))
      ON CONFLICT(date) DO UPDATE SET weight_kg = excluded.weight_kg;
    END`;
}
