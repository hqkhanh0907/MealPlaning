import { muscleLabels, type PlannedExerciseWithExercise } from './fitness.types';

export interface ExerciseGuide {
  equipment: string;
  loadLabel?: string;
  purpose: string;
  steps: readonly string[];
  source: string;
  sourceUrl: string;
  illustration?: { path: string; alt: string };
}

const crossFitGuide = 'https://assets.crossfit.com/pdfs/seminars/Dumbbell_Training_Guide.pdf';

const guides: Readonly<Partial<Record<string, ExerciseGuide>>> = {
  ex_dumbbell_goblet_squat: {
    equipment: 'Một tạ đơn',
    purpose: 'Động tác gập gối giúp tập đùi trước với một tạ giữ sát ngực.',
    steps: [
      'Đứng vững. Dùng hai tay đỡ một đầu tạ trước ngực, để thân tạ thẳng đứng.',
      'Gập gối và hông để hạ người. Giữ bàn chân áp sàn và đầu gối hướng theo mũi chân.',
      'Trong tầm vận động kiểm soát được, đẩy sàn để đứng lên. Giữ tạ sát ngực.',
    ],
    source: 'CrossFit · Dumbbells Training Guide, Goblet Squats',
    sourceUrl: crossFitGuide + '#page=5',
  },
  ex_push_up: {
    equipment: 'Sàn · chống bằng bàn tay và mũi chân',
    purpose: 'Động tác đẩy ngang giúp tập ngực bằng trọng lượng cơ thể trên sàn.',
    steps: [
      'Chống hai tay xuống sàn, gần dưới vai. Duỗi chân và trụ trên mũi chân.',
      'Giữ thân và hông thẳng hàng. Gập khuỷu để hạ ngực về phía sàn trong tầm kiểm soát.',
      'Đẩy sàn bằng hai tay để nâng ngực và hông lên cùng nhau.',
    ],
    source: 'American Council on Exercise · Push-up',
    sourceUrl: 'https://www.acefitness.org/resources/everyone/exercise-library/41/push-up/',
  },
  ex_dumbbell_bent_over_row: {
    equipment: 'Hai tạ đơn · đứng gập hông, không tựa ghế',
    loadLabel: 'Tổng hai tạ (kg)',
    purpose: 'Động tác kéo ngang giúp tập lưng với hai tạ đơn khi không có ghế.',
    illustration: {
      path: 'assets/fitness/two-arm-dumbbell-row.webp',
      alt: 'Bên trái, hai tay buông tạ dưới vai. Bên phải, hai khuỷu kéo ra sau. Hai chân trụ sàn, thân giữ nguyên góc gập.',
    },
    steps: [
      'Đứng với một tạ ở mỗi tay. Chùng nhẹ gối, đẩy hông ra sau và nghiêng thân về trước.',
      'Giữ lưng trung lập, buông tay dưới vai. Kéo đồng thời hai khuỷu ra sau, đưa tạ về hai bên thân.',
      'Giữ nguyên góc thân khi hạ cả hai tạ có kiểm soát về vị trí ban đầu.',
    ],
    source: 'CrossFit · Dumbbells Training Guide, Bent-over Row (B)',
    sourceUrl: crossFitGuide + '#page=22',
  },
  ex_dumbbell_romanian_deadlift: {
    equipment: 'Hai tạ đơn · đứng gập hông',
    loadLabel: 'Tổng hai tạ (kg)',
    purpose: 'Động tác gập hông giúp tập đùi sau với hai tạ đơn dọc theo chân.',
    steps: [
      'Đứng thẳng, mỗi tay cầm một tạ trước đùi. Chùng nhẹ gối.',
      'Đẩy hông ra sau, giữ tạ gần chân khi hạ xuống. Dừng ở độ sâu vẫn giữ được lưng trung lập.',
      'Đẩy chân xuống sàn và duỗi hông để đứng thẳng. Giữ tạ gần thân suốt động tác.',
    ],
    source: 'National Academy of Sports Medicine · Dumbbell Romanian Deadlift',
    sourceUrl: 'https://www.nasm.org/resource-center/exercise-library/dumbbell-romanian-deadlift',
  },
};

export function exerciseGuide(exerciseId: string): ExerciseGuide | undefined {
  return Object.hasOwn(guides, exerciseId) ? guides[exerciseId] : undefined;
}

export function exercisePurpose(
  exercise: Pick<PlannedExerciseWithExercise, 'exercise_id' | 'muscle_group'>,
): string {
  return (
    exerciseGuide(exercise.exercise_id)?.purpose ??
    'Nhóm tập chính trong lịch: ' + muscleLabels[exercise.muscle_group] + '.'
  );
}
