import { SpeakingQuestion } from '../types';

export const SPEAKING_QUESTIONS: SpeakingQuestion[] = [
  {
    id: 'sq_part1_work',
    part: 1,
    topic: 'Work & Studies',
    prompt: 'Do you work or are you currently a student? What do you find most rewarding about it?',
    modelAnswer: 'Presently, I am working as a software engineer at a technology consultancy. What I find most intellectually stimulating is the collaborative problem-solving aspect—translating complex business requirements into elegant, efficient algorithms that streamline daily operations for thousands of users.',
    tipsEn: [
      'Answer directly, then extend with 2-3 sentences providing reasons or personal impressions.',
      'Use natural discourse linkers like "Presently", "What I find most...", "In particular".',
      'Avoid one-word or robotic responses.'
    ],
    tipsVi: [
      'Trả lời trực diện vào trọng tâm, sau đó mở rộng thêm 2-3 câu giải thích lý do hoặc cảm nhận cá nhân.',
      'Sử dụng các từ nối tự nhiên như "Presently", "What I find most rewarding...", "In particular".',
      'Tránh trả lời cộc lốc hoặc quá ngắn dưới 1 câu.'
    ],
    recommendedVocab: [
      'intellectually stimulating',
      'collaborative environment',
      'streamline operations',
      'steep learning curve'
    ]
  },
  {
    id: 'sq_part2_challenge',
    part: 2,
    topic: 'Overcoming a Difficult Challenge',
    prompt: 'Describe a challenging situation or obstacle you faced and successfully overcame.',
    cueCardPoints: [
      'What the situation or challenge was',
      'When and where it occurred',
      'What actions or steps you took to resolve it',
      'And explain how you felt after overcoming it'
    ],
    modelAnswer: `I would like to talk about a formidable challenge I encountered during my final year of university, when I was tasked with leading a cross-disciplinary team project to develop an automated environmental monitoring system.

The primary hurdle was that our initial sensor prototypes malfunctioned two weeks prior to the final submission deadline due to unexpected voltage fluctuations. Morale plummeted, and several team members proposed abandoning the hardware component altogether. 

Recognizing that giving up was not an option, I immediately convened a crisis meeting to triage the issues. We methodically dissected the electrical circuitry, consulted faculty advisors, and recalibrated the firmware. I coordinated shifts around the clock so that debugging proceeded without interruption.

Thanks to our concerted effort, we managed to resolve the glitch with three days to spare and delivered a flawless demonstration to the examination board. Looking back, this ordeal was immensely rewarding; it not only honed my technical problem-solving acumen but also taught me that perseverance and calm leadership can surmount seemingly insurmountable odds.`,
    tipsEn: [
      'Use the 1-minute preparation time to jot down keywords and connectives for all 4 bullet points.',
      'Use past tenses (Past Simple, Past Continuous, Past Perfect) accurately.',
      'Speak for the full 2 minutes until stopped.'
    ],
    tipsVi: [
      'Tận dụng 1 phút chuẩn bị để ghi nhanh từ khóa và liên từ cho cả 4 ý gợi ý trong Cue Card.',
      'Sử dụng linh hoạt các thì quá khứ (Quá khứ đơn, Quá khứ tiếp diễn, Quá khứ hoàn thành).',
      'Cố gắng nói liên tục, trôi chảy đủ 2 phút mà không bị ngập ngừng quá lâu.'
    ],
    recommendedVocab: [
      'formidable challenge',
      'concerted effort',
      'plunge into despair / plummet',
      'surmount insurmountable odds',
      'immensely rewarding'
    ]
  },
  {
    id: 'sq_part3_resilience',
    part: 3,
    topic: 'Resilience & Human Adaptability',
    prompt: 'Why do some individuals handle adversity and unexpected life changes more effectively than others?',
    followUpQuestions: [
      'How can schools and parents foster emotional resilience in children?',
      'Do you believe societal pressure today makes overcoming failure harder than in the past?'
    ],
    modelAnswer: 'From my perspective, psychological resilience hinges largely on cognitive framing and foundational support networks. Individuals who view setbacks as transient learning opportunities rather than permanent personal failures are inherently better equipped to adapt. Furthermore, possessing strong social mentorship provides an emotional safety net that bolsters self-efficacy during times of crisis.',
    tipsEn: [
      'Part 3 requires abstract, analytical thinking — avoid just talking about yourself; discuss society and human psychology in general.',
      'Use conditional clauses, hypothetical language ("hinges on", "would argue that", "is contingent upon").'
    ],
    tipsVi: [
      'Part 3 đòi hỏi tư duy phân tích trừu tượng, hãy nói về xã hội và tâm lý con người thay vì chỉ kể chuyện bản thân.',
      'Sử dụng các cấu trúc học thuật như "hinges largely on", "from an analytical standpoint", "is contingent upon".'
    ],
    recommendedVocab: [
      'cognitive framing',
      'emotional resilience',
      'transient setbacks',
      'safety net',
      'self-efficacy'
    ]
  }
];
