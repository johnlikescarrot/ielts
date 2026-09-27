import { ReadingPassage } from '../types';

export const READING_PASSAGES: ReadingPassage[] = [
  {
    id: 'read_acad_1',
    title: 'The Evolution of Urban Vertical Farming',
    examType: 'academic',
    difficulty: 'Band 7.0-7.5',
    timeLimitMinutes: 20,
    passageText: `Paragraph A
By the year 2050, nearly 70% of the world's population is projected to dwell in urban centers. As traditional horizontal farmland diminishes due to soil degradation, desertification, and climate instability, agricultural scientists have proposed a radical alternative: vertical farming. This architectural and biological innovation involves cultivating crops in vertically stacked layers, integrated into skyscrapers, repurposed warehouses, or shipping containers situated directly within bustling metropolises.

Paragraph B
Vertical farming relies extensively on controlled-environment agriculture (CEA) technology. Within these sealed ecosystems, artificial LED lighting mimics natural sunlight spectra while temperature, humidity, and atmospheric carbon dioxide levels are perpetually regulated by automated sensor arrays. Moreover, conventional soil is completely replaced with soilless growing techniques, predominantly hydroponics—where plant roots are submerged in mineral-rich liquid solutions—and aeroponics, wherein roots are misted with nutrient vapor. Consequently, vertical farms can operate 365 days a year irrespective of external weather anomalies.

Paragraph C
The ecological merits of vertical agriculture are substantial. Closed-loop recirculating irrigation systems in vertical facilities consume up to 95% less fresh water compared to conventional open-field irrigation. Furthermore, the contained indoor environment virtually eliminates vulnerability to agricultural pests and weed invasions, rendering synthetic chemical pesticides and herbicides redundant. Because production occurs in close proximity to final urban consumers, "food miles"—the transportation distance from farm to plate—are drastically curtailed, shrinking the carbon footprint of perishable greens.

Paragraph D
Notwithstanding these notable advantages, formidable economic and operational hurdles impede widespread adoption. The primary impediment remains exorbitant upfront capital expenditure (CapEx) and operational energy costs. Powering high-intensity LED illumination systems and industrial HVAC climate control mechanisms demands immense quantities of electricity. If vertical farms rely on fossil-fuel-powered electric grids, their overall carbon mitigation benefits can be nullified. Skeptics also note that current CEA systems are largely limited to fast-growing leafy greens, herbs, and microgreens, while high-calorie staple crops like wheat, rice, and maize remain commercially non-viable in vertical configurations.

Paragraph E
Technological convergence may soon resolve many of these financial and energetic bottlenecks. Emerging third-generation solar photovoltaics and geothermal microgrids promise to supply clean, decentralized power to urban agricultural towers. In parallel, advancements in computer vision and robotic harvesting algorithms are reducing human labor overheads. As urban centers prioritize climate resilience and local food sovereignty, vertical farming is poised to transition from an experimental niche into an indispensable pillar of modern civic infrastructure.`,
    questions: [
      {
        id: 'rq1',
        type: 'matching-headings',
        questionNumber: 1,
        prompt: 'Which paragraph describes the specific technological methods replacing soil in vertical agriculture?',
        options: ['Paragraph A', 'Paragraph B', 'Paragraph C', 'Paragraph D', 'Paragraph E'],
        correctAnswer: 'Paragraph B',
        paragraphRef: 'Paragraph B',
        explanationEn:
          'Paragraph B explicitly explains CEA technology, LED lighting, and soil substitutes: hydroponics and aeroponics.',
        explanationVi:
          'Đoạn B mô tả cụ thể về công nghệ nông nghiệp môi trường có kiểm soát (CEA) và các phương pháp thủy canh, khí canh thay thế đất.',
      },
      {
        id: 'rq2',
        type: 'matching-headings',
        questionNumber: 2,
        prompt: 'Which paragraph discusses the primary economic and energy barriers of vertical farming?',
        options: ['Paragraph A', 'Paragraph B', 'Paragraph C', 'Paragraph D', 'Paragraph E'],
        correctAnswer: 'Paragraph D',
        paragraphRef: 'Paragraph D',
        explanationEn:
          'Paragraph D discusses high capital expenditure (CapEx), LED electricity consumption, and limitation to leafy greens.',
        explanationVi:
          'Đoạn D phân tích các rào cản tài chính (chi phí vốn đầu tư) và chi phí năng lượng vận hành hệ thống đèn LED/điều hòa.',
      },
      {
        id: 'rq3',
        type: 'true-false-not-given',
        questionNumber: 3,
        prompt: 'Vertical farms consume significantly less water than conventional outdoor farms.',
        options: ['TRUE', 'FALSE', 'NOT GIVEN'],
        correctAnswer: 'TRUE',
        paragraphRef: 'Paragraph C',
        explanationEn:
          'Paragraph C states: "Closed-loop recirculating irrigation systems in vertical facilities consume up to 95% less fresh water compared to conventional open-field irrigation."',
        explanationVi:
          'Đoạn C khẳng định các hệ thống tưới tuần hoàn khép kín tiêu thụ ít hơn tới 95% nước ngọt so với phương pháp tưới đồng ruộng truyền thống.',
      },
      {
        id: 'rq4',
        type: 'true-false-not-given',
        questionNumber: 4,
        prompt: 'Staple grains such as wheat and rice are currently the most profitable crops in vertical farms.',
        options: ['TRUE', 'FALSE', 'NOT GIVEN'],
        correctAnswer: 'FALSE',
        paragraphRef: 'Paragraph D',
        explanationEn:
          'Paragraph D states that staple crops like wheat and rice "remain commercially non-viable in vertical configurations" while leafy greens are predominantly grown.',
        explanationVi:
          'Đoạn D nêu rõ cây lương thực chính như lúa mì và gạo hiện không khả thi về mặt thương mại khi trồng theo mô hình thẳng đứng.',
      },
      {
        id: 'rq5',
        type: 'multiple-choice',
        questionNumber: 5,
        prompt: 'What does the term "food miles" refer to in Paragraph C?',
        options: [
          'The total area of farmland required to feed an urban population',
          'The transportation distance from farm to consumer plate',
          'The speed at which crops grow in vertical facilities',
          'The carbon emissions generated by agricultural tractors',
        ],
        correctAnswer: 'The transportation distance from farm to consumer plate',
        paragraphRef: 'Paragraph C',
        explanationEn: 'Paragraph C directly defines "food miles" as "the transportation distance from farm to plate".',
        explanationVi:
          'Đoạn C định nghĩa trực tiếp food miles là khoảng cách vận chuyển thực phẩm từ nông trại đến đĩa ăn của người tiêu dùng.',
      },
      {
        id: 'rq6',
        type: 'sentence-completion',
        questionNumber: 6,
        prompt:
          'In vertical farming, synthetic chemical pesticides are not needed because the crops grow in a contained _____ environment.',
        options: ['outdoor', 'indoor', 'oceanic', 'subterranean'],
        correctAnswer: 'indoor',
        paragraphRef: 'Paragraph C',
        explanationEn:
          'Paragraph C explains that the "contained indoor environment virtually eliminates vulnerability to agricultural pests... rendering synthetic chemical pesticides... redundant."',
        explanationVi:
          'Đoạn C giải thích môi trường khép kín trong nhà loại bỏ hầu như hoàn toàn sâu bệnh, khiến thuốc trừ sâu hóa học không còn cần thiết.',
      },
    ],
  },
  {
    id: 'read_gen_1',
    title: 'Workplace Safety Guidelines: Remote Ergonomics & Digital Wellbeing',
    examType: 'general',
    difficulty: 'Band 6.0-6.5',
    timeLimitMinutes: 15,
    passageText: `Section 1: Workstation Setup
Proper ergonomic alignment is critical for avoiding musculoskeletal strain during prolonged computer use. Ensure your monitor is placed directly in front of you at roughly arm's length (50 to 70 centimeters). The top line of screen text should be at or slightly below eye level. Adjust your chair height so your feet rest flat on the floor with your knees bent at a 90-degree angle. If your feet dangle, utilize a supportive footrest.

Section 2: Repetitive Strain Prevention
Typing and mouse navigation for hours without interruption can lead to Carpal Tunnel Syndrome and cervical stiffness. Keep your wrists in a neutral, straight position—neither bent upwards nor resting heavily on hard desk edges. External ergonomic keyboards and vertical mice are strongly advised for employees working more than 6 hours daily.

Section 3: The 20-20-20 Rule for Visual Comfort
To mitigate digital eye strain and blurred vision, health specialists advocate the 20-20-20 rule. Every 20 minutes, avert your gaze from your display and focus on an object at least 20 feet (approximately 6 meters) away for at least 20 seconds. This simple habit relaxes the ciliary muscles of the eyes and stimulates natural blinking.

Section 4: Incident Reporting & Equipment Requests
Staff members requiring specialized ergonomic equipment (such as standing desks, lumbar support cushions, or anti-glare filters) must submit an Ergonomic Assessment Request via the internal employee portal. If you experience persistent wrist tingling or lower back pain for more than 3 consecutive days, report the incident immediately to the Health & Safety coordinator.`,
    questions: [
      {
        id: 'rq_g1',
        type: 'true-false-not-given',
        questionNumber: 1,
        prompt: 'The computer screen should be positioned higher than eye level for optimal posture.',
        options: ['TRUE', 'FALSE', 'NOT GIVEN'],
        correctAnswer: 'FALSE',
        paragraphRef: 'Section 1',
        explanationEn: 'Section 1 specifies: "The top line of screen text should be at or slightly below eye level."',
        explanationVi: 'Phần 1 hướng dẫn dòng chữ trên cùng của màn hình phải ngang hoặc thấp hơn tầm mắt một chút.',
      },
      {
        id: 'rq_g2',
        type: 'multiple-choice',
        questionNumber: 2,
        prompt: 'According to the 20-20-20 rule, how far away should you look every 20 minutes?',
        options: ['20 inches', '20 centimeters', '20 feet (about 6 meters)', '20 meters'],
        correctAnswer: '20 feet (about 6 meters)',
        paragraphRef: 'Section 3',
        explanationEn:
          'Section 3 states: "focus on an object at least 20 feet (approximately 6 meters) away for at least 20 seconds."',
        explanationVi:
          'Phần 3 chỉ rõ cần nhìn vào một vật thể cách xa ít nhất 20 feet (khoảng 6 mét) trong tối thiểu 20 giây.',
      },
      {
        id: 'rq_g3',
        type: 'sentence-completion',
        questionNumber: 3,
        prompt: 'If you suffer from pain for more than 3 consecutive days, you should inform the _____ coordinator.',
        options: ['IT Support', 'Health & Safety', 'Human Resources', 'Financial'],
        correctAnswer: 'Health & Safety',
        paragraphRef: 'Section 4',
        explanationEn: 'Section 4 mentions reporting immediately to the "Health & Safety coordinator".',
        explanationVi: 'Phần 4 yêu cầu báo cáo ngay cho điều phối viên "Health & Safety".',
      },
    ],
  },
];
