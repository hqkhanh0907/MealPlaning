import type { ExerciseGuideTextSet } from '../exercise-guide.types';

export const pushVGuides: ExerciseGuideTextSet = {
  'arnold-press': {
    nameVi: 'Đẩy vai Arnold tạ đơn ngồi',
    equipment: 'Hai tạ đơn · ghế không tựa lưng, hai bàn chân đặt sàn',
    purpose: 'Động tác đẩy dọc giúp tập vai với hai tạ đơn, có xoay cổ tay khi nâng.',
    startPosition:
      'Ngồi thẳng lưng trên ghế, hai bàn chân đặt chắc trên sàn. Hai tạ đơn ở trước vai, lòng bàn tay hướng về phía người, khuỷu gập và hướng ra trước.',
    steps: [
      'Đẩy hai tạ lên trên đầu và xoay lòng bàn tay dần ra phía trước khi tạ đi lên. Dừng khi tay gần duỗi và không khóa khuỷu.',
      'Hạ hai tạ chậm và xoay lòng bàn tay về phía người khi tạ về trước vai. Giữ lưng thẳng và không ưỡn lưng.',
    ],
    source: 'Moonee Valley Health and Fitness · DB Seated Arnold Press',
    sourceUrl: 'https://www.mvfit.com.au/exercise-library/db-seated-arnold-press/',
    alt: 'Khung bắt đầu: nhìn chính diện, người ngồi trên ghế không tựa lưng, hai tạ đơn ở trước vai, khuỷu gập, mu bàn tay hướng ra trước. Khung kết thúc: hai tay duỗi lên trên đầu, lòng bàn tay hướng ra trước.',
    measure: 'reps',
    loadTotalOfTwo: true,
  },
  'band-lateral-raise': {
    nameVi: 'Nâng tay ngang dây kháng lực',
    equipment: 'Dây kháng lực có tay cầm · hai chân giẫm lên dây',
    purpose: 'Động tác nâng ngang giúp tập vai giữa với dây kháng lực khi đứng.',
    startPosition:
      'Đứng thẳng, hai chân giẫm lên dây và rộng bằng hông. Hai tay nắm tay cầm dây và buông dọc hai bên thân.',
    steps: [
      'Siết bụng và hạ vai thấp, rồi nâng hai tay lên và ra hai bên cho tới ngang vai. Giữ khuỷu hơi gập và cổ tay thẳng.',
      'Hạ hai tay xuống thật chậm về hai bên thân. Không ngả người ra sau để lấy đà.',
    ],
    source: 'TheraBand · Instruction Manual, Lateral Raise',
    sourceUrl:
      'https://thelymphclinic.ie/wp-content/uploads/2022/09/thera-band_instruction_manual_v5-1.pdf',
    alt: 'Khung bắt đầu: nhìn chính diện, người đứng thẳng, hai chân giẫm lên dây, hai tay buông hai bên nắm tay cầm. Khung kết thúc: hai tay dang ngang ngang vai, dây căng thành hình chữ V.',
    measure: 'reps',
  },
  'band-overhead-press': {
    nameVi: 'Đẩy vai dây kháng lực đứng',
    equipment: 'Dây kháng lực dạng vòng · hai chân giẫm lên dây',
    purpose: 'Động tác đẩy dọc giúp tập vai với dây kháng lực khi đứng.',
    startPosition:
      'Đứng thẳng, hai chân giẫm lên dây. Hai tay nắm dây ở ngang vai, khuỷu gập và hướng ra trước.',
    steps: [
      'Siết bụng và đẩy hai tay thẳng lên trên đầu cho tới khi tay gần duỗi. Giữ lưng thẳng và không ưỡn lưng.',
      'Hạ hai tay chậm về ngang vai. Giữ cổ tay thẳng và khuỷu hướng ra trước.',
    ],
    source: 'University of Windsor · APEX Shoulder Press',
    sourceUrl:
      'https://www.uwindsor.ca/kinesiology/sites/uwindsor.ca.kinesiology/files/apex_manual_oct_2020_-_edition_1.0.pdf',
    alt: 'Khung bắt đầu: góc nhìn chéo phía trước, người đứng giẫm lên dây, hai nắm tay giữ dây ở ngang vai. Khung kết thúc: hai tay duỗi thẳng trên đầu, dây căng hai bên thân.',
    measure: 'reps',
  },
  'battle-rope-double-waves': {
    nameVi: 'Sóng dây thừng hai tay cùng lúc',
    equipment: 'Dây thừng lớn · một đầu neo cố định, hai chân đứng chùng gối',
    purpose: 'Động tác nhịp nhanh giúp tập sức bền vai, tay và thân trên với dây thừng lớn.',
    startPosition:
      'Đứng chùng gối, hai chân rộng bằng vai. Hai tay nắm hai đầu dây đưa ra trước, hai đầu dây nâng lên ngang ngực.',
    steps: [
      'Siết bụng, chùng gối và nâng hai đầu dây lên cùng lúc. Giữ khuỷu gần thân và lưng thẳng.',
      'Hạ hai đầu dây xuống thật nhanh để tạo sóng chạy dọc dây. Giữ gối chùng và nhịp hai tay đều nhau.',
    ],
    source: 'American Council on Exercise · Simultaneous Waves',
    sourceUrl:
      'https://www.acefitness.org/resources/everyone/exercise-library/374/simultaneous-waves/',
    alt: 'Khung bắt đầu: nhìn nghiêng, người chùng gối, hai tay đưa ra trước nắm hai đầu dây, dây nâng lên cao. Khung kết thúc: hai tay hạ thấp gần đùi, dây tạo sóng sát sàn tới điểm neo.',
    measure: 'seconds',
  },
  'cable-front-raise': {
    nameVi: 'Nâng tay trước cáp thấp',
    equipment: 'Máy cáp thấp · tay cầm thẳng, quay lưng về máy',
    purpose: 'Động tác nâng trước giúp tập vai trước với cáp kéo từ thấp lên.',
    startPosition:
      'Đứng quay lưng về máy cáp, hai chân đứng vững. Tay nắm tay cầm buông trước đùi, khuỷu duỗi hoặc hơi gập.',
    steps: [
      'Siết bụng và hạ vai thấp, rồi nâng tay ra trước cho tới ngang vai. Giữ khuỷu hơi gập và không ưỡn lưng.',
      'Hạ tay về trước đùi thật chậm. Giữ cổ tay thẳng và thân đứng yên.',
    ],
    source: 'Live Lean TV · Standing Straight Bar Cable Front Raise',
    sourceUrl: 'https://www.liveleantv.com/how-to-do-a-standing-cable-front-raise/',
    alt: 'Khung bắt đầu: nhìn nghiêng, người đứng quay lưng về máy cáp thấp, tay nắm tay cầm buông trước đùi. Khung kết thúc: tay duỗi ra trước ngang vai, cáp kéo từ ròng rọc thấp phía sau. Chỉ thấy một tay vì tay kia khuất.',
    measure: 'reps',
  },
  'cable-lateral-raise': {
    nameVi: 'Dang vai ngang một tay bằng cáp',
    equipment: 'Cáp · ròng rọc thấp, một tay nắm, đứng nghiêng cạnh máy',
    purpose: 'Động tác nâng ngang giúp tập vai giữa với cáp khi đứng.',
    startPosition:
      'Đứng thẳng, một bên người sát máy cáp. Tay xa máy cầm tay nắm trước hông, dây cáp chạy chéo trước thân.',
    steps: [
      'Siết bụng, giữ ngực mở và vai hạ thấp. Nâng tay cầm tay nắm thẳng sang ngang, khuỷu hơi gập, dây cáp đi qua trước thân.',
      'Dừng khi cánh tay song song sàn. Giữ hông thẳng, không nghiêng thân để lấy đà.',
      'Hạ tay chậm về trước hông, giữ cáp căng suốt động tác.',
    ],
    source: 'Catalyst Athletics · Cable Lateral Raise',
    sourceUrl: 'https://www.catalystathletics.com/exercise/811/Cable-Lateral-Raise/',
    alt: 'Khung bắt đầu: nhìn chính diện, người đứng cạnh máy cáp bên trái hình, tay gần máy cầm tay nắm buông dọc đùi, cáp chạy từ ròng rọc thấp. Khung kết thúc: tay xa máy nâng ngang vai cầm tay nắm, dây cáp chạy chéo qua trước thân.',
    measure: 'reps',
  },
  'cable-overhead-triceps-extension': {
    nameVi: 'Duỗi tay sau đầu bằng cáp',
    equipment: 'Cáp · dây thừng, ròng rọc cao, đứng quay lưng về máy',
    purpose: 'Động tác duỗi khuỷu giúp tập cơ tay sau với cáp khi đứng.',
    startPosition:
      'Đứng quay lưng về máy, hai tay giữ dây thừng sau đầu. Khuỷu gập, cánh tay trên chếch lên và sát hai bên đầu.',
    steps: [
      'Siết bụng, giữ thân thẳng và cánh tay trên đứng yên. Duỗi hai khuỷu đẩy dây thừng lên phía trước và trên đầu, không khóa cứng khuỷu.',
      'Dừng ngắn khi tay gần duỗi thẳng.',
      'Gập khuỷu hạ dây thừng chậm về sau đầu, giữ khuỷu không bung ra hai bên.',
    ],
    source: 'Inspire Fitness · FT2 Exercise Manual, Overhead Tricep Extension',
    sourceUrl:
      'https://inspirefitnesssolutions.co.uk/wp-content/uploads/2015/10/Inspire-FT2-Exercise-Manual.pdf',
    alt: 'Khung bắt đầu: nhìn ngang, người đứng quay lưng về máy cáp, hai tay giữ dây thừng sau đầu, khuỷu gập. Khung kết thúc: hai tay duỗi thẳng chếch lên trên đầu, dây cáp căng về phía máy.',
    measure: 'reps',
  },
  'dumbbell-push-press': {
    nameVi: 'Đẩy vai nhún chân tạ đơn',
    equipment: 'Hai tạ đơn · đứng',
    purpose: 'Động tác đẩy dọc kết hợp lực chân giúp tập vai và tay sau với hai tạ đơn.',
    startPosition: 'Đứng thẳng, hai chân rộng bằng hông. Giữ một tạ đơn ở mỗi vai.',
    steps: [
      'Gập nhẹ gối và hông để nhún, giữ thân thẳng. Đạp sàn nhanh để duỗi hông và gối, đưa tạ rời vai.',
      'Duỗi hai tay lên qua đầu khi thân đã đứng thẳng. Giữ lưng trung tính và tránh nhún thêm khi đẩy.',
      'Hạ hai tạ có kiểm soát về vai trước khi lặp lại.',
    ],
    source: 'CrossFit Games · Dumbbell Push Press Movement Standards',
    sourceUrl:
      'https://s3.amazonaws.com/crossfitpubliccontent/6-21-3-Scorecards-Adap-LE-sjnhey653bdge523da.pdf',
    alt: 'Khung bắt đầu: nhìn ngang, người gập gối nhẹ, hai tạ đơn ngang vai. Khung kết thúc: người đứng thẳng, hai tay duỗi đưa hai tạ lên trên đầu.',
    measure: 'reps',
    loadTotalOfTwo: true,
  },
  'dumbbell-scaption': {
    nameVi: 'Nâng tạ đơn chếch trước',
    equipment: 'Hai tạ đơn · đứng',
    purpose:
      'Động tác nâng vai trong mặt phẳng chếch trước giúp tập vai và cơ ổn định bả vai với hai tạ đơn.',
    startPosition:
      'Đứng thẳng, hai tay cầm tạ buông hai bên thân và hướng ngón cái về trước. Giữ vai thả lỏng.',
    steps: [
      'Giữ khuỷu gần như duỗi và vai hạ thấp. Nâng hai tay chếch ra trước, nằm giữa hướng trước và hướng ngang.',
      'Dừng khi tay ngang vai, ngón cái hướng lên. Không nhún vai.',
      'Hạ hai tạ chậm về bên đùi, giữ thân đứng yên.',
    ],
    source: 'Katherine J. Coyner, MD · Standing Scaption',
    sourceUrl: 'https://www.drcoyner.com/pdf/scapular-dynkinesis-protocol.pdf',
    alt: 'Khung bắt đầu: nhìn chếch trước, người đứng thẳng, hai tay buông bên đùi cầm hai tạ đơn. Khung kết thúc: hai tay nâng sang hai bên tới ngang vai, thân đứng yên.',
    measure: 'reps',
    loadTotalOfTwo: true,
  },
  'dumbbell-shoulder-press': {
    nameVi: 'Đẩy vai tạ đơn',
    equipment: 'Hai tạ đơn · ghế có lưng tựa',
    purpose: 'Động tác đẩy lên cao giúp tập vai với hai tạ đơn khi ngồi tựa lưng.',
    startPosition:
      'Ngồi tựa lưng vào ghế, hai chân đạp sàn. Giữ hai tạ ngang vai, lòng bàn tay hướng ra trước.',
    steps: [
      'Siết bụng và giữ vai hạ thấp. Đẩy hai tạ lên trên đầu cho đến khi tay gần duỗi thẳng, cổ tay thẳng và lưng dưới không ưỡn.',
      'Hạ hai tạ có kiểm soát về ngang vai. Giữ đầu, vai và mông sát ghế.',
    ],
    source: 'American Council on Exercise · Seated Overhead Press',
    sourceUrl:
      'https://www.acefitness.org/resources/everyone/exercise-library/45/seated-overhead-press/',
    alt: 'Khung bắt đầu: nhìn chếch trước, người ngồi tựa lưng ghế, hai chân đạp sàn, hai tạ đơn ngang vai. Khung kết thúc: hai tay đẩy hai tạ lên cao trên đầu, tay gần duỗi thẳng.',
    measure: 'reps',
    loadTotalOfTwo: true,
  },
  'front-raises': {
    nameVi: 'Nâng tạ đơn ra trước',
    equipment: 'Hai tạ đơn · đứng',
    purpose: 'Động tác nâng ra trước giúp tập vai trước với hai tạ đơn khi đứng.',
    startPosition:
      'Đứng thẳng, hai tay cầm tạ buông sát hai bên đùi. Khuỷu duỗi hoặc hơi gập, vai hạ thấp.',
    steps: [
      'Siết bụng, giữ vai hạ thấp và thân thẳng. Nâng hai tạ ra trước cho đến ngang vai, lòng bàn tay hướng xuống.',
      'Giữ khuỷu hơi gập và cổ tay thẳng. Không ưỡn lưng để lấy đà.',
      'Hạ hai tạ chậm về cạnh đùi, giữ thân đứng yên.',
    ],
    source: 'American Council on Exercise · Front Raise',
    sourceUrl: 'https://www.acefitness.org/resources/everyone/exercise-library/54/front-raise/',
    alt: 'Khung bắt đầu: nhìn ngang, người đứng thẳng, tạ buông cạnh đùi, tạ kia bị thân che. Khung kết thúc: tay duỗi ra trước ngang vai, thân đứng yên.',
    measure: 'reps',
    loadTotalOfTwo: true,
  },
  'handstand-push-up': {
    nameVi: 'Đẩy người chổng ngược sát tường',
    equipment: 'Tường · hai tay chống sàn, bàn chân tựa tường',
    purpose:
      'Động tác đẩy dọc bằng trọng lượng cơ thể giúp tập vai và tay sau khi chổng ngược sát tường.',
    startPosition:
      'Chống hai tay xuống sàn gần chân tường, thân thẳng đứng chổng ngược. Bàn chân chạm tường, hai tay duỗi thẳng.',
    steps: [
      'Siết bụng và mông để giữ thân thẳng. Gập khuỷu, hạ đầu chậm tới điểm hơi trước hai bàn tay để tạo thế ba điểm.',
      'Dừng khi đầu gần chạm sàn, giữ khuỷu không bung rộng.',
      'Đẩy mạnh hai tay để duỗi thẳng khuỷu, quay về vị trí chổng ngược đầu.',
    ],
    source: 'CrossFit · HSPU and You: Master the Movement',
    sourceUrl: 'https://www.crossfit.com/essentials/hspu-and-you-master-the-movement',
    alt: 'Khung bắt đầu: nhìn ngang, người chổng ngược hai tay duỗi thẳng chống sàn, bàn chân tựa tường. Khung kết thúc: khuỷu gập, đầu hạ gần sàn giữa hai tay, chân vẫn tựa tường.',
    measure: 'reps',
  },
  'landmine-press': {
    nameVi: 'Đẩy một tay thanh landmine',
    equipment: 'Thanh tạ đòn gài đầu sàn · đứng, chân so le',
    purpose: 'Động tác đẩy chếch lên giúp tập vai và tay sau với một tay cầm thanh landmine.',
    startPosition:
      'Đứng chân so le, mặt hướng về chốt sàn. Giữ đầu thanh ngay trước vai, khuỷu nằm dưới cổ tay.',
    steps: [
      'Siết bụng và giữ thân vững trên hai chân. Đẩy đầu thanh chếch lên và ra trước cho đến khi tay gần duỗi.',
      'Giữ thân thẳng, không nghiêng hay xoay thân để lấy đà.',
      'Hạ thanh có kiểm soát về sát vai.',
    ],
    source: 'O-SEA CrossFit · Landmine Press',
    sourceUrl: 'https://oseacrossfit.com/movements/landmine-press/',
    alt: 'Khung bắt đầu: người đứng chân so le, một tay giữ đầu thanh có đĩa sát vai, thanh nghiêng xuống chốt sàn. Khung kết thúc: tay duỗi chếch lên trước, đầu thanh nằm cao hơn vai.',
    measure: 'reps',
  },
  'lateral-raises': {
    nameVi: 'Dang vai ngang tạ đơn',
    equipment: 'Hai tạ đơn · đứng',
    purpose: 'Động tác nâng ngang giúp tập vai giữa với hai tạ đơn khi đứng.',
    startPosition:
      'Đứng vững, mỗi tay cầm một tạ đơn bên đùi, lòng bàn tay hướng vào thân. Giữ khuỷu hơi gập và siết bụng.',
    steps: [
      'Nâng hai tạ lên và ra hai bên cho đến ngang vai. Để khuỷu dẫn trước cẳng tay.',
      'Hạ hai tạ chậm về bên đùi. Giữ thân đứng yên và không nhún vai.',
    ],
    source: 'American Council on Exercise · Lateral Raise',
    sourceUrl: 'https://www.acefitness.org/resources/everyone/exercise-library/26/lateral-raise/',
    alt: 'Khung bắt đầu: nhìn chính diện, người đứng thẳng, mỗi tay cầm một tạ đơn bên đùi, lòng bàn tay hướng vào thân. Khung kết thúc: hai tay nâng sang hai bên tới ngang vai, thân đứng yên.',
    measure: 'reps',
    loadTotalOfTwo: true,
  },
  'leg-press-calf-raise': {
    nameVi: 'Nhón gót trên máy đạp đùi',
    equipment: 'Máy đạp đùi · lưng tựa, mũi bàn chân trên bàn đạp',
    purpose: 'Động tác nhón gót giúp tập bắp chân trên máy đạp đùi.',
    startPosition:
      'Nằm ngả tựa lưng vào ghế máy, hai chân duỗi đặt trên bàn đạp. Hai tay giữ tay nắm hai bên ghế.',
    steps: [
      'Đặt phần trước bàn chân lên bàn đạp, gót thò ra mép. Giữ gối hơi mềm, không khóa.',
      'Đẩy bàn đạp bằng mũi bàn chân, nhón gót lên cao nhất.',
      'Hạ gót chậm, dừng trước khi gót chạm hẳn để cơ luôn căng.',
    ],
    source: 'National Academy of Sports Medicine · Leg Press Calf Raise',
    sourceUrl: 'https://www.nasm.org/resource-center/exercise-library/leg-press-calf-raise',
    alt: 'Khung bắt đầu: nhìn ngang, người ngả lưng trên máy, hai chân duỗi chạm bàn đạp, hai tay giữ tay nắm. Khung kết thúc: gần như giống khung đầu, mũi chân hơi duỗi hơn.',
    measure: 'reps',
  },
  'machine-lateral-raise': {
    nameVi: 'Dang vai ngang trên máy',
    equipment: 'Máy dang vai · ngồi, đệm tì phía trên khuỷu',
    purpose: 'Động tác nâng ngang giúp tập vai giữa trên máy khi ngồi.',
    startPosition:
      'Ngồi tựa lưng vào ghế, hai chân đặt sàn. Hai tay nắm tay cầm buông dọc thân, đệm nằm ngoài cánh tay trên.',
    steps: [
      'Giữ vai hạ thấp và thân tựa ghế. Đẩy khuỷu ra hai bên để nâng đệm lên.',
      'Dừng khi cánh tay trên gần ngang vai, không nhún vai.',
      'Hạ đệm chậm về vị trí đầu, không để chồng tạ đập xuống.',
    ],
    source: 'Kraftwerk Academy · Machine Lateral Raise',
    sourceUrl: 'https://www.kraftwerk-fitness.ch/en/academy/lateral-raise-machine',
    alt: 'Khung bắt đầu: nhìn chính diện, người ngồi trên máy, hai đệm nằm ngoài cánh tay trên, tay nắm tay cầm buông thấp. Khung kết thúc: hai cánh tay nâng sang hai bên ngang vai, tay nắm tay cầm thẳng đứng.',
    measure: 'reps',
  },
  'overhead-press': {
    nameVi: 'Đẩy vai tạ đòn',
    equipment: 'Tạ đòn · đứng · giá đỡ',
    purpose: 'Động tác đẩy dọc giúp tập vai với tạ đòn khi đứng.',
    startPosition:
      'Đặt thanh tạ trước vai, nắm rộng bằng vai hoặc hơn một chút. Đứng thẳng, khuỷu hướng ra trước.',
    steps: [
      'Siết bụng và mông, giữ lưng trung lập. Đẩy thanh tạ thẳng lên trên đầu cho tới khi tay duỗi thẳng.',
      'Hạ thanh tạ chậm về trước vai. Giữ thân thẳng, không ưỡn lưng để lấy đà.',
    ],
    source: 'American Council on Exercise · Standing Shoulder Press',
    sourceUrl:
      'https://www.acefitness.org/resources/everyone/exercise-library/71/standing-shoulder-press/',
    alt: 'Khung bắt đầu: nhìn chếch trước, người đứng thẳng, hai tay nắm thanh tạ đòn trước vai, khuỷu ở dưới thanh. Khung kết thúc: hai tay duỗi thẳng đẩy thanh tạ lên trên đầu.',
    measure: 'reps',
  },
  'overhead-triceps-extension': {
    nameVi: 'Duỗi tay sau đầu một tạ đơn đứng',
    equipment: 'Một tạ đơn · đứng · hai tay giữ chung',
    purpose: 'Động tác duỗi khuỷu qua đầu giúp tập cơ tam đầu cánh tay với một tạ đơn.',
    startPosition:
      'Đứng thẳng, hai tay giữ chung một tạ đơn dựng đứng và giơ thẳng lên trên đầu. Siết bụng và giữ đầu cùng cổ thẳng hàng với cột sống.',
    steps: [
      'Gập khuỷu để hạ tạ ra sau đầu, giữ hai cánh tay trên đứng yên. Dừng khi khuỷu gập gần vuông góc hoặc khi cánh tay trên bắt đầu ngả ra sau, và không để tạ chạm đầu.',
      'Duỗi khuỷu để đẩy tạ trở lại trên đầu, khuỷu chưa khóa cứng. Giữ đầu, thân và bàn chân không đổi vị trí.',
    ],
    source: 'American Council on Exercise · Triceps Extension',
    sourceUrl:
      'https://www.acefitness.org/resources/everyone/exercise-library/74/triceps-extension/',
    alt: 'Khung bắt đầu: người đứng thẳng, hai tay giơ một tạ đơn dựng đứng lên trên đầu. Khung kết thúc: khuỷu gập, tạ hạ xuống sau đầu, cánh tay trên giữ thẳng đứng. Nhìn nghiêng nên tay thứ hai khuất sau tay gần.',
    measure: 'reps',
  },
  'pike-push-up': {
    nameVi: 'Chống đẩy gập hông kiểu pike',
    equipment: 'Sàn · hai bàn tay và hai mũi chân',
    purpose: 'Động tác đẩy theo chiều dọc giúp tập vai và tam đầu bằng trọng lượng cơ thể.',
    startPosition:
      'Chống hai tay và mũi chân xuống sàn, đẩy hông lên cao để thân tạo hình chữ V ngược. Hai tay và hai chân gần thẳng, đầu nằm giữa hai cánh tay.',
    steps: [
      'Gập khuỷu để hạ đỉnh đầu về phía sàn, ngay trước hai bàn tay. Giữ hông cao và thân cứng, không võng lưng dưới.',
      'Đẩy hai tay xuống sàn để duỗi khuỷu và đưa thân về hình chữ V ngược. Giữ cổ thẳng hàng và không đập đầu xuống sàn.',
    ],
    source: 'NASM · Pike Push-Up',
    sourceUrl: 'https://www.nasm.org/resource-center/exercise-library/pike-push-up',
    alt: 'Khung bắt đầu: nhìn nghiêng, người chống hai bàn tay và mũi chân, hông đẩy cao, tay và chân gần thẳng, đầu giữa hai tay. Khung kết thúc: khuỷu gập, đầu hạ gần sàn trước hai bàn tay, hông vẫn cao.',
    measure: 'reps',
  },
  'plate-front-raise': {
    nameVi: 'Nâng đĩa tạ ra trước',
    equipment: 'Một đĩa tạ · đứng · hai tay giữ hai bên mép đĩa',
    purpose: 'Động tác nâng thẳng ra trước giúp tập vai trước với một đĩa tạ.',
    startPosition:
      'Đứng thẳng, hai tay thẳng giữ đĩa tạ ở hai bên mép, đĩa nằm trước đùi. Siết bụng và để vai hạ thấp.',
    steps: [
      'Nâng đĩa tạ ra phía trước cho tới khi hai tay ngang vai. Giữ khuỷu hơi mềm và thân không ngả ra sau.',
      'Hạ đĩa tạ chậm về trước đùi, giữ khuỷu hơi mềm và cổ tay thẳng.',
    ],
    source: 'PureGym · Plate Front Raise',
    sourceUrl:
      'https://www.puregym.com/exercises/arms-and-shoulders/front-raises/plate-front-raise/',
    alt: 'Khung bắt đầu: người đứng, hai tay thẳng giữ đĩa tạ ở hai bên mép trước đùi. Khung kết thúc: hai tay duỗi gần thẳng nâng đĩa ra trước ngang vai, mặt đĩa hướng về phía trước.',
    measure: 'reps',
  },
  'push-jerk': {
    nameVi: 'Đẩy tạ đòn kiểu jerk',
    equipment: 'Một tạ đòn · đứng · đòn đặt trên vai trước',
    purpose: 'Động tác đẩy bật toàn thân giúp luyện sức bật và vai với một tạ đòn.',
    startPosition:
      'Đứng hai chân rộng bằng hông, đòn tì cao trên vai trước, khuỷu chúc xuống và hơi ở trước thanh đòn. Gối đã hạ nhẹ, thân thẳng đứng.',
    steps: [
      'Hạ nhẹ gối và hông với thân thẳng đứng, rồi bật mạnh hai chân để đẩy đòn lên khỏi vai.',
      'Đẩy người xuống dưới đòn, hai chân mở nhẹ, gối hơi gập và hai tay khóa thẳng trên đầu.',
      'Đứng thẳng lên với đòn trên đầu, rồi hạ đòn về vai có kiểm soát.',
    ],
    source: 'CrossFit · The Push Jerk',
    sourceUrl: 'https://www.crossfit.com/essentials/the-push-jerk',
    alt: 'Khung bắt đầu: nhìn chếch trước, người đứng gối gập nhẹ, đòn đặt trên vai trước, khuỷu chúc xuống. Khung kết thúc: hai tay thẳng đẩy đòn lên trên đầu, hai chân mở rộng và gối gập.',
    measure: 'reps',
  },
  'push-press': {
    nameVi: 'Đẩy tạ đòn bật chân',
    equipment: 'Một tạ đòn · đứng · đòn đặt trên vai trước',
    purpose: 'Động tác đẩy qua đầu có lực bật từ chân giúp tập vai và sức bật với một tạ đòn.',
    startPosition:
      'Đứng hai chân rộng bằng hông, đòn tì trên vai trước, khuỷu hướng ra trước. Gối đã hạ nhẹ và thân thẳng đứng.',
    steps: [
      'Hạ nhẹ gối với thân thẳng, rồi đạp mạnh hai chân và đưa hông ra trước để đẩy đòn lên.',
      'Duỗi hai tay đẩy đòn thẳng lên trên đầu, khóa tay và đứng thẳng.',
      'Hạ đòn về vai trước có kiểm soát và gập gối nhẹ để đón.',
    ],
    source: 'American Council on Exercise · Push Press',
    sourceUrl: 'https://www.acefitness.org/resources/everyone/exercise-library/24/push-press/',
    alt: 'Khung bắt đầu: nhìn chếch trước, người đứng gối gập nhẹ, đòn đặt trên vai trước. Khung kết thúc: người đứng thẳng, hai tay duỗi thẳng giữ đòn trên đầu.',
    measure: 'reps',
  },
  'seated-calf-raise-machine': {
    nameVi: 'Nhón bắp chân ngồi trên máy',
    equipment: 'Máy nhón bắp chân ngồi · đĩa tạ · đệm trên đùi · bệ để chân',
    purpose: 'Động tác nhón gót giúp tập bắp chân với máy ngồi có đệm trên đùi.',
    startPosition:
      'Ngồi trên máy, đặt phần trước bàn chân lên bệ, đệm tì chắc trên đùi gần gối. Hai tay đặt lên đệm, gót ngang mặt bệ.',
    steps: [
      'Chỉnh đệm cho thoải mái, mở cần chặn rồi đẩy bằng phần trước bàn chân để nhón gót lên cao nhất có thể.',
      'Hạ gót xuống chậm và có kiểm soát để bắp chân giãn ra.',
      'Khi xong, nhón gót lên rồi kéo cần chặn về để khóa máy.',
    ],
    source: "Cybex · Plate Loaded Seated Calf Owner's Manual",
    sourceUrl: 'https://kb.cybexintl.com/Owners_Manuals/Strength/16212-999-4.pdf#page=10',
    alt: 'Khung bắt đầu: nhìn ngang, người ngồi trên máy, bàn chân trên bệ, đệm trên đùi gần gối, gót ngang mặt bệ. Khung kết thúc: gót nhón lên cao, đệm và đĩa tạ nâng theo. Chân thứ hai khuất sau chân gần.',
    measure: 'reps',
  },
  'shoulder-press-machine': {
    nameVi: 'Đẩy vai máy ngồi',
    equipment: 'Máy đẩy vai gắn đĩa tạ · ghế ngồi có lưng tựa',
    purpose: 'Động tác đẩy qua đầu giúp tập vai trên máy ngồi.',
    startPosition:
      'Chỉnh ghế để tay cầm ngang vai hoặc cao hơn vai một chút. Ngồi tựa lưng, hai bàn chân đặt chắc trên sàn, nắm chắc hai tay cầm với cổ tay thẳng.',
    steps: [
      'Đẩy hai tay cầm lên trên đầu tới khi khuỷu gần duỗi, không khóa cứng. Giữ lưng tựa ghế và không ưỡn lưng dưới.',
      'Siết cơ lưng để kéo tay cầm về ngang vai chậm và có kiểm soát, cổ tay vẫn thẳng.',
    ],
    source: 'American Council on Exercise · Seated Shoulder Press',
    sourceUrl:
      'https://www.acefitness.org/resources/everyone/exercise-library/186/seated-shoulder-press/',
    alt: 'Khung bắt đầu: nhìn chếch trước, người ngồi tựa lưng vào ghế máy, hai khuỷu gập, tay cầm ngang vai. Khung kết thúc: hai tay đẩy tay cầm lên trên đầu tới khi khuỷu gần duỗi, lưng vẫn tựa ghế.',
    measure: 'reps',
  },
  'single-arm-overhead-press': {
    nameVi: 'Đẩy tạ đơn qua đầu một tay',
    equipment: 'Một tạ đơn · đứng · một tay đẩy',
    purpose: 'Động tác đẩy qua đầu giúp tập vai và cơ lõi với một tạ đơn ở một tay.',
    startPosition:
      'Đứng thẳng, một tay giữ tạ đơn trước vai với khuỷu gần sườn. Tay còn lại buông tự nhiên cạnh người.',
    steps: [
      'Siết bụng rồi đẩy tạ thẳng lên trên đầu bằng tay đang cầm. Giữ thân thẳng, không nghiêng sang bên hay ưỡn lưng.',
      'Hạ tạ về vai chậm bằng cách kéo khuỷu xuống gần sườn. Đổi bên sau khi xong một bên.',
    ],
    source: 'Physitrack · Standing Single-Arm Dumbbell Overhead Press',
    sourceUrl:
      'https://ie.physitrack.com/home-exercise-video/overhead-press---standing-single-arm-with-dumbbell',
    alt: 'Khung bắt đầu: nhìn chếch trước, người đứng, một tay giữ tạ đơn trước vai, tay kia buông cạnh người. Khung kết thúc: tay cầm tạ duỗi thẳng lên trên đầu, thân vẫn thẳng.',
    measure: 'reps',
  },
  'smith-machine-overhead-press': {
    nameVi: 'Đẩy vai máy Smith đứng',
    equipment: 'Máy Smith · đứng · thanh đòn trượt theo ray',
    purpose: 'Động tác đẩy qua đầu giúp tập vai với thanh đòn dẫn hướng của máy Smith.',
    startPosition:
      'Đứng dưới máy Smith với hai bàn chân vững. Chỉnh thanh ở độ cao có thể nắm khi hai tay gần duỗi.',
    steps: [
      'Nắm thanh rộng hơn vai một chút. Siết bụng, đỡ thanh và xoay để mở khóa.',
      'Hạ thanh có kiểm soát về trước vai rồi đẩy lên theo ray. Giữ thân thẳng và tránh ưỡn lưng.',
      'Móc thanh vào chốt khi kết thúc hiệp rồi mới buông tay.',
    ],
    source: 'Life Fitness · Smith Machine PL06 Standing Shoulder Press',
    sourceUrl:
      'https://keystonefitness.ca/wp-content/uploads/2023/05/Life-Fitness-pro-pro1-Series-Strength-Equipment-Owners-Manual.pdf',
    alt: 'Khung bắt đầu: nhìn chếch trước, người đứng trong khung máy Smith, tay nắm đòn ngang vai và trước vai. Khung kết thúc: hai tay đẩy đòn lên trên đầu, tay gần thẳng.',
    measure: 'reps',
  },
  thruster: {
    nameVi: 'Squat trước đẩy tạ đòn qua đầu',
    equipment: 'Một tạ đòn · đứng · đòn đặt trên vai trước',
    purpose: 'Động tác kết hợp squat và đẩy qua đầu giúp tập toàn thân với một tạ đòn.',
    startPosition:
      'Ở đáy squat trước, hai chân rộng bằng vai, đòn tì cao trên vai trước và khuỷu hướng ra trước. Hông thấp hơn gối, thân thẳng và gót chạm sàn.',
    steps: [
      'Đạp mạnh hai chân, duỗi nhanh hông và gối để đứng lên và đẩy đòn bật khỏi vai. Giữ gót chạm sàn tới khi hông duỗi hết.',
      'Duỗi hai tay đẩy đòn thẳng lên trên đầu tới khi tay khóa thẳng. Chỉ dùng tay sau khi hông và gối đã duỗi hết.',
      'Hạ đòn về vai trước có kiểm soát rồi đẩy hông ra sau và xuống để vào lại squat.',
    ],
    source: 'CrossFit · The Thruster',
    sourceUrl: 'https://www.crossfit.com/essentials/the-thruster',
    alt: 'Khung bắt đầu: nhìn chếch trước, người ngồi squat sâu, đòn trên vai trước. Khung kết thúc: người đứng thẳng, hai tay duỗi thẳng giữ đòn trên đầu.',
    measure: 'reps',
  },
};
