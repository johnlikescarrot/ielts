import type {SpeakingPrompt, WritingPrompt} from '../types';

export const writingPrompts: Record<'en' | 'vi', WritingPrompt[]> = {
  en: [
    {
      id: 'w-academic-transport',
      kind: 'academic-1',
      title: 'Academic Task 1 · Transport',
      prompt:
        'The table shows the percentage of commuters using four forms of transport in a city in 2005 and 2025. Summarise the main features and make relevant comparisons. Use these figures: car 52%→38%, bus 23%→25%, bicycle 11%→21%, rail 14%→16%.',
      minutes: 20,
      minimumWords: 150,
    },
    {
      id: 'w-general-neighbourhood',
      kind: 'general-1',
      title: 'General Training Task 1 · Community',
      prompt:
        'A public space in your neighbourhood is often left untidy. Write to your local council. Describe the place and the problem, explain how residents are affected, and suggest what the council should do.',
      minutes: 20,
      minimumWords: 150,
    },
    {
      id: 'w-task2-workweek',
      kind: 'task-2',
      title: 'Task 2 · Work and society',
      prompt:
        'Some people believe a four-day working week benefits both employees and employers. To what extent do you agree or disagree? Give reasons and include relevant examples from your knowledge or experience.',
      minutes: 40,
      minimumWords: 250,
    },
  ],
  vi: [
    {
      id: 'w-academic-transport',
      kind: 'academic-1',
      title: 'Academic Task 1 · Giao thông',
      prompt:
        'Bảng cho biết tỷ lệ người đi làm sử dụng bốn phương tiện trong một thành phố vào năm 2005 và 2025. Hãy tóm tắt đặc điểm chính và so sánh phù hợp. Số liệu: ô tô 52%→38%, xe buýt 23%→25%, xe đạp 11%→21%, đường sắt 14%→16%.',
      minutes: 20,
      minimumWords: 150,
    },
    {
      id: 'w-general-neighbourhood',
      kind: 'general-1',
      title: 'General Training Task 1 · Cộng đồng',
      prompt:
        'Một không gian công cộng gần nhà thường xuyên bị để bừa bộn. Hãy viết thư cho hội đồng địa phương: mô tả địa điểm và vấn đề, giải thích ảnh hưởng tới cư dân, và đề xuất giải pháp.',
      minutes: 20,
      minimumWords: 150,
    },
    {
      id: 'w-task2-workweek',
      kind: 'task-2',
      title: 'Task 2 · Công việc và xã hội',
      prompt:
        'Một số người cho rằng tuần làm việc bốn ngày có lợi cho cả nhân viên lẫn doanh nghiệp. Bạn đồng ý hay không đồng ý tới mức nào? Hãy nêu lý do và ví dụ phù hợp.',
      minutes: 40,
      minimumWords: 250,
    },
  ],
};

export const speakingPrompts: Record<'en' | 'vi', SpeakingPrompt[]> = {
  en: [
    {
      id: 's-skill',
      topic: 'A useful skill',
      question: 'Describe a useful skill you learned outside formal education.',
      points: [
        'what the skill is',
        'how you learned it',
        'why you learned it',
        'how it has helped you',
      ],
    },
    {
      id: 's-place',
      topic: 'A changing place',
      question:
        'Describe a place in your area that has changed in recent years.',
      points: [
        'where it is',
        'what it was like before',
        'what changed',
        'how you feel about the change',
      ],
    },
  ],
  vi: [
    {
      id: 's-skill',
      topic: 'Một kỹ năng hữu ích',
      question:
        'Mô tả một kỹ năng hữu ích bạn học được ngoài chương trình giáo dục chính quy.',
      points: [
        'đó là kỹ năng gì',
        'bạn học như thế nào',
        'vì sao bạn học',
        'kỹ năng đó đã giúp gì cho bạn',
      ],
    },
    {
      id: 's-place',
      topic: 'Một nơi đã thay đổi',
      question:
        'Mô tả một nơi trong khu vực của bạn đã thay đổi trong những năm gần đây.',
      points: [
        'nơi đó ở đâu',
        'trước đây như thế nào',
        'điều gì đã thay đổi',
        'bạn cảm thấy thế nào',
      ],
    },
  ],
};

export const writingCriteria = {
  en: [
    'Answer every part of the task',
    'Clear progression and paragraphing',
    'Precise, appropriate vocabulary',
    'A range of accurate sentence structures',
  ],
  vi: [
    'Trả lời đầy đủ mọi phần của đề',
    'Bố cục đoạn và mạch phát triển rõ ràng',
    'Từ vựng chính xác, phù hợp',
    'Cấu trúc câu đa dạng và chính xác',
  ],
};

export const speakingCriteria = {
  en: [
    'Fluency and coherence',
    'Lexical resource',
    'Grammatical range and accuracy',
    'Pronunciation and intelligibility',
  ],
  vi: [
    'Độ trôi chảy và mạch lạc',
    'Vốn từ vựng',
    'Độ đa dạng và chính xác ngữ pháp',
    'Phát âm và mức độ dễ hiểu',
  ],
};
