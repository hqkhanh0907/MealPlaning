import type { ExerciseCatalogCorrection } from './exercise-catalog.types';

export const equipmentLabels: Readonly<Record<string, string>> = {
  'ab-wheel': 'Con lăn bụng',
  anchor: 'Thanh giữ cổ chân',
  backpack: 'Ba lô có tải',
  band: 'Dây kháng lực',
  barbell: 'Tạ đòn',
  'battle-ropes': 'Dây thừng tập',
  bench: 'Ghế tập phẳng',
  cable: 'Trạm cáp một bên chỉnh độ cao',
  'captains-chair': 'Ghế nâng chân có đệm tay',
  'decline-bench': 'Ghế dốc xuống có giữ chân',
  doorway: 'Khung cửa chắc',
  dumbbell: 'Tạ đơn',
  'ez-bar': 'Thanh tạ EZ',
  'foam-roller': 'Con lăn xốp',
  'glute-ham-developer': 'Ghế tập mông và đùi sau',
  'incline-bench': 'Ghế tập dốc lên',
  'jump-rope': 'Dây nhảy',
  kettlebell: 'Tạ chuông',
  landmine: 'Đế gắn tạ đòn landmine',
  'medicine-ball': 'Bóng tạ',
  'mini-band': 'Dây kháng lực vòng nhỏ',
  'parallel-bars': 'Xà kép',
  parallettes: 'Xà kép thấp',
  plate: 'Đĩa tạ rời',
  'plyo-box': 'Hộp nhảy',
  post: 'Trụ chắc để vịn hoặc neo',
  'preacher-bench': 'Ghế cuốn tay có đệm dốc',
  'pull-up-bar': 'Xà đơn thẳng',
  'roman-chair': 'Ghế La Mã',
  'smith-machine': 'Máy Smith',
  'squat-rack': 'Giá đỡ tạ đòn',
  'stability-ball': 'Bóng tập thăng bằng',
  step: 'Bục tập chắc',
  'suspension-trainer': 'Dây tập treo',
  table: 'Bàn chắc',
  towel: 'Khăn',
  'trap-bar': 'Thanh tạ lục giác',
  wall: 'Tường chắc để tựa',
  'wrist-roller': 'Thanh cuốn cổ tay',
  'abdominal-crunch-machine': 'Máy gập bụng',
  'air-bike': 'Xe đạp quạt',
  'ankle-strap': 'Đai cổ chân cho cáp',
  'assisted-dip-station': 'Máy xà kép trợ lực',
  'assisted-pull-up-station': 'Máy kéo xà trợ lực',
  'barbell-pad': 'Đệm bọc thanh tạ',
  'belt-squat-belt': 'Đai hông cho máy belt squat',
  'belt-squat-machine': 'Máy squat đai hông',
  'cable-dual-hook-bar': 'Thanh cáp thẳng có móc hai đầu',
  'cable-handle-pair': 'Cặp tay cầm cáp đơn',
  'cable-lat-bar': 'Thanh kéo xô dài',
  'cable-rope': 'Tay cầm dây thừng cho cáp',
  'cable-single-handle': 'Tay cầm cáp đơn',
  'cable-straight-bar': 'Thanh cầm thẳng cho cáp',
  'chest-press-machine': 'Máy đẩy ngực ngang',
  'chest-supported-row-machine': 'Máy kéo ngang có đệm ngực',
  'chest-supported-t-bar-row-machine': 'Máy kéo chữ T có đệm ngực',
  'dual-cable': 'Trạm cáp hai bên chỉnh độ cao',
  elliptical: 'Máy đi bộ elliptical',
  'glute-kickback-machine': 'Máy đá mông đứng có đệm sau đùi',
  'hack-squat-machine': 'Máy hack squat',
  'handled-band': 'Dây kháng lực có tay cầm',
  'hex-dumbbell': 'Tạ đơn lục giác',
  'high-flat-bench': 'Ghế phẳng cao cho bài kéo tạ',
  'high-row-machine': 'Máy kéo cao có đệm ngực',
  'hip-abduction-machine': 'Máy dạng đùi ngồi',
  'hip-adduction-machine': 'Máy khép đùi ngồi',
  'hip-thrust-machine': 'Máy đẩy hông',
  'incline-chest-press-machine': 'Máy đẩy ngực dốc lên dùng đĩa tạ',
  'incline-leg-press-machine': 'Máy đạp đùi xiên',
  'incline-treadmill': 'Máy chạy bộ có nâng dốc',
  'lat-pulldown-station': 'Trạm kéo xô có ghế và đệm đùi',
  'lateral-raise-machine': 'Máy dạng vai có đệm tay',
  'leg-extension-machine': 'Máy duỗi gối ngồi',
  'long-loop-band': 'Dây kháng lực vòng dài',
  'low-cable-row-station': 'Trạm kéo cáp ngồi có bệ gác chân',
  'lying-leg-curl-machine': 'Máy cuốn đùi sau nằm sấp',
  'moving-platform-leg-press-machine': 'Máy đạp đùi ngồi có bệ chân trượt',
  'muscle-up-bar': 'Xà đơn có khoảng trống để lên xà',
  'neutral-grip-pull-up-bar': 'Xà có hai tay nắm song song',
  'overhead-anchor': 'Điểm neo chắc trên cao',
  'pec-deck': 'Máy ép ngực pec deck',
  'pendulum-squat-machine': 'Máy squat con lắc',
  'preacher-curl-machine': 'Máy cuốn tay có đệm dốc',
  'pullover-machine': 'Máy pullover có đệm khuỷu',
  'push-up-blocks': 'Cặp khối kê chắc để chống đẩy',
  'reverse-pec-deck': 'Máy pec deck có chế độ vai sau',
  'rowing-machine': 'Máy chèo có ghế trượt',
  'seated-calf-raise-machine': 'Máy nhón gót ngồi dùng đĩa tạ',
  'seated-dip-machine': 'Máy đẩy tay sau ngồi',
  'seated-leg-curl-machine': 'Máy cuốn đùi sau ngồi',
  'seated-leg-press-machine': 'Máy đạp đùi ngồi có ghế trượt',
  'shoulder-press-machine': 'Máy đẩy vai dùng đĩa tạ',
  'ski-machine': 'Máy kéo trượt tuyết SkiErg',
  'slam-ball': 'Bóng tạ chịu lực ném sàn',
  'stair-climber': 'Máy leo cầu thang',
  'standing-calf-raise-machine': 'Máy nhón gót đứng có đệm vai',
  'standing-leg-curl-machine': 'Máy cuốn đùi sau đứng',
  'stationary-bike': 'Xe đạp tập tại chỗ',
  'throwing-wall': 'Tường chịu lực ném bóng',
  'tibialis-raise-machine': 'Máy nâng mũi chân dùng đĩa tạ',
  treadmill: 'Máy chạy bộ',
  'triceps-extension-machine': 'Máy duỗi tay sau có đệm khuỷu',
  'twister-machine': 'Máy xoay eo đứng có tay vịn',
  'upright-bench': 'Ghế tập có tựa lưng thẳng',
  'v-handle': 'Tay cầm chữ V rời',
  'v-squat-machine': 'Máy squat chữ V',
};

type EquipmentReviewRow = readonly [
  id: string,
  required: readonly string[] | null,
  reason: string,
  source?: string,
];

const stationReviews: readonly EquipmentReviewRow[] = [
  ['air-bike', ['air-bike'], 'Quạt tạo lực cản và tay cầm chuyển động cùng bàn đạp.'],
  [
    'assisted-dip-machine',
    ['assisted-dip-station'],
    'Bệ đệm trợ lực đỡ gối dưới hai tay nắm xà kép.',
  ],
  [
    'assisted-pull-up',
    ['assisted-pull-up-station'],
    'Máy có bệ trợ lực dưới xà để đỡ người khi kéo lên.',
  ],
  [
    'belt-squat',
    ['belt-squat-machine', 'belt-squat-belt'],
    'Đai hông nối vào tải của máy dưới bệ đứng.',
  ],
  [
    'chest-press-machine',
    ['chest-press-machine'],
    'Ghế tựa lưng và hai tay nắm đẩy ra trước ngang ngực.',
  ],
  [
    'chest-supported-t-bar-row',
    ['chest-supported-t-bar-row-machine', 'plate'],
    'Máy có đệm ngực và đầu thanh chữ T gắn đĩa tạ.',
  ],
  ['elliptical', ['elliptical'], 'Hai bàn đạp chạy theo đường elip và có tay cầm di động.'],
  ['hack-squat', ['hack-squat-machine', 'plate'], 'Vai và lưng tựa xe trượt xiên có đĩa tạ.'],
  [
    'hip-abduction-machine',
    ['hip-abduction-machine'],
    'Ghế có hai đệm phía ngoài gối để đẩy đùi ra.',
  ],
  [
    'hip-adduction-machine',
    ['hip-adduction-machine'],
    'Ghế có hai đệm phía trong gối để khép đùi.',
  ],
  [
    'hip-thrust-machine',
    ['hip-thrust-machine'],
    'Bệ đặt chân, đệm tựa lưng và đệm ngang hông thuộc cùng máy.',
  ],
  ['leg-curl', ['lying-leg-curl-machine'], 'Người tập nằm sấp và cuốn con lăn phía sau cổ chân.'],
  [
    'leg-extension',
    ['leg-extension-machine'],
    'Người tập ngồi tựa lưng và nâng con lăn trước cổ chân.',
  ],
  [
    'leg-press',
    ['incline-leg-press-machine', 'plate'],
    'Bệ chân chạy trên ray xiên và mang đĩa tạ.',
  ],
  [
    'leg-press-calf-raise',
    ['incline-leg-press-machine'],
    'Mũi chân tựa bệ trượt xiên để nhón gót.',
  ],
  [
    'leg-press-moving-plate',
    ['moving-platform-leg-press-machine'],
    'Ghế cố định trong khi bệ chân di chuyển theo cáp và khối tạ.',
  ],
  [
    'machine-abdominal-crunch',
    ['abdominal-crunch-machine'],
    'Hai tay giữ tay cầm và chân giữ dưới con lăn của máy.',
  ],
  [
    'machine-glute-kickback',
    ['glute-kickback-machine'],
    'Thân tựa đệm và mặt sau đùi đẩy con lăn khi đứng.',
    'https://www.youtube.com/watch?v=PECosfnmi7s&t=25s',
  ],
  [
    'machine-high-row',
    ['high-row-machine', 'plate'],
    'Ngồi tựa đệm ngực và kéo cần gắn đĩa tạ từ trên cao.',
  ],
  [
    'machine-lateral-raise',
    ['lateral-raise-machine'],
    'Hai đệm tì phía trên khuỷu nâng cùng hai tay.',
  ],
  [
    'machine-preacher-curl',
    ['preacher-curl-machine'],
    'Cánh tay tựa đệm dốc còn tay nắm gắn với máy.',
  ],
  ['machine-pullover', ['pullover-machine'], 'Khuỷu tựa đệm và tay giữ thanh của máy trên đầu.'],
  [
    'machine-row',
    ['chest-supported-row-machine'],
    'Ngực tựa đệm và tay kéo hai tay nắm ngang của máy.',
  ],
  [
    'machine-triceps-extension',
    ['triceps-extension-machine'],
    'Khuỷu tựa đệm khi tay đẩy tay nắm của máy.',
  ],
  ['pec-deck', ['pec-deck'], 'Người tập tựa lưng và khép hai cần của máy trước ngực.'],
  ['pendulum-squat', ['pendulum-squat-machine', 'plate'], 'Đệm vai nối với cần con lắc và đĩa tạ.'],
  [
    'plate-loaded-incline-chest-press',
    ['incline-chest-press-machine', 'plate'],
    'Đẩy hai cần gắn đĩa tạ chếch lên từ ghế nghiêng.',
  ],
  [
    'reverse-pec-deck',
    ['reverse-pec-deck'],
    'Quay mặt vào máy và mở hai cần từ trước ngực sang hai bên.',
  ],
  ['rowing-machine', ['rowing-machine'], 'Máy có ghế trượt, bàn đạp có quai và tay kéo ngang.'],
  [
    'seated-calf-raise-machine',
    ['seated-calf-raise-machine', 'plate'],
    'Cần mang đĩa tạ ép đệm vào đùi trong lúc nhón gót.',
  ],
  [
    'seated-dip-machine',
    ['seated-dip-machine'],
    'Người tập ngồi tựa lưng, đẩy hai tay nắm xuống cạnh ghế.',
  ],
  [
    'seated-leg-curl',
    ['seated-leg-curl-machine'],
    'Máy giữ đùi trên ghế khi chân kéo con lăn xuống dưới.',
  ],
  ['seated-leg-press', ['seated-leg-press-machine'], 'Bệ chân cố định và ghế trượt ra xa khi đạp.'],
  [
    'shoulder-press-machine',
    ['shoulder-press-machine', 'plate'],
    'Người tập ngồi đẩy hai cần gắn đĩa tạ qua đầu.',
  ],
  [
    'single-leg-leg-press',
    ['incline-leg-press-machine', 'plate'],
    'Một chân đạp bệ trượt xiên trong khi lưng tựa ghế.',
  ],
  ['ski-machine', ['ski-machine'], 'Hai tay kéo hai dây từ trên cao xuống trong tư thế đứng.'],
  ['stair-climber', ['stair-climber'], 'Bước trên các bậc chuyển động của máy có tay vịn.'],
  [
    'standing-calf-raise-machine',
    ['standing-calf-raise-machine'],
    'Đứng trên bệ với hai vai tì dưới đệm của máy.',
  ],
  [
    'standing-leg-curl-machine',
    ['standing-leg-curl-machine'],
    'Đứng một chân với cẳng tay tựa đệm và chân kia kéo con lăn.',
  ],
  [
    'standing-twister',
    ['twister-machine'],
    'Đứng trên đĩa xoay và giữ tay vịn cố định phía trước.',
  ],
  [
    'stationary-bike',
    ['stationary-bike'],
    'Xe tại chỗ có yên và bàn đạp, tay giữ tay lái cố định.',
  ],
  [
    'tibialis-raise-machine',
    ['tibialis-raise-machine', 'plate'],
    'Cổ chân nâng cần của máy gắn đĩa tạ khi ngồi.',
  ],
  ['treadmill-incline-walk', ['incline-treadmill'], 'Máy cần nâng băng chạy lên dốc để đi bộ.'],
  ['treadmill-run', ['treadmill'], 'Chạy trên băng chuyền trong tư thế thẳng người.'],
  ['v-squat', ['v-squat-machine', 'plate'], 'Vai và lưng tựa cần squat chữ V gắn đĩa tạ.'],
];

const cableReviews: readonly EquipmentReviewRow[] = [
  [
    'cable-crossover',
    ['dual-cable', 'cable-handle-pair'],
    'Mỗi tay kéo một ròng rọc cao ở hai bên.',
  ],
  ['cable-crunch', ['cable', 'cable-rope'], 'Dây thừng hai đầu nối vào ròng rọc trên cao.'],
  ['cable-curl', ['cable', 'cable-straight-bar'], 'Hai tay nắm thanh ngắn gắn ròng rọc thấp.'],
  [
    'cable-external-rotation',
    ['cable', 'cable-single-handle'],
    'Một tay kéo tay cầm từ ròng rọc ngang eo.',
  ],
  [
    'cable-fly-high-to-low',
    ['dual-cable', 'cable-handle-pair'],
    'Hai tay cầm nối hai ròng rọc cao riêng biệt.',
  ],
  [
    'cable-fly-low-to-high',
    ['dual-cable', 'cable-handle-pair'],
    'Hai tay cầm nối hai ròng rọc thấp riêng biệt.',
  ],
  [
    'cable-front-raise',
    ['cable', 'cable-straight-bar'],
    'Hướng dẫn dùng thanh thẳng nối một ròng rọc thấp phía sau.',
    'https://www.liveleantv.com/how-to-do-a-standing-cable-front-raise/',
  ],
  [
    'cable-internal-rotation',
    ['cable', 'cable-single-handle'],
    'Tay cầm đơn nối ròng rọc ngang eo cùng phía với tay tập.',
  ],
  ['cable-kickback', ['cable', 'ankle-strap'], 'Đai cổ chân nối với ròng rọc thấp.'],
  [
    'cable-lateral-raise',
    ['cable', 'cable-single-handle'],
    'Một tay cầm nối với ròng rọc thấp bên cạnh người.',
  ],
  [
    'cable-overhead-triceps-extension',
    ['cable', 'cable-rope'],
    'Hai tay giữ hai đầu dây thừng từ ròng rọc cao phía sau.',
  ],
  [
    'cable-pull-through',
    ['cable', 'cable-rope'],
    'Hai đầu dây thừng từ ròng rọc thấp luồn qua giữa hai chân.',
  ],
  [
    'cable-shrug',
    ['dual-cable', 'cable-dual-hook-bar'],
    'Mỗi đầu thanh thẳng móc vào một ròng rọc thấp.',
    'https://cdn.shopify.com/s/files/1/0057/5599/4225/files/V-6-Workout-Manual.pdf#page=13',
  ],
  [
    'cable-triceps-kickback',
    ['cable', 'cable-single-handle'],
    'Một tay nắm tay cầm ở ròng rọc thấp khi thân cúi.',
  ],
  [
    'cable-upright-row',
    ['cable', 'cable-straight-bar'],
    'Hai tay giữ thanh ngắn gắn ròng rọc thấp.',
  ],
  [
    'cable-woodchopper',
    ['cable', 'cable-single-handle'],
    'Hai tay cùng giữ một tay cầm ở độ cao ngang vai.',
  ],
  [
    'cable-y-raise',
    ['dual-cable', 'cable-handle-pair'],
    'Hai ảnh cho thấy mỗi tay cầm nối một ròng rọc thấp cùng bên.',
  ],
  [
    'close-grip-lat-pulldown',
    ['lat-pulldown-station', 'v-handle'],
    'Kéo tay cầm chữ V từ trên cao khi đùi giữ dưới đệm.',
  ],
  ['face-pulls', ['cable', 'cable-rope'], 'Hai tay tách hai đầu dây thừng khi kéo về mặt.'],
  [
    'horizontal-cable-twist',
    ['cable', 'cable-single-handle'],
    'Hai tay nắm chung một tay cầm nối ròng rọc ngang ngực.',
  ],
  [
    'lat-pulldown',
    ['lat-pulldown-station', 'cable-lat-bar'],
    'Thanh dài nằm trên đầu, đùi giữ dưới đệm của trạm kéo xô.',
  ],
  [
    'pallof-press',
    ['cable', 'cable-single-handle'],
    'Hai tay giữ chung tay cầm từ cáp ngang ngực.',
  ],
  [
    'reverse-grip-lat-pulldown',
    ['lat-pulldown-station', 'cable-lat-bar'],
    'Tay nắm ngửa thanh kéo xô dài khi đùi tựa dưới đệm.',
  ],
  ['rope-hammer-curl', ['cable', 'cable-rope'], 'Hai tay giữ hai đầu dây thừng nối ròng rọc thấp.'],
  [
    'seated-cable-row',
    ['low-cable-row-station', 'v-handle'],
    'Ngồi kéo tay cầm hẹp hai bên và đặt chân lên bệ.',
  ],
  [
    'single-arm-cable-curl',
    ['cable', 'cable-single-handle'],
    'Tay cầm đơn nối cáp thấp để cuốn một tay.',
  ],
  [
    'single-arm-cable-row',
    ['cable', 'cable-single-handle'],
    'Một tay kéo tay cầm nối ròng rọc ngang hông.',
  ],
  [
    'standing-cable-chest-press',
    ['dual-cable', 'cable-handle-pair'],
    'Đứng giữa hai ròng rọc ngang ngực, mỗi tay giữ một tay cầm.',
  ],
  [
    'standing-cable-hip-abduction',
    ['cable', 'ankle-strap'],
    'Đai cổ chân nối cáp thấp để kéo chân sang bên.',
  ],
  [
    'straight-arm-pulldown',
    ['cable', 'cable-straight-bar'],
    'Hai tay nắm thanh thẳng nối ròng rọc cao.',
  ],
  ['tricep-pushdowns', ['cable', 'cable-straight-bar'], 'Hai tay giữ thanh ngắn gắn ròng rọc cao.'],
];

const additionalReviews: readonly EquipmentReviewRow[] = [
  ['band-ankle-dorsiflexion', ['band', 'post'], 'Dây neo thấp vào chân trụ phía trước người tập.'],
  ['band-bicep-curl', ['handled-band'], 'Người tập giẫm lên dây và nắm hai tay cầm.'],
  ['band-chest-press', ['handled-band', 'post'], 'Dây có tay cầm neo vào cột phía sau.'],
  ['band-external-rotation', ['band', 'post'], 'Dây neo ngang eo ở bên đối diện tay tập.'],
  ['band-glute-kickback', ['mini-band'], 'Dây vòng nhỏ quấn quanh hai cổ chân khi đứng.'],
  ['band-internal-rotation', ['band', 'post'], 'Dây neo ngang eo ở cùng bên với tay tập.'],
  ['band-lat-pulldown', ['band', 'overhead-anchor'], 'Dây neo trên cao, người tập quỳ phía dưới.'],
  [
    'band-lateral-raise',
    ['handled-band'],
    'Hai chân giẫm lên dây và hai tay giữ tay cầm khi dang tay.',
  ],
  ['band-leg-extension', ['band', 'bench'], 'Ngồi trên ghế phẳng, dây neo vào chân ghế phía sau.'],
  [
    'band-lying-leg-curl',
    null,
    'Ảnh dùng đai cổ chân kép nối dây vào trụ, hướng dẫn chỉ mô tả vòng dây qua cổ chân.',
  ],
  [
    'band-overhead-press',
    ['long-loop-band'],
    'Hai bàn chân giẫm lên vòng dây và hai tay đẩy dây qua đầu.',
  ],
  ['band-pallof-press', ['band', 'post'], 'Dây buộc cố định vào cột ngang ngực.'],
  ['band-tricep-pushdown', ['band', 'overhead-anchor'], 'Dây neo trên cao ở phía trước người tập.'],
  [
    'barbell-floor-press',
    ['barbell', 'squat-rack'],
    'Hướng dẫn gốc đặt thanh tạ trên chốt đủ thấp để lấy tạ khi nằm sàn.',
    'https://www.westside-barbell.com/blogs/the-blog/four-weeks-to-a-bench-pr-week-two',
  ],
  ['barbell-step-up', ['barbell', 'step'], 'Người tập mang tạ đòn và bước lên bục chắc.'],
  [
    'battle-rope-double-waves',
    ['battle-ropes', 'post'],
    'Dây cần điểm neo cố định phía trước hai tay.',
    'https://www.acefitness.org/resources/everyone/exercise-library/374/simultaneous-waves/',
  ],
  [
    'bench-press',
    ['barbell', 'bench', 'squat-rack'],
    'Ghế phẳng đặt giữa hai trụ giữ thanh tạ trước khi đẩy.',
  ],
  ['bodyweight-hip-thrust', ['bench'], 'Lưng trên tựa mép ghế phẳng khi đẩy hông.'],
  [
    'close-grip-bench-press',
    ['barbell', 'bench', 'squat-rack'],
    'Thanh tạ lấy từ giá đỡ trong tư thế nằm trên ghế phẳng.',
  ],
  ['deadlift', ['barbell', 'plate'], 'Đĩa tạ nâng thanh lên khỏi sàn ở tư thế bắt đầu.'],
  [
    'decline-bench-press',
    ['barbell', 'decline-bench', 'squat-rack'],
    'Thanh tạ đòn nằm trên giá ở đầu ghế, chân móc vào con lăn.',
  ],
  [
    'deficit-push-up',
    ['push-up-blocks'],
    'Hai lòng bàn tay đặt lên hai khối kê chắc để hạ ngực qua mép.',
  ],
  [
    'dumbbell-calf-raise',
    ['dumbbell', 'post'],
    'Người tập đứng trên sàn, cầm một tạ và vịn trụ bằng tay kia.',
  ],
  [
    'dumbbell-reverse-wrist-curl',
    ['dumbbell', 'bench'],
    'Người tập ngồi trên ghế phẳng và tựa cẳng tay lên đùi.',
  ],
  [
    'dumbbell-shoulder-press',
    ['dumbbell', 'upright-bench'],
    'Hai tạ đơn đẩy từ vai, lưng tựa ghế thẳng.',
  ],
  [
    'dumbbell-skull-crusher',
    ['dumbbell', 'bench'],
    'Người tập nằm ngửa trên ghế phẳng và cầm hai tạ đơn.',
  ],
  [
    'dumbbell-squeeze-press',
    ['dumbbell', 'bench'],
    'Hai tạ ép sát nhau trong lúc người tập nằm trên ghế phẳng.',
  ],
  [
    'dumbbell-wrist-curl',
    ['dumbbell', 'bench'],
    'Người tập ngồi trên ghế phẳng và tựa cẳng tay lên đùi.',
  ],
  [
    'feet-elevated-inverted-row',
    ['barbell', 'squat-rack', 'bench'],
    'Tay nắm thanh trên giá đỡ trong lúc chân gác lên ghế phẳng.',
  ],
  ['front-squat', ['barbell', 'squat-rack'], 'Gỡ tạ từ giá đỡ để đặt ngang vai trước.'],
  [
    'hang-clean',
    ['barbell', 'plate'],
    'Cả hai ảnh cho thấy đĩa lắp trên thanh tạ, phù hợp thiết lập trong hướng dẫn.',
  ],
  [
    'hip-thrusts',
    ['barbell', 'bench', 'plate'],
    'Lưng tựa ghế phẳng và thanh có đĩa đặt ngang hông.',
  ],
  [
    'incline-bench-press',
    ['barbell', 'incline-bench', 'squat-rack'],
    'Thanh tạ lấy từ giá đỡ khi lưng nằm trên ghế dốc lên.',
  ],
  ['kettlebell-row', ['kettlebell', 'bench'], 'Tay và gối bên không tập tựa trên ghế phẳng.'],
  [
    'landmine-romanian-deadlift',
    ['landmine', 'barbell', 'plate'],
    'Một đầu thanh gài vào đế, đầu có đĩa nằm trong hai tay.',
  ],
  [
    'landmine-rotation',
    ['landmine', 'barbell', 'plate'],
    'Hai tay xoay đầu thanh mang đĩa quanh đầu thanh gài trong đế.',
  ],
  [
    'landmine-squat',
    ['landmine', 'barbell', 'plate'],
    'Đế giữ một đầu thanh và người tập giữ đầu có đĩa trước ngực.',
  ],
  ['lateral-neck-raise', ['bench'], 'Người tập nằm nghiêng trên ghế phẳng với đầu ngoài mép ghế.'],
  ['leg-swings', ['post'], 'Một tay vịn trụ khi chân còn lại vung.'],
  [
    'meadows-row',
    ['landmine', 'barbell', 'plate'],
    'Đế giữ một đầu thanh, tay kéo đầu kia có đĩa tạ.',
  ],
  [
    'medicine-ball-chest-pass',
    ['medicine-ball', 'throwing-wall'],
    'Bóng cần nảy lại từ tường chịu lực ném.',
  ],
  [
    'medicine-ball-slam',
    ['slam-ball'],
    'Biến thể ném bóng xuống sàn cần loại bóng chịu va đập.',
    'https://www.smai.com.au/blogs/news/exercise-balls-whats-the-difference',
  ],
  [
    'muscle-up',
    ['muscle-up-bar'],
    'Người tập chuyển qua phía trên xà, cần không gian trống phía trên và trước xà.',
  ],
  ['neck-extension', ['bench'], 'Người tập nằm sấp trên ghế phẳng với đầu ngoài mép ghế.'],
  ['neck-flexion', ['bench'], 'Người tập nằm ngửa trên ghế phẳng với đầu ngoài mép ghế.'],
  [
    'neutral-grip-pull-up',
    ['neutral-grip-pull-up-bar'],
    'Hai lòng bàn tay hướng vào nhau trên hai tay nắm song song.',
  ],
  ['overhead-press', ['barbell', 'squat-rack'], 'Thanh tạ lấy từ giá đỡ ngang vai khi đứng.'],
  ['overhead-squat', ['barbell', 'plate'], 'Người tập giữ thanh có đĩa trên đầu.'],
  [
    'renegade-row',
    ['hex-dumbbell'],
    'Hai tạ lục giác giữ ổn định khi người tập chống tay lên một tạ.',
  ],
  ['reverse-curl', ['barbell'], 'Ảnh minh họa thanh thẳng, hướng dẫn cũng cho phép thanh EZ.'],
  [
    'reverse-nordic',
    ['anchor'],
    'Hai ảnh đầu và hướng dẫn cho thấy thanh đệm giữ cổ chân sát sàn.',
  ],
  [
    'reverse-wrist-curl',
    ['dumbbell', 'bench'],
    'Ảnh và hướng dẫn đều dùng hai tạ đơn với ghế phẳng.',
  ],
  [
    'seal-row',
    ['dumbbell', 'high-flat-bench'],
    'Người tập nằm sấp trên ghế phẳng cao để tạ di chuyển dưới ghế.',
  ],
  [
    'seated-dumbbell-curl',
    ['dumbbell', 'upright-bench'],
    'Người tập ngồi sát lưng ghế khi cuốn hai tạ đơn.',
  ],
  ['seated-knee-extension', ['bench'], 'Người tập ngồi mép ghế phẳng và chống hai tay lên ghế.'],
  [
    'smith-machine-hip-thrust',
    ['smith-machine', 'bench', 'barbell-pad'],
    'Lưng trên tì mép ghế và đệm bọc thanh tạ đặt ngang hông.',
  ],
  [
    'spider-curl',
    ['barbell', 'incline-bench'],
    'Ảnh dùng thanh thẳng và ghế dốc, hướng dẫn cũng cho phép thanh EZ.',
  ],
  ['squat', ['barbell', 'squat-rack'], 'Lấy thanh tạ từ giá đỡ và đặt ngang lưng trên.'],
  [
    'stability-ball-wall-squat',
    ['stability-ball', 'wall'],
    'Bóng tập cần tường giữ ở sau lưng khi hạ người.',
  ],
  [
    'suspension-assisted-squat',
    ['suspension-trainer', 'overhead-anchor'],
    'Dây tập treo neo cao phía trước và hai tay giữ tay cầm.',
  ],
  [
    'suspension-biceps-curl',
    ['suspension-trainer', 'overhead-anchor'],
    'Dây tập treo neo cao chịu lực khi người tập ngả ra sau.',
  ],
  [
    'suspension-chest-press',
    ['suspension-trainer', 'overhead-anchor'],
    'Dây tập treo neo cao phía sau khi người tập nghiêng ra trước.',
  ],
  [
    'suspension-hamstring-curl',
    ['suspension-trainer', 'overhead-anchor'],
    'Dây tập treo neo trên cao, hai gót đặt trong quai dưới.',
  ],
  [
    'suspension-row',
    ['suspension-trainer', 'overhead-anchor'],
    'Dây tập treo neo cao chịu lực khi kéo thân lên.',
  ],
  [
    'suspension-triceps-extension',
    ['suspension-trainer', 'overhead-anchor'],
    'Dây tập treo neo cao phía sau khi hai tay duỗi trước mặt.',
  ],
  [
    't-bar-row',
    ['landmine', 'barbell', 'plate', 'v-handle'],
    'Tay cầm chữ V luồn dưới thanh tạ gài đế, gần đầu mang đĩa.',
  ],
  ['towel-wring', ['towel', 'bench'], 'Người tập ngồi trên ghế phẳng trong khi vắt khăn.'],
  [
    'trap-bar-deadlift',
    ['trap-bar', 'plate'],
    'Thanh lục giác có đĩa tạ ở hai bên và tay nắm cao.',
  ],
  ['wall-tibialis-raise', ['wall'], 'Người tập tựa lưng và mông vào tường khi nâng mũi chân.'],
  [
    'wide-grip-bench-press',
    ['barbell', 'bench', 'squat-rack'],
    'Hai tay nắm rộng trên thanh đặt trên giá của ghế phẳng.',
  ],
];

const illustrationRoot =
  'https://github.com/hitmanrepo/open-exercise-illustrations/tree/2786aefa4b36a08faeca8114e0d1eb0af3ef6732/images';

export const equipmentReviews: Readonly<
  Record<string, { required: readonly string[] | null; source: string; reason: string }>
> = Object.fromEntries(
  [...stationReviews, ...cableReviews, ...additionalReviews].map(
    ([id, required, reason, source = `${illustrationRoot}/${id}`]) => [
      id,
      { required, source, reason },
    ],
  ),
);
export const exerciseCatalogCorrections: Readonly<Record<string, ExerciseCatalogCorrection>> = {
  'adductor-rock-backs': {
    primary: {
      before: ['glutes'],
      after: ['adductors'],
    },
    source: 'https://theprehabguys.com/vimeo-video/quadruped-dynamic-long-adductor-stretch/',
    reason:
      'Hướng dẫn [P]rehab nêu cảm giác giãn ở bẹn và mặt trong của đùi duỗi. Nguồn không xác nhận mông hay đùi sau là mục tiêu.',
    secondary: {
      before: ['hamstrings'],
      after: [],
    },
  },
  'archer-push-up': {
    perSide: {
      before: false,
      after: true,
    },
    source: 'https://www.nasm.org/resource-center/exercise-library/archer-push-up',
    reason:
      'NASM mô tả bài chống đẩy một bên chịu tải. Mục hỏi đáp ghi số lần mỗi bên dù người tập đổi bên sau từng lần.',
  },
  'band-ankle-dorsiflexion': {
    movementPattern: {
      before: 'pull-v',
      after: 'ankle-dorsiflexion',
    },
    source:
      'https://www.orthoinfo.org/globalassets/pdfs/foot-and-ankle-conditioning-program---2025.pdf',
    reason: 'Dây cản chuyển động nâng mũi chân về phía cẳng chân.',
  },
  'band-dislocates': {
    primary: {
      before: ['back'],
      after: ['shoulders'],
    },
    source: 'https://theprehabguys.com/vimeo-video/shoulder-pass-through-band/',
    reason:
      'Nguồn [P]rehab mô tả đưa dây qua đầu để vận động vai. Giữ cơ thang ở vai trò hỗ trợ và bỏ nhãn lưng chung.',
    secondary: {
      before: ['shoulders'],
      after: ['back'],
    },
  },
  'band-glute-kickback': {
    perSide: {
      before: false,
      after: true,
    },
    source:
      'https://www.acefitness.org/continuing-education/certified/july-2025/8898/a-pro-s-guide-to-muscle-mechanics-the-hip-adductors/',
    reason:
      'Một chân trụ và chân còn lại duỗi hông. Hướng dẫn đổi chân, nguồn ACE mô tả điểm bắt đầu trên một chân.',
  },
  'band-lying-leg-curl': {
    illustrationNote: {
      before: null,
      after: 'Ảnh vẽ hai đai cổ chân nối dây neo thấp. Hướng dẫn dùng dây vòng qua cả hai cổ chân.',
    },
    source:
      'https://github.com/hitmanrepo/open-exercise-illustrations/tree/2786aefa4b36a08faeca8114e0d1eb0af3ef6732/images/band-lying-leg-curl',
    reason:
      'Cần ghi rõ người tập đang xem khác biệt về cách nối dây. Nguồn BODi nêu dây vòng và ảnh mô tả đai.',
  },
  'band-pallof-press': {
    perSide: {
      before: false,
      after: true,
    },
    source:
      'https://www.acefitness.org/resources/everyone/exercise-library/332/standing-anti-rotation-press/',
    reason:
      'Lực kéo từ một phía của thân. Ghi theo từng phía dây kéo và làm đủ hai phía trước khi kết thúc hiệp theo quy ước bên của app. ACE yêu cầu dây ngang ngực ở ngay bên cơ thể và nhịp giữ ngắn mỗi lần. Đổi bên để tập đủ hai hướng kéo.',
    guide: {
      before: {
        steps: [
          'Buộc dây ngang ngực rồi đứng ngang với điểm buộc, để dây chạy sang một bên người. Đan hai tay giữ dây sát ngực, khuỷu khép sát thân.',
          'Đẩy hai tay thẳng ra phía trước và giữ ngắn. Không để dây kéo vai và thân xoay về phía điểm buộc.',
          'Thu hai tay về ngực chậm rãi. Giữ lưng thẳng và bụng siết suốt bài.',
        ],
      },
      after: {
        steps: [
          'Buộc dây ngang ngực rồi đứng ngang với điểm buộc, để dây chạy sang một bên người. Đan hai tay giữ dây sát ngực, khuỷu khép sát thân.',
          'Đẩy hai tay thẳng ra phía trước và giữ ngắn. Không để dây kéo vai và thân xoay về phía điểm buộc.',
          'Thu hai tay về ngực chậm rãi, giữ lưng thẳng và siết bụng. Làm đủ số lần rồi quay người đổi bên.',
        ],
      },
    },
  },
  'barbell-floor-press': {
    guide: {
      before: {
        equipment: 'Tạ đòn · nằm ngửa trên sàn, hai chân co gối',
        startPosition:
          'Nằm ngửa trên sàn, hai gối co và bàn chân đặt sàn. Hai tay duỗi thẳng nắm thanh tạ phía trên ngực.',
      },
      after: {
        equipment: 'Tạ đòn · giá có chốt hoặc móc đủ thấp · nằm ngửa trên sàn',
        startPosition:
          'Đặt thanh trên chốt hoặc móc ở tầm lấy được khi nằm sàn. Nằm ngửa, co gối, bàn chân áp sàn, lấy thanh ra và giữ ngang trên ngực.',
      },
    },
    source: 'https://www.westside-barbell.com/blogs/the-blog/four-weeks-to-a-bench-pr-week-two',
    reason:
      'Westside xác nhận phải căn chốt hoặc móc tạ theo độ cao khi nằm sàn. Yêu cầu này đã có trong bộ lọc. Hướng dẫn gốc bước đầu căn chốt hoặc móc. Ảnh bỏ qua cách lấy tạ và đã có chú thích trục sai.',
  },
  'barbell-pullover': {
    primary: {
      before: ['back', 'chest'],
      after: ['chest'],
    },
    source: 'https://pubmed.ncbi.nlm.nih.gov/21975179/',
    reason:
      'Nghiên cứu EMG với tạ đòn tự do ghi nhận cơ ngực lớn hoạt động cao hơn cơ lưng rộng ở tải và kỹ thuật nghiên cứu. Giữ cơ lưng rộng trong nhóm phụ.',
    secondary: {
      before: ['triceps'],
      after: ['back', 'triceps'],
    },
  },
  'barbell-split-squat': {
    perSide: {
      before: false,
      after: true,
    },
    source: 'https://www.catalystathletics.com/exercise/174/Split-Squat/',
    reason:
      'Hai chân cố định trước và sau. Catalyst mô tả gối và hông của chân trước chịu hướng tải chính và bài dùng để xử lý chênh lệch một bên. Hướng dẫn hiện mô tả một tư thế so le suốt mỗi lần. Cần ghi rõ đổi chân giữa hai bên tập.',
    guide: {
      before: {
        steps: [
          'Giữ thân thẳng và hạ gối sau xuống gần sàn bằng cách gập hai gối.',
          'Giữ gối trước thẳng hướng mũi chân, đạp gót trước xuống sàn.',
          'Đạp chân trước để đứng lên, hai chân giữ nguyên vị trí và không bước thêm.',
        ],
      },
      after: {
        steps: [
          'Giữ thân thẳng và hạ gối sau xuống gần sàn bằng cách gập hai gối.',
          'Giữ gối trước thẳng hướng mũi chân, đạp gót trước xuống sàn.',
          'Đạp chân trước để đứng lên, giữ nguyên chỗ đặt hai chân. Sau khi làm đủ số lần, đổi chân trước và chân sau.',
        ],
      },
    },
  },
  'bench-dip': {
    primary: {
      before: ['chest', 'triceps'],
      after: ['triceps'],
    },
    source: 'https://www.mdpi.com/1660-4601/19/20/13211#sec4dot1-ijerph-19-13211',
    reason:
      'McKenzie và cộng sự đo bench dip với gót tựa sàn. Kết luận tay sau đóng vai trò nổi trội; ngực và vai trước có hoạt động thấp hơn.',
    secondary: {
      before: ['shoulders'],
      after: ['chest', 'shoulders'],
    },
  },
  'broad-jump': {
    illustrationNote: {
      before: null,
      after:
        'Khung cuối dừng lúc người còn ở trên không. Đáp nhẹ bằng cả hai bàn chân như hướng dẫn.',
    },
    source:
      'https://github.com/hitmanrepo/open-exercise-illustrations/tree/2786aefa4b36a08faeca8114e0d1eb0af3ef6732/images/broad-jump',
    reason: 'Ảnh ghim cắt trước khi tiếp đất; hướng dẫn mô tả gập gối lúc đáp.',
  },
  'butterfly-stretch': {
    primary: {
      before: ['glutes'],
      after: ['adductors'],
    },
    source: 'https://www.middlebury.edu/sites/default/files/2021-01/Static%20Stretching.pdf',
    reason:
      'Hướng dẫn Sports Medicine nêu tư thế ngồi, lòng bàn chân chạm nhau và cảm giác căng ở mặt trong đùi. Nguồn lâm sàng mô tả đây là tư thế giãn bẹn hoặc đùi trong.',
    guide: {
      before: {
        purpose:
          'Bài giãn cơ giữ tĩnh giúp mở đùi trong và hông khi ngồi hai lòng bàn chân chạm nhau.',
      },
      after: {
        purpose: 'Tư thế này giúp giãn các cơ khép ở mặt trong đùi.',
      },
    },
  },
  'cable-lateral-raise': {
    perSide: {
      before: false,
      after: true,
    },
    source: 'https://www.catalystathletics.com/exercise/811/Cable-Lateral-Raise/',
    reason:
      'Catalyst mô tả đúng biến thể một tay, vai không tải quay về máy. Ảnh đổi tay là lỗi minh họa đã ghi chú. Cáp chỉ tải một tay trong mỗi lần thực hiện của biến thể hiện tại.',
    guide: {
      before: {
        steps: [
          'Siết bụng, giữ ngực mở và vai hạ thấp. Nâng tay cầm tay nắm thẳng sang ngang, khuỷu hơi gập, dây cáp đi qua trước thân.',
          'Dừng khi cánh tay song song sàn. Giữ hông thẳng, không nghiêng thân để lấy đà.',
          'Hạ tay chậm về trước hông, giữ cáp căng suốt động tác.',
        ],
      },
      after: {
        steps: [
          'Siết bụng, giữ ngực mở và vai hạ thấp. Nâng tay cầm tay nắm thẳng sang ngang, khuỷu hơi gập, dây cáp đi qua trước thân.',
          'Dừng khi cánh tay song song sàn. Giữ hông thẳng, không nghiêng thân để lấy đà.',
          'Hạ tay chậm về trước hông, giữ cáp căng. Làm đủ số lần rồi quay người để đổi tay.',
        ],
      },
    },
  },
  'cable-shrug': {
    guide: {
      before: {
        sourceUrl:
          'https://cdn.shopify.com/s/files/1/0057/5599/4225/files/V-6-Workout-Manual.pdf#page=13',
        source: 'HOIST Fitness · V-6 Shoulder Shrug',
      },
      after: {
        sourceUrl:
          'https://cdn.shopify.com/s/files/1/0057/5599/4225/files/V-6-Workout-Manual.pdf#page=13',
        source: 'HOIST Fitness · V-6 Shoulder Shrug',
      },
    },
    source: 'https://cdn.shopify.com/s/files/1/0057/5599/4225/files/V-6-Workout-Manual.pdf#page=13',
    reason:
      'HOIST V-6 trang in 12 có ảnh trước và sau. Thanh thẳng trước đùi nối hai ròng rọc thấp. Người tập đứng và nâng vai với tay duỗi. Giữ cảnh báo lỗi hình và nói rõ cách mắc cáp trong tài liệu HOIST.',
    illustrationNote: {
      before: 'Hình vẽ cáp kéo chéo sang hai bên và vị trí trụ máy đổi giữa các khung.',
      after:
        'Móc mỗi đầu thanh vào một ròng rọc thấp và giữ hai khuỷu duỗi khi nhún vai. Trụ máy trong ảnh đổi vị trí giữa hai khung.',
    },
  },
  'cable-triceps-kickback': {
    perSide: {
      before: false,
      after: true,
    },
    source: 'src/app/core/models/exercise-guides/push-h-guides.ts:177',
    reason: 'Hướng dẫn hiện mô tả một tay ở ròng rọc thấp và ghi rõ hoàn tất một bên rồi đổi tay.',
  },
  'cable-upright-row': {
    movementPattern: {
      before: 'pull-h',
      after: 'pull-v',
    },
    source: 'https://www.puregym.com/exercises/arms-and-shoulders/upright-rows/cable-upright-row/',
    reason: 'Nguồn và ảnh cho thấy kéo thanh ngắn từ đùi lên ngực theo phương dọc thân.',
  },
  'cable-woodchopper': {
    perSide: {
      before: false,
      after: true,
    },
    source:
      'https://www.acefitness.org/resources/everyone/exercise-library/349/standing-rotational-chop/',
    reason:
      'ACE mô tả tải từ một phía, xoay thân và kéo qua hông đối diện. Đảo phía hệ thống để tập hướng còn lại.',
  },
  'chest-supported-dumbbell-row': {
    perSide: {
      before: true,
      after: false,
    },
    source: 'https://www.catalystathletics.com/exercise/824/Dumbbell-Incline-Bench-Row/',
    reason:
      'Catalyst xác nhận ngực tựa ghế dốc, một tạ ở mỗi tay và kéo cả hai khuỷu. Hai ảnh khớp bản hai tay. Giữ tổng khối lượng hai tạ. Sau khi sửa nhãn ghi, cả hình và hướng dẫn đều khớp bài hai tay.',
    illustrationNote: {
      before: 'Hình minh họa kéo hai tạ cùng lúc. Nhãn ghi hiệp hiển thị theo từng bên.',
      after: null,
    },
  },
  'copenhagen-plank': {
    primary: {
      before: ['abs'],
      after: ['adductors'],
    },
    source: 'https://pubmed.ncbi.nlm.nih.gov/42933384/',
    reason:
      'Nghiên cứu đo mô-men khép hông trong Copenhagen đẳng trường, gồm đòn bẩy dài. Bên chịu tải ở chân trên làm việc với nhóm cơ khép, còn thân giữ ổn định. Nghiên cứu trực tiếp xác nhận trọng tâm khép hông ở bài đòn bẩy dài.',
    secondary: {
      before: [],
      after: ['abs'],
    },
    guide: {
      before: {
        purpose:
          'Động tác giữ tĩnh giúp tập cơ khép đùi và cơ liên sườn với một chân gác trên ghế phẳng.',
      },
      after: {
        purpose: 'Bài giữ tĩnh giúp tập cơ khép đùi của chân trên và giữ thân ổn định.',
      },
    },
  },
  'decline-bench-press': {
    guide: {
      before: {
        equipment: 'Tạ đòn · ghế dốc xuống, hai chân móc vào con lăn',
      },
      after: {
        equipment: 'Tạ đòn · ghế dốc xuống · giá đỡ thanh · hai chân móc vào con lăn',
      },
    },
    source:
      'https://github.com/hitmanrepo/open-exercise-illustrations/tree/2786aefa4b36a08faeca8114e0d1eb0af3ef6732/images/decline-bench-press',
    reason: 'Hình có giá đỡ thanh và bộ lọc yêu cầu giá. Mô tả thiết bị bỏ qua giá.',
  },
  dips: {
    movementPattern: {
      before: 'push-h',
      after: 'push-v',
    },
    source:
      'https://github.com/hitmanrepo/open-exercise-illustrations/tree/2786aefa4b36a08faeca8114e0d1eb0af3ef6732/images/dips',
    reason: 'Thân đi lên và xuống trên xà kép, còn hướng dẫn mô tả đẩy xuống xà.',
  },
  'doorway-chest-stretch': {
    guide: {
      before: {
        alt: 'Người đứng nhìn chếch trước, một bàn tay áp lên cột kim loại bên trái ảnh ở khoảng ngang đầu, cánh tay duỗi gần thẳng chếch lên. Thân người đứng thẳng, hai bàn chân đặt trên sàn, tay còn lại thả dọc thân.',
      },
      after: {
        alt: 'Đứng cạnh trụ, cánh tay trên nâng gần ngang vai, khuỷu gập khoảng vuông và cẳng tay áp trụ. Tay kia buông dọc thân.',
      },
    },
    source:
      'https://github.com/hitmanrepo/open-exercise-illustrations/tree/2786aefa4b36a08faeca8114e0d1eb0af3ef6732/images/doorway-chest-stretch',
    reason:
      'Ảnh cận thấy khuỷu gập và cẳng tay dựng. Alt hiện tại mô tả cánh tay gần thẳng. Ảnh và Sunderland chỉ mỗi lượt giãn một bên. Hướng dẫn app yêu cầu đổi bên.',
    perSide: {
      before: false,
      after: true,
    },
    supportingSources: ['https://sunderlandims.co.uk/exercises/pectoral-stretch-in-doorway/'],
  },
  'dumbbell-deadlift': {
    guide: {
      before: {
        sourceUrl:
          'https://kerstenkimura.com/blog/mastering-the-dumbbell-deadlift-a-must-do-strength-exercise-for-women-40/',
        source: 'Kersten Kimura Coaching · Conventional Dumbbell Deadlift',
      },
      after: {
        sourceUrl:
          'https://kerstenkimura.com/blog/mastering-the-dumbbell-deadlift-a-must-do-strength-exercise-for-women-40/',
        source: 'Kersten Kimura Coaching · Conventional Dumbbell Deadlift',
      },
    },
    source:
      'https://kerstenkimura.com/blog/mastering-the-dumbbell-deadlift-a-must-do-strength-exercise-for-women-40/',
    reason:
      'ACE hướng dẫn tạ đòn. Hướng dẫn Kersten Kimura mục conventional dùng hai tạ bên thân, gập hông và gối đến gần ống chân.',
  },
  'dumbbell-fly': {
    illustrationNote: {
      before: null,
      after: 'Khung cuối vẽ khuỷu gập sâu. Theo hướng dẫn, giữ khuỷu hơi gập trong cả vòng cung.',
    },
    source: 'https://www.acefitness.org/resources/everyone/exercise-library/21/lying-chest-fly/',
    reason:
      'Ảnh cận cho thấy khuỷu gập sâu ở đáy. ACE mô tả khuỷu hơi gập và giữ góc đó khi hạ và nâng.',
  },
  'dumbbell-kickback': {
    perSide: {
      before: false,
      after: true,
    },
    source: 'https://www.muscleandfitness.com/exercise/workouts/arm-exercises/dumbbell-kickback/',
    reason: 'Một tay và gối tựa ghế, tay kia tập duỗi khuỷu. Nguồn dạy đúng bài một tay.',
  },
  'dumbbell-preacher-curl': {
    perSide: {
      before: false,
      after: true,
    },
    source: 'https://www.catalystathletics.com/exercise/889/Single-Arm-Dumbbell-Preacher-Curl/',
    reason: 'Catalyst hướng dẫn từng tay trên đệm và chữ của app có đổi tay.',
  },
  'dumbbell-pullover': {
    movementPattern: {
      before: 'push-h',
      after: 'shoulder-extension',
    },
    source: 'https://www.majorfitness.com/blogs/training-tips/dumbbell-pullover',
    reason:
      'Major Fitness phân biệt biến thể nằm dọc ghế và gọi động tác là duỗi vai. Khuỷu ít đổi góc khi đưa tạ qua đầu. Cần một nhãn khám phá riêng nếu bổ sung bộ lọc chuyển động.',
  },
  'dumbbell-side-bend': {
    perSide: {
      before: false,
      after: true,
    },
    source:
      'https://github.com/hitmanrepo/open-exercise-illustrations/tree/2786aefa4b36a08faeca8114e0d1eb0af3ef6732/images/dumbbell-side-bend',
    reason:
      'Ảnh và hướng dẫn chỉ dùng một tạ và một bên làm việc mỗi lượt. Giữ lưu ý ảnh nghiêng ngược hướng hướng dẫn. Chỉ dẫn nêu gập nghiêng thân và giữ vai không xoay. Nhóm core mô tả bài chính xác hơn mã xoay.',
    movementPattern: {
      before: 'rotation',
      after: 'core',
    },
    supportingSources: ['https://www.strengthlog.com/dumbbell-side-bend/'],
  },
  'glute-ham-raise': {
    movementPattern: {
      before: 'hinge',
      after: 'knee-flexion',
    },
    source: 'https://www.menshealth.com/fitness/a74314844/glute-ham-raise-ghr/',
    reason:
      'Trevor Thieme, CSCS, mô tả hạ đến ngang, giữ hông cố định và nâng bằng gập gối. NSCA có nhịp gập hông bổ sung khi hạ sâu hơn ngang. Hình và chữ hiện tại dừng ngang.',
  },
  'hip-abduction-machine': {
    perSide: {
      before: true,
      after: false,
    },
    source: 'https://www.puregym.com/exercises/legs/inner-outer-thigh/seated-hip-abduction/',
    reason:
      'Hai gối cùng đẩy hai đệm ra ngoài trong ảnh và hướng dẫn đầu đến cuối. Một chu kỳ của hai chân là một lần.',
  },
  'hip-adduction-machine': {
    primary: {
      before: ['glutes'],
      after: ['adductors'],
    },
    source: 'https://www.puregym.com/exercises/legs/inner-outer-thigh/seated-hip-adduction/',
    reason:
      'PureGym nêu adductor magnus, adductor longus và gracilis là cơ chính. Cần nhóm Cơ khép đùi cho khám phá, tách khỏi cột thống kê hiện có.',
  },
  'horizontal-cable-twist': {
    perSide: {
      before: false,
      after: true,
    },
    source:
      'https://www.acefitness.org/resources/everyone/exercise-library/102/standing-trunk-rotation/',
    reason:
      'Cáp cố định một bên thân và mỗi lần chỉ xoay chống lực về một hướng. Đổi bên máy để tập hướng còn lại.',
  },
  'kettlebell-clean': {
    perSide: {
      before: false,
      after: true,
    },
    source:
      'https://www.strongfirst.com/an-olympic-weightlifting-approach-to-coaching-the-kettlebell-clean/',
    reason: 'Hướng dẫn StrongFirst và ảnh dùng một tay khi đưa một tạ chuông lên tư thế gác vai.',
  },
  'kettlebell-press': {
    primary: {
      before: ['chest', 'triceps'],
      after: ['shoulders', 'triceps'],
    },
    source:
      'https://www.acefitness.org/resources/everyone/exercise-library/395/single-arm-overhead-press/',
    reason:
      'ACE xếp bài một tay đẩy tạ chuông qua đầu vào Vai. Ảnh cho thấy tạ đi thẳng trên vai. Bỏ Ngực khỏi cơ chính khi khám phá. Cả ảnh và nguồn đều đẩy tạ từ vai lên trên đầu. Chỉ một tay đẩy và hạ tạ suốt mỗi lần. StrongFirst mô tả một bên có tải và bên còn lại không tải.',
    movementPattern: {
      before: 'push-h',
      after: 'push-v',
    },
    perSide: {
      before: false,
      after: true,
    },
    supportingSources: ['https://www.strongfirst.com/mastering-your-press-part-ii/'],
  },
  'kettlebell-romanian-deadlift': {
    guide: {
      before: {
        sourceUrl: 'https://health.clevelandclinic.org/is-kettlebell-training-right-for-you',
        source: 'Cleveland Clinic · Kettlebell Romanian Deadlift',
      },
      after: {
        sourceUrl: 'https://www.dvidshub.net/video/548741/kettlebell-romanian-deadlift',
        source: 'U.S. Marine Corps · Kettlebell Romanian Deadlift',
      },
    },
    source: 'https://www.dvidshub.net/video/548741/kettlebell-romanian-deadlift',
    reason:
      'US Marine Corps hướng dẫn đứng hai tay giữ một quai, gập hông với gối chùng nhẹ, tạ sát thân. Cleveland Clinic mô tả ngắn RDL chuông trong bài tổng quan.',
  },
  'kettlebell-snatch': {
    perSide: {
      before: false,
      after: true,
    },
    source: 'https://www.crossfit.com/essentials/the-kettlebell-snatch',
    reason: 'Ảnh và CrossFit mô tả một tay đưa tạ tới tư thế khóa trên đầu.',
  },
  'kneeling-hip-flexor-stretch': {
    primary: {
      before: ['quads'],
      after: ['hip-flexors'],
    },
    source:
      'https://www.acefitness.org/resources/everyone/exercise-library/142/kneeling-hip-flexor-stretch/',
    reason:
      'ACE gọi đây là giãn cơ gập hông và chỉ vị trí căng trước hông chân quỳ. Giữ Đùi trước là ánh xạ gần nếu chưa có nhóm cơ gập hông riêng.',
  },
  'knees-to-chest': {
    primary: {
      before: ['chest'],
      after: ['back'],
    },
    source:
      'https://www.arthritis-uk.org/information-and-support/living-with-arthritis/health-and-wellbeing/exercising-with-arthritis/exercises-for-healthy-joints/back-pain-exercises/double-knees-to-chest/',
    reason:
      'Arthritis UK đưa đúng động tác hai gối sát ngực trong nhóm lưng. Hướng dẫn app xác định cảm giác căng ở lưng dưới.',
  },
  'lateral-neck-raise': {
    primary: {
      before: ['shoulders'],
      after: ['neck'],
    },
    source:
      'https://github.com/hitmanrepo/open-exercise-illustrations/tree/2786aefa4b36a08faeca8114e0d1eb0af3ef6732/images/lateral-neck-raise',
    reason: 'Hai khung cho thấy chỉ đầu nâng khỏi mép ghế khi vai không di chuyển.',
  },
  'lying-spinal-twist': {
    perSide: {
      before: false,
      after: true,
    },
    source: 'https://www.chcpmsk.org.uk/uploads/resource/document/47/Back_Exercises-_Moderate.pdf',
    reason:
      'Hình và nguồn cho biến thể một chân vắt sang một bên. Hướng dẫn tiếng Việt giữ tư thế rồi đổi bên. Nhãn giây mỗi bên làm rõ một lần giữ.',
  },
  'muscle-up': {
    secondary: {
      before: ['biceps', 'abs'],
      after: ['biceps', 'abs', 'triceps'],
    },
    source: 'https://www.crossfit.com/essentials/the-strict-bar-muscle-up',
    reason:
      'Pha dip trong hướng dẫn strict duỗi khuỷu nâng cơ thể lên trên xà. Xếp tay sau phụ để không bỏ phần đẩy khi lọc. Đây là suy luận từ cơ học của biến thể, không phải đo kích hoạt trên hình.',
  },
  'neck-extension': {
    guide: {
      before: {
        sourceUrl: 'https://fysiofitaal.nl/en/exercise/extension-neck-head-over-bench/',
        source: 'Fysio Fitaal · Extension Neck Head Over Bench',
        startPosition:
          'Nằm sấp, để ngực và bụng tựa ghế. Đặt đầu vừa qua mép ghế, thả lỏng vai và đặt tay dọc thân hoặc trên ghế.',
        steps: [
          'Giữ cổ gần trung tính và bắt đầu với đầu hơi hướng xuống.',
          'Nâng đầu chậm tới ngang thân. Giữ ngực tựa ghế và tránh ngửa cổ quá mức.',
          'Hạ đầu từ từ trong tầm kiểm soát. Dừng nếu đau nhói, chóng mặt hoặc có triệu chứng lan xuống tay.',
        ],
        equipment: 'Ghế phẳng chắc chắn · nằm sấp, đầu vừa qua mép ghế',
      },
      after: {
        sourceUrl: 'https://fysiofitaal.nl/en/exercise/extension-neck-head-over-bench/',
        source: 'Fysio Fitaal · Extension Neck Head Over Bench',
        startPosition:
          'Nằm sấp, để ngực và bụng tựa ghế. Đặt đầu vừa qua mép ghế, thả lỏng vai và đặt tay dọc thân hoặc trên ghế.',
        steps: [
          'Giữ cổ gần trung tính và bắt đầu với đầu hơi hướng xuống.',
          'Nâng đầu chậm tới ngang thân. Giữ ngực tựa ghế và tránh ngửa cổ quá mức.',
          'Hạ đầu từ từ trong tầm kiểm soát. Dừng nếu đau nhói, chóng mặt hoặc có triệu chứng lan xuống tay.',
        ],
        equipment: 'Ghế phẳng chắc chắn · nằm sấp, đầu vừa qua mép ghế',
      },
    },
    source: 'https://fysiofitaal.nl/en/exercise/extension-neck-head-over-bench/',
    reason:
      'Bài Fysio Fitaal hướng dẫn đúng nằm sấp và đầu qua mép ghế. Nguồn ACE dẫn tới biến thể đứng. Phòng khám dùng trọng lượng đầu và đặt tay nghỉ trên ghế hoặc dọc thân. Cụm mặt hướng về trước dễ khuyến khích ngửa thêm cổ. Khung cuối nhìn như vượt trung tính. Điểm dừng trong nguồn không yêu cầu ngửa cổ để nhìn thẳng về phía trước. Nguồn cho tay nghỉ dọc thân hoặc tựa ghế. Nắm chân ghế là chi tiết trong hình, không phải điều kiện của bài. Đầu nâng quanh khớp cổ trong khi ngực và bụng tựa ghế.',
    illustrationNote: {
      before:
        'Khung cuối vẽ đầu nâng cao và mặt hướng ra trước. Khi tập, giữ ngực tựa ghế và chỉ nâng đầu tới ngang thân.',
      after:
        'Khung cuối vẽ đầu nâng cao và mặt hướng ra trước. Khi tập, giữ ngực tựa ghế và chỉ nâng đầu tới ngang thân.',
    },
    primary: {
      before: ['shoulders'],
      after: ['neck'],
    },
  },
  'neck-flexion': {
    guide: {
      before: {
        sourceUrl: 'https://fysiofitaal.nl/en/exercise/flexion-neck-head-over-sofa/',
        source: 'Fysio Fitaal · Flexion Neck Head Over Bench',
        steps: [
          'Thả lỏng vai và đặt tay dọc thân hoặc trên ghế.',
          'Thu nhẹ cằm và nâng đầu chậm tới khi cổ hơi gập. Giữ vai tựa ghế.',
          'Hạ đầu chậm về gần trung tính, giữ đầu có kiểm soát. Dừng nếu thấy đau, chóng mặt hoặc tê tay.',
        ],
        startPosition:
          'Nằm ngửa vững trên ghế với lưng trên và vai tựa ghế. Để đầu vừa qua mép và giữ cổ gần trung tính.',
      },
      after: {
        sourceUrl: 'https://fysiofitaal.nl/en/exercise/flexion-neck-head-over-sofa/',
        source: 'Fysio Fitaal · Flexion Neck Head Over Bench',
        steps: [
          'Thả lỏng vai và đặt tay dọc thân hoặc trên ghế.',
          'Thu nhẹ cằm và nâng đầu chậm tới khi cổ hơi gập. Giữ vai tựa ghế.',
          'Hạ đầu chậm về gần trung tính, giữ đầu có kiểm soát. Dừng nếu thấy đau, chóng mặt hoặc tê tay.',
        ],
        startPosition:
          'Nằm ngửa vững trên ghế với lưng trên và vai tựa ghế. Để đầu vừa qua mép và giữ cổ gần trung tính.',
      },
    },
    source: 'https://fysiofitaal.nl/en/exercise/flexion-neck-head-over-sofa/',
    reason:
      'Phòng khám mô tả nằm ngửa với đầu qua mép ghế và dùng trọng lượng đầu. Nguồn ACE hiện tại là biến thể đứng. Đồng bộ tư thế đầu với chú thích và biến thể có kiểm soát. Tránh mô tả đầu ngả khỏi trung tính như khung đầu. Hướng dẫn đầu và chú thích cần cùng đặt cổ ở gần trung tính. Đầu gập quanh khớp cổ trong khi vai và thân tựa ghế.',
    primary: {
      before: ['shoulders'],
      after: ['neck'],
    },
  },
  'neck-side-stretch': {
    perSide: {
      before: false,
      after: true,
    },
    source:
      'https://www.acefitness.org/resources/everyone/exercise-library/202/lateral-neck-flexion/',
    reason:
      'ACE giữ mỗi phía 5 đến 10 giây và lặp lại phía kia. App hiện chỉ hiện giây chung mặc dù hướng dẫn yêu cầu đổi bên. Nguồn xác định tư thế nghiêng cổ để giãn cơ cổ.',
    primary: {
      before: ['shoulders'],
      after: ['neck'],
    },
  },
  'ninety-ninety-hip-stretch': {
    perSide: {
      before: false,
      after: true,
    },
    source: 'https://health.clevelandclinic.org/90-90-stretch',
    reason:
      'Cleveland Clinic xác định giữ theo thời gian rồi đổi vị trí hai chân. Ảnh chân sau gần duỗi đã có chú thích.',
  },
  'overhead-lat-side-bend': {
    perSide: {
      before: false,
      after: true,
    },
    source:
      'https://www.arthritis.org/health-wellness/healthy-living/physical-activity/success-strategies/upper-body-stretches',
    reason:
      'Arthritis Foundation hướng dẫn đứng, đưa hai tay qua đầu rồi nghiêng giữ từng phía. Khớp hướng dẫn đổi bên trong app.',
  },
  'pallof-press': {
    perSide: {
      before: false,
      after: true,
    },
    source:
      'https://www.ambulance.nsw.gov.au/__data/assets/pdf_file/0004/956362/Medic-Fit-Program-Guide-July-2020.pdf',
    reason:
      'Mục Standing pallof press cấp 4 hướng dẫn đứng ngang cáp và hoàn tất số lần trước khi xoay người đổi phía. Hai tay đẩy đồng thời nhưng hướng lực cáp chỉ thử một phía của thân. Nguồn nói rõ cần đổi phía.',
    guide: {
      before: {
        steps: [
          'Chỉnh ròng rọc ngang ngực và đứng ngang với máy. Nắm tay cầm bằng cả hai tay, khuỷu sát hông.',
          'Đẩy tay cầm thẳng ra phía trước và giữ ngắn. Giữ lưng thẳng, vai và thân không xoay theo cáp.',
          'Thu tay về sát ngực chậm rãi. Giữ bụng siết suốt bài.',
        ],
      },
      after: {
        steps: [
          'Chỉnh ròng rọc ngang ngực và đứng ngang với máy. Nắm tay cầm bằng cả hai tay, khuỷu sát hông.',
          'Đẩy tay cầm thẳng ra phía trước và giữ ngắn. Giữ lưng thẳng, vai và thân không xoay theo cáp.',
          'Thu tay chậm về sát ngực, giữ bụng siết. Tập xong một phía, quay hướng đứng để dây kéo từ phía đối diện.',
        ],
      },
    },
  },
  'renegade-row': {
    secondary: {
      before: ['biceps'],
      after: ['biceps', 'abs', 'shoulders'],
    },
    source: 'https://www.puregym.com/exercises/back/rows/renegade-row/',
    reason:
      'Bài gốc nêu bụng và bụng chéo chống xoay, vai sau hoạt động khi kéo. App chỉ trả kết quả khi lọc Lưng hoặc Tay trước. Ảnh độ phân giải đầy đủ cho thấy ngực xoay về phía máy ảnh khi nhấc tạ. Nguồn và hướng dẫn đều yêu cầu chống xoay.',
    illustrationNote: {
      before: null,
      after:
        'Hình cuối vẽ vai và hông xoay khi kéo tạ. Giữ vai và hông hướng về sàn để thân không xoay.',
    },
  },
  'reverse-wrist-curl': {
    illustrationNote: {
      before: 'Hình minh họa hai tạ đơn. Danh mục ghi dụng cụ là tạ đòn và ghế.',
      after: null,
    },
    source: 'src/app/core/models/exercise-catalog-review.data.ts#reverse-wrist-curl',
    reason:
      'Bộ lọc hiện yêu cầu tạ đơn và ghế, đúng với ảnh và hướng dẫn. Dòng nói dữ liệu nguồn gây nhầm về dụng cụ app đang dùng.',
  },
  'seated-hamstring-stretch': {
    guide: {
      before: {
        sourceUrl:
          'https://www.acefitness.org/resources/everyone/exercise-library/273/modified-hurdlers-stretch/',
        source: "ACE · Modified Hurdler's Stretch",
      },
      after: {
        sourceUrl:
          'https://www.acefitness.org/resources/everyone/exercise-library/273/modified-hurdler-s-stretch/',
        source: 'American Council on Exercise · Modified Hurdler’s Stretch',
      },
    },
    source:
      'https://www.acefitness.org/resources/everyone/exercise-library/273/modified-hurdler-s-stretch/',
    reason:
      'URL hiện sai slug. ACE mô tả đúng chân duỗi, chân kia gập áp lòng bàn chân vào đùi và gập từ hông. ACE giữ theo giây rồi lặp lại với chân đối diện, giống hướng dẫn trong app. ACE và phần mô tả trong app cùng chỉ định đùi sau và bắp chân. Bộ lọc hiện chỉ gắn Đùi sau.',
    perSide: {
      before: false,
      after: true,
    },
    secondary: {
      before: [],
      after: ['calves'],
    },
  },
  'seated-spinal-twist': {
    perSide: {
      before: false,
      after: true,
    },
    source:
      'https://www.mayoclinic.org/healthy-lifestyle/stress-management/multimedia/seated-spinal-twist/vid-20453586',
    reason: 'Mayo Clinic hướng dẫn ở tư thế ngồi sàn giống hình và giữ một bên trước khi đổi bên.',
  },
  'shadow-boxing': {
    perSide: {
      before: true,
      after: false,
    },
    source:
      'https://www.englandboxing.org/wp-content/uploads/2026/02/EB_Boxing-Coaching-Handbook-Part-1_09_02_26.pdf',
    reason:
      'England Boxing tổ chức đấm gió theo hiệp, mỗi hiệp có tổ hợp đòn. Hướng dẫn trong app cũng đổi tay trong chuỗi. Tính giây toàn hiệp thay vì giây mỗi bên.',
  },
  'shoulder-press-machine': {
    guide: {
      before: {
        steps: [
          'Đẩy hai tay cầm lên trên đầu tới khi khuỷu gần duỗi, không khóa cứng. Giữ lưng tựa ghế và không ưỡn lưng dưới.',
          'Siết cơ lưng để kéo tay cầm về ngang vai chậm và có kiểm soát, cổ tay vẫn thẳng.',
        ],
      },
      after: {
        steps: [
          'Đẩy hai tay cầm lên trên đầu tới khi khuỷu gần duỗi, không khóa cứng. Giữ lưng tựa ghế và không ưỡn lưng dưới.',
          'Hạ tay cầm từ từ về ngang vai, giữ lưng tựa ghế.',
        ],
      },
    },
    source:
      'https://resources.lifefitness.com/hub/life-fitness/en-US/1000419-0001-xd_32ce9968be620066-6b5ac64-1817a3e5ec1--7f3d.ditamap?onepage=true',
    reason:
      'Hãng hướng dẫn đẩy tay cầm lên và kiểm soát khi đưa về. Động tác hạ không phải dùng lưng để kéo.',
  },
  'side-lunge-adductor-stretch': {
    primary: {
      before: ['glutes'],
      after: ['adductors'],
    },
    source: 'https://elitehockeydrills.com/exercises/cossack-squat-hold.html',
    reason: 'Động tác giữ thấp về một bên để tạo căng ở đùi trong của chân duỗi.',
    guide: {
      before: {
        source: 'Elite Hockey Drills · Cossack Squat Hold',
        sourceUrl: 'https://elitehockeydrills.com/exercises/cossack-squat-hold.html',
      },
      after: {
        source: 'Elite Hockey Drills · Cossack Squat Hold',
        sourceUrl: 'https://elitehockeydrills.com/exercises/cossack-squat-hold.html',
      },
    },
  },
  'side-lying-leg-raise': {
    movementPattern: { before: 'hinge', after: 'hip-abduction' },
    source:
      'https://www.acefitness.org/resources/everyone/exercise-library/38/side-lying-hip-abduction/',
    reason: 'Nằm nghiêng và nâng chân trên ra xa đường giữa. Thân không gập ở hông.',
  },
  'standing-cable-hip-abduction': {
    movementPattern: { before: 'hinge', after: 'hip-abduction' },
    source: 'https://www.puregym.com/exercises/legs/inner-outer-thigh/cable-hip-abduction/',
    reason: 'Đứng và dạng chân mang đai ra xa trụ. Thân và chân trụ giữ yên.',
  },
  'squat-thrust': {
    guide: {
      before: {
        source: 'Garden of Life · Half Burpee',
        sourceUrl: 'https://www.gardenoflife.com/blog/burpees-exercise-for-beginners',
      },
      after: {
        source: 'Garden of Life · Half Burpee',
        sourceUrl: 'https://www.gardenoflife.com/blog/burpees-exercise-for-beginners',
      },
    },
    source: 'https://www.gardenoflife.com/blog/burpees-exercise-for-beginners',
    reason: 'Nguồn minh họa bước từng chân từ squat vào plank và bước về squat.',
  },
  'machine-glute-kickback': {
    guide: {
      before: {
        source: 'Panatta · Fit Evo Gluteus Machine',
        sourceUrl: 'https://www.youtube.com/watch?v=PECosfnmi7s&t=25s',
      },
      after: {
        source: 'Panatta · Fit Evo Gluteus Machine',
        sourceUrl: 'https://www.youtube.com/watch?v=PECosfnmi7s&t=25s',
      },
    },
    source: 'https://www.youtube.com/watch?v=PECosfnmi7s&t=25s',
    reason: 'Video của hãng cho thấy tay giữ hai tay cầm, thân qua đệm và con lăn đặt sau đùi.',
  },
  'tibialis-raise-machine': {
    movementPattern: {
      before: 'pull-v',
      after: 'ankle-dorsiflexion',
    },
    source:
      'https://www.lifefitness.com/en-eu/catalog/strength-training/plate-loaded/plate-loaded-tibia-dorsi-flexion',
    reason: 'Gập cổ chân để nâng con lăn. Tay và thân không thực hiện chuyển động kéo.',
  },
  'turkish-get-up': {
    perSide: {
      before: false,
      after: true,
    },
    source: 'https://www.acefitness.org/resources/everyone/exercise-library/388/turkish-get-up/',
    reason:
      'Một tay giữ tạ trong toàn bộ lượt đứng lên và nằm xuống. Lặp riêng cho tay còn lại. Thêm bước đổi bên để hướng dẫn khớp với đơn vị ghi.',
    guide: {
      before: {
        steps: [
          'Nhìn theo tạ, chống tay kia xuống sàn rồi nâng ngực lên. Đạp bàn chân gập gối để nâng hông khỏi sàn.',
          'Đưa chân duỗi ra sau, đặt gối xuống sàn dưới hông và bỏ tay chống sàn để vào tư thế quỳ một gối. Giữ tay cầm tạ thẳng đứng trên vai.',
          'Đạp chân trước để đứng thẳng, rồi đảo ngược từng bước để trở về nằm một cách chậm rãi.',
        ],
      },
      after: {
        steps: [
          'Nhìn theo tạ, chống tay kia xuống sàn rồi nâng ngực lên. Đạp bàn chân gập gối để nâng hông khỏi sàn.',
          'Đưa chân duỗi ra sau, đặt gối xuống sàn dưới hông và bỏ tay chống sàn để vào tư thế quỳ một gối. Giữ tay cầm tạ thẳng đứng trên vai.',
          'Đạp chân trước để đứng thẳng rồi đảo ngược từng bước để nằm xuống. Làm đủ số lần rồi đổi tay và đổi bên.',
        ],
      },
    },
  },
  'upright-row': {
    movementPattern: {
      before: 'pull-h',
      after: 'pull-v',
    },
    source: 'https://fsc.kzoo.edu/exercise-glossary/auxiliary-lifts/',
    reason: 'Đứng kéo thanh lên theo chiều dọc sát thân.',
  },
  'wall-tibialis-raise': {
    movementPattern: {
      before: 'pull-v',
      after: 'ankle-dorsiflexion',
    },
    source: 'https://www.strengthlog.com/tibialis-raise/',
    reason: 'Tựa tường, giữ gót dưới sàn và nâng mũi chân.',
  },
  'wrist-roller': {
    movementPattern: {
      before: 'isometric',
      after: 'wrist-rotation',
    },
    source: 'https://www.strengthlog.com/wrist-roller/',
    reason: 'Cổ tay lần lượt xoay thanh để đưa đĩa lên rồi xuống. Vai giữ yên.',
  },
};

export function exerciseCatalogCorrection(id: string): ExerciseCatalogCorrection | undefined {
  return Object.hasOwn(exerciseCatalogCorrections, id) ? exerciseCatalogCorrections[id] : undefined;
}
