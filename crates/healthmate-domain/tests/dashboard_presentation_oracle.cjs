const { createRequire } = require("node:module");
const { join, resolve } = require("node:path");
const root = process.env.HEALTHMATE_TYPESCRIPT_ROOT || resolve(__dirname, "../../..");
const fromApp = createRequire(join(root, "package.json"));
fromApp("tsx/cjs");
fromApp("@angular/compiler");
const ng = fromApp("@angular/core");
const core = (...p) => fromApp(join(root, "src/app/core", ...p) + ".ts");
const { DashboardStore } = core("stores/dashboard.store");
const { NutritionStore } = core("stores/nutrition.store");
const targets = ng.signal({});
const dependencies = [
  core("stores/calendar.store").CalendarStore, core("stores/local-day").LocalDay,
  core("stores/profile.store").ProfileStore, core("stores/network.store").NetworkStore,
  core("repositories/user-profile.repository").UserProfileRepository,
  core("repositories/day-plan.repository").DayPlanRepository, core("repositories/workout.repository").WorkoutRepository,
  core("services/camera/camera-capture").CameraCapture, core("services/ai/food-image-ai").FoodImageAi,
  core("repositories/photo-meal.repository").PhotoMealRepository, core("services/ai/insight-ai").InsightAi,
  core("services/nutrition/nutrition-query").NutritionQuery
];
const injector = ng.Injector.create({providers:[
  ...dependencies.map(provide => ({provide,useValue:{}})),
  {provide:NutritionStore,useValue:{targets}},
  {provide:ng.ɵChangeDetectionScheduler,useValue:{notify(){}}},
  {provide:ng.ɵEffectScheduler,useValue:{add(){},schedule(){},remove(){}}}
]});
const store = ng.runInInjectionContext(injector, () => new DashboardStore());
const z = {calories:0,protein:0,carbs:0,fat:0,fiber:0};
const weight = {currentKg:null,deltaKg:null,source:null};
const base = {totals:z, loggedTotals:z, targets:z, weightSummary:weight, nutritionStreakDays:null, workoutStreakWeeks:0};
function emit(name, overrides) {
  const input = {...base, ...overrides};
  store.totals.set(input.totals);
  store.loggedTotals.set(input.loggedTotals);
  targets.set(input.targets);
  store.weightSummary.set({...input.weightSummary,date:null});
  store.workoutSummary.set({currentWeekVolume:0,previousWeekVolume:0,streakWeeks:input.workoutStreakWeeks,lastSessionLabel:null});
  store.nutritionStreakDays.set(input.nutritionStreakDays);
  const days = store.nutritionStreakDays();
  const expected = {
    loggedCalories:store.loggedCalories(),roundedCalories:store.roundedCalories(),
    caloriePercent:store.caloriePercent(),proteinPercent:store.proteinPercent(),
    hasCalorieTarget:store.targets().calories>0,hasNutritionData:store.hasNutritionData(),
    calorieTargetLabel:store.calorieTargetLabel(),caloriePercentLabel:store.caloriePercentLabel(),
    macroRows:store.macroRows(),insight:store.insight(),nutritionStreakDays:days,
    nutritionStreakDisplay:days===null?"—":days+" ngày",
    workoutStreakDisplay:store.workoutStreakDisplay(),weightDisplay:store.weightDisplay(),weightMeta:store.weightMeta()
  };
  console.log(JSON.stringify({name,input,expected}));
}
emit("missing data",{});
emit("different logged and planned",{totals:{calories:2345.5,protein:155.5,carbs:203.4,fat:49.9,fiber:11.95},loggedTotals:{...z,calories:715.49},targets:{calories:2000.5,protein:85,carbs:200,fat:0,fiber:-1}});
emit("positive macros with no planned calories",{totals:{...z,protein:54},loggedTotals:{...z,calories:32},targets:{...z,protein:54}});
for (const [cal,protein] of [[120.01,69],[120,69],[119.99,69],[50,69.99],[49.99,40],[50,70],[80,70.01],[0,0],[-1,-1],[0.1,0.1],[200,0],[1200,200]]) {
  emit("threshold "+cal+" "+protein,{totals:{...z,calories:cal,protein},targets:{...z,calories:100,protein:100}});
}
emit("no kcal target",{totals:{...z,calories:1600,protein:10},targets:{...z,calories:-3,protein:100}});
emit("no protein target",{totals:{...z,calories:1000,protein:10},targets:{...z,calories:2000}});
emit("fractional target and grouping",{totals:{...z,calories:10,protein:1234.5,carbs:999.5,fat:-0.1,fiber:-0.5},targets:{calories:0.49,protein:0.1,carbs:1000.5,fat:25.4,fiber:80},loggedTotals:{...z,calories:0.5}});
for (const [kg,delta,source] of [
  [null,10,"profile"],[72,null,"profile"],[72,null,"weight_log"],[0,null,null],
  [75,0,"weight_log"],[74.95,0.05,"weight_log"],[75.05,-0.05,"weight_log"],
  [75.01,-0.04,"weight_log"],[75.01,0.04,"weight_log"],[12345.65,10.15,null],
  [999.95,-999.95,"weight_log"],[1.05,-0.15,"weight_log"],
]) {
  emit("weight "+kg+" "+delta+" "+source,{weightSummary:{currentKg:kg,deltaKg:delta,source},nutritionStreakDays:0,workoutStreakWeeks:3});
}
emit("large streaks",{nutritionStreakDays:30,workoutStreakWeeks:1234,totals:{...z,calories:1201},targets:{...z,calories:1}});
emit("ungrouped warning but grouped target",{totals:{...z,calories:30000.1,protein:0.1},targets:{...z,calories:1000,protein:0.5}});
emit("large finite calories",{totals:{...z,calories:1e21,protein:1},loggedTotals:{...z,calories:1e20},targets:{...z,calories:1,protein:1}});
emit("weight below decimal tie",{weightSummary:{currentKg:9.949999999999998,deltaKg:-0.049999999999999996,source:"weight_log"}});
emit("weight above decimal tie",{weightSummary:{currentKg:9.950000000000001,deltaKg:0.05000000000000001,source:"weight_log"}});
injector.destroy();
