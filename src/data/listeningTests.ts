import { ListeningSection } from '../types';

export const LISTENING_SECTIONS: ListeningSection[] = [
  {
    id: 'listen_sec_1',
    sectionNumber: 1,
    title: 'Section 1: Community Sports Complex Registration',
    contextEn: 'A customer inquiries about membership packages and court bookings at a local sports club.',
    contextVi: 'Khách hàng gọi điện tìm hiểu về các gói thành viên và đặt sân tại câu lạc bộ thể thao địa phương.',
    audioDurationSeconds: 120,
    transcript: `Receptionist: Good morning, Oakridge Sports and Wellness Club. How can I help you today?
Customer: Hi there, I recently moved to the neighborhood and I am looking to join the club. Could you give me some details about membership options?
Receptionist: Of course! We offer three main tiers: Bronze, Silver, and Gold. The Bronze package includes access to the fitness center and outdoor running track for 35 pounds per month.
Customer: What about the swimming pool and badminton courts?
Receptionist: Those are included in our Silver package, which is 52 pounds monthly. If you want unrestricted access to all racquet courts, the heated Olympic pool, and personal training sessions, that would be our Gold membership at 75 pounds a month.
Customer: I see. The Silver membership sounds ideal for me. Are there any joining fees?
Receptionist: Normally there is a registration fee of 20 pounds, but we are currently running an autumn promotion, so the fee is completely waived if you sign up before Friday the 15th of October.
Customer: Fantastic! And what are your standard opening hours on weekends?
Receptionist: On Saturdays and Sundays we are open from 7:00 AM until 9:00 PM. Weekdays we open earlier, at 6:00 AM until 10:00 PM.
Customer: That suits my schedule perfectly. Can I register my name now?
Receptionist: Certainly. May I have your full name and contact number?
Customer: Yes, my name is Arthur Pendelton, spelled P-E-N-D-E-L-T-O-N, and my mobile number is 07700 900342.
Receptionist: Thank you Mr. Pendelton. I have noted that down.`,
    audioScript: [
      {
        speaker: 'Receptionist',
        text: 'Good morning, Oakridge Sports and Wellness Club. How can I help you today?',
        time: 0,
      },
      {
        speaker: 'Customer',
        text: 'Hi there, I recently moved to the neighborhood and I am looking to join the club. Could you give me some details about membership options?',
        time: 8,
      },
      {
        speaker: 'Receptionist',
        text: 'Of course! We offer three main tiers: Bronze, Silver, and Gold. The Bronze package includes access to the fitness center and outdoor running track for 35 pounds per month.',
        time: 20,
      },
      { speaker: 'Customer', text: 'What about the swimming pool and badminton courts?', time: 35 },
      {
        speaker: 'Receptionist',
        text: 'Those are included in our Silver package, which is 52 pounds monthly.',
        time: 42,
      },
      { speaker: 'Customer', text: 'The Silver membership sounds ideal for me. Are there any joining fees?', time: 54 },
      {
        speaker: 'Receptionist',
        text: 'There is a registration fee of 20 pounds, but it is completely waived before October 15th.',
        time: 64,
      },
      { speaker: 'Customer', text: 'And what are your standard opening hours on weekends?', time: 76 },
      { speaker: 'Receptionist', text: 'On Saturdays and Sundays we are open from 7:00 AM until 9:00 PM.', time: 84 },
      { speaker: 'Customer', text: 'My name is Arthur Pendelton, spelled P-E-N-D-E-L-T-O-N.', time: 98 },
    ],
    questions: [
      {
        id: 'lq1',
        type: 'form-completion',
        questionNumber: 1,
        prompt: 'Monthly price for the Silver membership tier: £ _____',
        options: ['35', '52', '75', '20'],
        correctAnswer: '52',
        explanationEn:
          'The receptionist confirms: "Those are included in our Silver package, which is 52 pounds monthly."',
        explanationVi: 'Lễ tân xác nhận gói Silver có giá 52 bảng mỗi tháng.',
      },
      {
        id: 'lq2',
        type: 'form-completion',
        questionNumber: 2,
        prompt: 'The registration fee is waived if the customer joins before _____ of October.',
        options: ['12th', '15th', '20th', '31st'],
        correctAnswer: '15th',
        explanationEn: 'The receptionist states the fee is waived if signing up before Friday the 15th of October.',
        explanationVi: 'Phí đăng ký được miễn hoàn toàn nếu đăng ký trước ngày 15 tháng 10.',
      },
      {
        id: 'lq3',
        type: 'multiple-choice',
        questionNumber: 3,
        prompt: 'What time does the club open on Sunday morning?',
        options: ['6:00 AM', '7:00 AM', '8:00 AM', '9:00 AM'],
        correctAnswer: '7:00 AM',
        explanationEn: 'The receptionist clarifies: "On Saturdays and Sundays we are open from 7:00 AM until 9:00 PM."',
        explanationVi: 'Lễ tân nêu rõ vào thứ Bảy và Chủ Nhật câu lạc bộ mở cửa từ 7:00 sáng.',
      },
      {
        id: 'lq4',
        type: 'short-answer',
        questionNumber: 4,
        prompt: 'Surname of the customer: _____',
        options: ['Pendleton', 'Pendelton', 'Pendlton', 'Pellington'],
        correctAnswer: 'Pendelton',
        explanationEn: 'The customer spells his surname letter-by-letter: P-E-N-D-E-L-T-O-N.',
        explanationVi: 'Khách hàng đánh vần rõ họ của mình là P-E-N-D-E-L-T-O-N.',
      },
    ],
  },
  {
    id: 'listen_sec_4',
    sectionNumber: 4,
    title: 'Section 4: Academic Lecture on Marine Bioluminescence',
    contextEn: 'A university marine biology lecture discussing chemical bioluminescence in deep-sea cephalopods.',
    contextVi: 'Bài giảng sinh học biển về hiện tượng phát quang sinh học ở động vật thân mềm vùng biển sâu.',
    audioDurationSeconds: 150,
    transcript: `Lecturer: Welcome back, everyone. In today's marine physiology lecture, we will examine the biological mechanisms and evolutionary utility of bioluminescence in abyssal marine life. Bioluminescence is defined as the production and emission of visible light by a living organism as the result of a biochemical oxidation reaction. 

At the molecular core of this phenomenon lies a light-emitting pigment known as luciferin, catalyzed by an enzyme called luciferase. In the presence of oxygen and cellular adenosine triphosphate (ATP), luciferin is oxidized to create an excited intermediate molecule, which releases energy in the form of cold, visible photon light upon returning to its ground state. Because nearly 90% of the energy is emitted as pure illumination rather than heat, bioluminescent reactions are remarkably thermodynamically efficient.

Deep-sea cephalopods, particularly species of squids inhabiting the mesopelagic twilight zone, leverage bioluminescence for three primary survival functions: counter-illumination camouflage, prey attraction, and conspecific communication. In counter-illumination, specialized photophores on the ventral underside of the squid generate light matching the exact wavelength and intensity of downwelling sunlight from the surface. Consequently, predators swimming beneath the squid are unable to discern its dark silhouette against the ocean sky.`,
    audioScript: [
      {
        speaker: 'Lecturer',
        text: "Welcome back, everyone. In today's lecture, we examine bioluminescence in deep-sea organisms.",
        time: 0,
      },
      {
        speaker: 'Lecturer',
        text: 'At the molecular core lies a light-emitting pigment called luciferin, catalyzed by luciferase.',
        time: 25,
      },
      {
        speaker: 'Lecturer',
        text: 'Nearly 90% of the energy is emitted as illumination rather than thermal heat.',
        time: 55,
      },
      {
        speaker: 'Lecturer',
        text: 'Deep-sea squids leverage photophores on their ventral underside for counter-illumination camouflage.',
        time: 85,
      },
    ],
    questions: [
      {
        id: 'lq_s4_1',
        type: 'multiple-choice',
        questionNumber: 1,
        prompt: 'Which pigment is responsible for light emission in bioluminescent organisms?',
        options: ['Chlorophyll', 'Luciferin', 'Luciferase', 'Hemoglobin'],
        correctAnswer: 'Luciferin',
        explanationEn:
          'The lecturer notes that the light-emitting pigment is luciferin, while luciferase is the enzyme catalyst.',
        explanationVi: 'Giảng viên nêu rõ sắc tố phát sáng là luciferin, còn luciferase là enzyme xúc tác.',
      },
      {
        id: 'lq_s4_2',
        type: 'sentence-completion',
        questionNumber: 2,
        prompt:
          'Bioluminescence is highly efficient because nearly 90% of energy is released as light rather than _____.',
        options: ['oxygen', 'heat', 'electricity', 'sound'],
        correctAnswer: 'heat',
        explanationEn: 'The lecturer notes that energy is emitted as illumination rather than thermal heat.',
        explanationVi: 'Giảng viên nhấn mạnh năng lượng được phát ra dưới dạng ánh sáng thay vì nhiệt lượng.',
      },
      {
        id: 'lq_s4_3',
        type: 'matching',
        questionNumber: 3,
        prompt: 'Squids match downwelling sunlight using photophores on their _____ underside.',
        options: ['dorsal', 'ventral', 'lateral', 'cranial'],
        correctAnswer: 'ventral',
        explanationEn:
          'The lecturer describes photophores on the ventral (underside) of the squid for counter-illumination camouflage.',
        explanationVi: 'Giảng viên nhắc đến các cơ quan phát sáng ở mặt bụng (ventral) của mực biển.',
      },
    ],
  },
];
