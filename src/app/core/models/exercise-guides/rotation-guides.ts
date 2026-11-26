import type { ExerciseGuideTextSet } from '../exercise-guide.types';

export const rotationGuides: ExerciseGuideTextSet = {
  'band-external-rotation': {
    nameVi: 'Xoay ngoài vai bằng dây kháng lực',
    equipment: 'Dây kháng lực · cột neo ngang eo ở bên đối diện · khuỷu kẹp sát thân',
    purpose: 'Động tác xoay ngoài vai giúp tập nhóm cơ xoay vai bằng dây kháng lực.',
    startPosition:
      'Đứng thẳng, dây neo ngang eo ở bên đối diện tay tập. Khuỷu tay tập gập vuông, kẹp sát thân và nắm dây trước bụng.',
    steps: [
      'Giữ khuỷu kẹp sát thân rồi xoay cẳng tay ra ngoài, kéo dây ra xa bụng. Siết hai bả vai về sau và giữ thân đứng yên.',
      'Đưa tay về trước bụng chậm và có kiểm soát, khuỷu vẫn sát sườn.',
    ],
    source:
      'American Academy of Orthopaedic Surgeons · Rotator Cuff and Shoulder Conditioning Program',
    sourceUrl: 'https://orthoinfo.aaos.org/globalassets/pdfs/2017-rehab_shoulder.pdf#page=6',
    alt: 'Khung bắt đầu: nhìn thẳng phía trước, dây neo vào cột bên phải của hình, tay tập gập khuỷu giữ dây trước bụng. Khung kết thúc: cẳng tay xoay ra ngoài, nắm tay ra xa thân, khuỷu vẫn gần sườn.',
    measure: 'reps',
  },
  'band-internal-rotation': {
    nameVi: 'Xoay trong vai bằng dây kháng lực',
    equipment: 'Dây kháng lực · cột neo ngang eo · khuỷu kẹp sát thân',
    purpose: 'Động tác xoay trong vai giúp tập nhóm cơ xoay vai bằng dây kháng lực.',
    startPosition:
      'Đứng thẳng, dây neo ngang eo ở cùng bên tay tập. Khuỷu tay tập gập vuông, kẹp sát thân và nắm dây ở phía ngoài.',
    steps: [
      'Giữ khuỷu kẹp sát thân rồi xoay cẳng tay vào trong để đưa nắm tay tới trước bụng. Giữ thân đứng yên và cổ tay thẳng.',
      'Đưa tay ra ngoài chậm và có kiểm soát, khuỷu vẫn ép sát sườn.',
    ],
    source:
      'American Academy of Orthopaedic Surgeons · Rotator Cuff and Shoulder Conditioning Program',
    sourceUrl: 'https://orthoinfo.aaos.org/globalassets/pdfs/2017-rehab_shoulder.pdf#page=6',
    alt: 'Khung bắt đầu: nhìn chếch trước, dây neo vào cột bên trái của hình, tay tập gập khuỷu nắm dây ở phía ngoài thân. Khung kết thúc: cẳng tay xoay vào trong, nắm tay trước bụng, khuỷu sát sườn.',
    measure: 'reps',
  },
  'cable-external-rotation': {
    nameVi: 'Xoay ngoài vai bằng cáp',
    equipment:
      'Cáp ròng rọc ngang eo · tay cầm đơn · khuỷu tay kẹp sát hông, máy ở phía đối diện tay tập',
    purpose: 'Động tác xoay ngoài khớp vai giúp tập nhóm cơ xoay vai với cáp và tay cầm đơn.',
    startPosition:
      'Đứng thẳng, khuỷu tay kẹp sát hông, cẳng tay vắt ngang bụng và nắm tay cầm trước bụng. Máy cáp nằm ở bên đối diện tay tập nên dây đi ngang qua trước bụng.',
    steps: [
      'Giữ khuỷu tay sát hông rồi xoay cẳng tay ra ngoài cho bàn tay rời xa bụng. Không để khuỷu tay bay ra khỏi thân.',
      'Dừng ngắn ở cuối tầm xoay, vai giữ thấp và thả lỏng.',
      'Đưa tay về trước bụng thật chậm, giữ cáp căng có kiểm soát.',
    ],
    source: 'American Council on Exercise · Rotator Cuff External Rotation',
    sourceUrl:
      'https://www.acefitness.org/resources/everyone/exercise-library/352/rotator-cuff-external-rotation/',
    alt: 'Khung bắt đầu: người đứng thẳng nhìn từ phía trước, máy cáp bên phải hình, bàn tay nắm tay cầm trước bụng với khuỷu tay sát hông và dây cáp đi ngang qua bụng. Khung kết thúc: cẳng tay xoay ra ngoài, tay cầm cách xa bụng hơn, khuỷu tay vẫn sát thân.',
    measure: 'reps',
  },
  'cable-internal-rotation': {
    nameVi: 'Xoay trong vai bằng cáp',
    equipment: 'Cáp ròng rọc ngang eo · tay cầm đơn · khuỷu tay kẹp sát hông, máy cùng bên tay tập',
    purpose: 'Động tác xoay trong khớp vai giúp tập nhóm cơ xoay vai với cáp và tay cầm đơn.',
    startPosition:
      'Đứng thẳng, bên người gần máy hướng về máy, khuỷu tay kẹp sát hông. Cẳng tay xoay ra ngoài và bàn tay nắm tay cầm ở cạnh thân phía máy.',
    steps: [
      'Giữ khuỷu tay sát hông rồi xoay vai vào trong để đưa bàn tay về trước bụng. Không đẩy khuỷu tay ra xa thân.',
      'Dừng ngắn khi tay tới trước bụng, thân giữ thẳng.',
      'Thả tay trở lại thật chậm, vẫn kẹp khuỷu tay sát hông.',
    ],
    source: 'American Council on Exercise · Rotator Cuff Internal Rotation',
    sourceUrl:
      'https://www.acefitness.org/resources/everyone/exercise-library/351/rotator-cuff-internal-rotation/',
    alt: 'Khung bắt đầu: người đứng chếch trước mặt, máy cáp bên trái hình, bàn tay nắm tay cầm ở cạnh thân phía máy với cẳng tay xoay ra ngoài. Khung kết thúc: cẳng tay xoay vào, bàn tay và tay cầm nằm trước bụng, khuỷu tay vẫn sát hông.',
    measure: 'reps',
  },
  'cable-woodchopper': {
    nameVi: 'Chặt củi cáp từ cao xuống thấp',
    equipment: 'Máy cáp · ròng rọc ngang vai · một tay cầm · đứng nghiêng cạnh máy.',
    purpose:
      'Động tác xoay thân chéo từ cao xuống thấp giúp tập cơ bụng chéo với cáp và tay cầm đơn.',
    startPosition:
      'Đứng nghiêng bên cạnh máy, hai chân rộng hơn vai. Hai tay nắm tay cầm, giơ cao phía trên vai gần máy, tay gần thẳng.',
    steps: [
      'Giữ hai tay gần thẳng và kéo tay cầm chéo xuống về hông phía xa máy. Xoay hông và thân cùng lúc, dồn trọng tâm sang chân xa máy.',
      'Giữ lưng thẳng, ngực và bụng xoay cùng nhau.',
      'Đưa tay cầm về vị trí cao thật chậm, không để cáp kéo giật.',
    ],
    source: 'American Council on Exercise · Standing Rotational Chop',
    sourceUrl:
      'https://www.acefitness.org/resources/everyone/exercise-library/349/standing-rotational-chop/',
    alt: 'Khung bắt đầu: người đứng chân rộng nhìn chếch, máy cáp bên trái hình, hai tay nắm tay cầm giơ cao về phía ròng rọc trên cùng. Khung kết thúc: hai tay kéo tay cầm chéo xuống thấp trước thân, chân gần máy duỗi, gối chân xa máy gập.',
    measure: 'reps',
  },
  'dumbbell-side-bend': {
    nameVi: 'Nghiêng người với một tạ đơn',
    equipment: 'Một tạ đơn · đứng thẳng, tạ buông bên hông, tay kia đặt sau đầu',
    purpose: 'Động tác nghiêng thân sang bên giúp tập cơ bụng chéo với một tạ đơn khi đứng.',
    startPosition:
      'Đứng thẳng, hai chân rộng bằng vai, một tay buông thẳng cầm tạ đơn bên hông. Tay kia đặt nhẹ sau đầu.',
    steps: [
      'Nghiêng thân sang phía cầm tạ, chỉ gập thân sang bên. Vai không xoay về trước hay ra sau.',
      'Dừng ngắn rồi siết cơ bụng bên đối diện để kéo thân về thẳng đứng.',
      'Giữ tay sau đầu nhẹ nhàng, không kéo cổ.',
    ],
    source: 'StrengthLog · Dumbbell Side Bend',
    sourceUrl: 'https://www.strengthlog.com/dumbbell-side-bend/',
    alt: 'Một khung giữ: người đứng thẳng nhìn từ phía trước, tay phải buông cầm một tạ đơn bên hông, tay trái đặt sau đầu. Thân và đầu nghiêng sang phía tay đặt sau đầu, xa phía tạ đơn. Chỉ thấy một tạ đơn.',
    measure: 'reps',
  },
  'horizontal-cable-twist': {
    nameVi: 'Xoay thân ngang bằng cáp',
    equipment: 'Cáp ròng rọc ngang ngực · tay cầm đơn · đứng nghiêng cạnh máy, chân rộng',
    purpose: 'Động tác xoay thân theo phương ngang giúp tập cơ bụng chéo với cáp và tay cầm đơn.',
    startPosition:
      'Đứng nghiêng bên cạnh máy, chân rộng hơn vai. Hai tay đan nhau nắm tay cầm, duỗi thẳng trước ngực về phía máy.',
    steps: [
      'Dồn lực sang chân xa máy rồi xoay bụng và ngực, hai tay duỗi thẳng xoay cùng thân.',
      'Xoay tới mức thoải mái, hông và thân cùng chuyển, lưng giữ thẳng.',
      'Xoay ngược về phía máy thật chậm, không để cáp kéo giật.',
    ],
    source: 'American Council on Exercise · Standing Trunk Rotation',
    sourceUrl:
      'https://www.acefitness.org/resources/everyone/exercise-library/102/standing-trunk-rotation/',
    alt: 'Khung bắt đầu: người đứng chân rộng nhìn chếch, máy cáp bên trái hình, hai tay duỗi thẳng nắm tay cầm trước ngực về phía máy. Khung kết thúc: thân xoay ra xa máy, hai tay vẫn trước ngực, dây cáp kéo căng.',
    measure: 'reps',
  },
  'landmine-rotation': {
    nameVi: 'Xoay thân với đòn landmine',
    equipment: 'Tạ đòn gắn đế landmine · hai tay cầm đầu thanh có đĩa · đứng chân rộng',
    purpose: 'Động tác xoay thân theo vòng cung giúp tập cơ bụng chéo với tạ đòn gắn đế landmine.',
    startPosition:
      'Đứng đối diện đế, hai chân rộng ngang vai. Nắm đầu thanh bằng hai tay và giữ trước ngực, tay gần duỗi thẳng.',
    steps: [
      'Xoay thân và hông, hạ đầu thanh theo vòng cung tới ngang hông một bên. Xoay bàn chân theo hông.',
      'Đưa đầu thanh lên qua giữa rồi hạ tới ngang hông bên kia. Giữ tay gần thẳng và chuyển động chậm.',
    ],
    source: 'O-SEA CrossFit · Landmine Rotation',
    sourceUrl: 'https://oseacrossfit.com/movements/landmine-press/',
    alt: 'Khung bắt đầu: người đứng chân rộng nhìn từ phía trước, hai tay giơ đầu thanh có đĩa lên cao ngang đầu, đế landmine nằm sát sàn bên phải hình, gần ngang hàng với người. Khung kết thúc: hai tay hạ đầu thanh xuống thấp trước hông, gần giữa thân, gối gập.',
    measure: 'reps',
  },
  'russian-twists': {
    nameVi: 'Xoay thân kiểu Nga ngồi sàn',
    equipment: 'Sàn · ngồi, chân nhấc khỏi sàn · có thể cầm bóng tạ',
    purpose: 'Động tác xoay thân khi ngồi giúp tập cơ bụng chéo, có thể cầm bóng tạ trước ngực.',
    startPosition:
      'Ngồi trên sàn, ngả thân ra sau vừa phải, gối gập và hai chân nhấc khỏi sàn. Hai tay ôm bóng trước ngực.',
    steps: [
      'Giữ lưng thẳng và ngực mở, xoay vai cùng thân sang một bên để bóng đi theo.',
      'Dẫn bằng vai chứ không vung tay, bụng siết trong lúc xoay.',
      'Xoay qua giữa rồi sang bên kia chậm rãi, không dùng đà.',
    ],
    source: 'National Academy of Sports Medicine · Russian Twist',
    sourceUrl: 'https://www.nasm.org/resource-center/exercise-library/russian-twist',
    alt: 'Khung bắt đầu: người ngồi nhìn chếch từ phía trước, ngả nhẹ ra sau, hai chân nhấc khỏi sàn, hai tay ôm quả bóng đen trước ngực. Khung kết thúc: thân xoay sang bên, hai tay đưa bóng xuống cạnh hông. Hình có vẽ bóng dù danh mục ghi không dụng cụ.',
    measure: 'reps',
  },
  'standing-twister': {
    nameVi: 'Xoay hông trên đĩa xoay đứng',
    equipment: 'Máy xoay eo đứng · đĩa xoay dưới chân · hai tay nắm thanh ngang trước ngực',
    purpose: 'Động tác xoay hông giúp tập cơ bụng chéo bằng máy đĩa xoay khi đứng.',
    startPosition:
      'Đứng trên đĩa xoay, hai tay nắm thanh ngang trước ngực, vai và ngực hướng thẳng phía trước. Gối hơi gập, hông và chân xoay sang một bên.',
    steps: [
      'Giữ vai và ngực hướng thẳng, xoay hông và chân sang một bên cùng đĩa. Bàn chân nằm yên trên đĩa, xoay từ hông chứ không vặn gối.',
      'Dừng ngắn ở cuối tầm thoải mái, gối hơi gập.',
      'Xoay hông về phía bên kia chậm rãi, không vung đà.',
    ],
    source: 'Morti · Robinia Waist Twister',
    sourceUrl: 'https://www.mortisportandplay.co.uk/equipment/robinia-outdoor-gym-waist-twister',
    alt: 'Khung bắt đầu: người đứng trên đĩa xoay nhìn từ phía trước, hai tay nắm thanh ngang trước ngực, gối và hông xoay sang một bên. Khung kết thúc: gối và hông xoay sang bên đối diện, vai và tay vẫn hướng thẳng phía trước.',
    measure: 'reps',
  },
  'windshield-wipers': {
    nameVi: 'Quét chân nằm ngửa',
    equipment: 'Sàn · nằm ngửa, hai tay dang ngang sát sàn, hai chân giơ thẳng lên',
    purpose: 'Động tác xoay thân dưới khi nằm giúp tập cơ bụng chéo bằng trọng lượng cơ thể.',
    startPosition:
      'Nằm ngửa, đặt hai tay xuống sàn. Khép hai chân, duỗi gối và đưa bàn chân lên trên hông.',
    steps: [
      'Siết bụng và giữ hai vai trên sàn. Hạ chậm hai chân đang khép sang một bên.',
      'Dừng trong tầm kiểm soát rồi nâng hai chân về vị trí thẳng đứng.',
      'Tiếp tục hạ chân sang bên kia. Giữ hai chân đi cùng nhau.',
    ],
    source: 'Henrico County Division of Fire · Windshield Wipers',
    sourceUrl:
      'https://www.vaco.org/AchievementAwards/Entries2016/HenricoFireFitIntensiveFocus/HenricoFireFitIntensiveFocus.pdf',
    alt: 'Khung bắt đầu: người nằm ngửa, hai tay duỗi sát sàn, hai chân khép giơ thẳng lên. Khung kết thúc: hai chân khép hạ chếch xuống gần sàn theo hướng dọc thân, giống động tác hạ chân thẳng, thân và hai tay vẫn sát sàn.',
    measure: 'reps',
  },
};
