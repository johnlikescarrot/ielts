import { WritingPrompt } from '../types';

export const WRITING_PROMPTS: WritingPrompt[] = [
  {
    id: 'wp_task2_tech',
    type: 'task2-essay',
    title: 'Technology & Remote Education',
    category: 'Education & Technology',
    prompt: `Some people believe that online learning and artificial intelligence will eventually replace traditional classroom teachers, while others argue that human educators will remain indispensable. 

Discuss both views and give your own opinion.`,
    timeLimitMinutes: 40,
    minWordCount: 250,
    sampleEssayBand9: `The rapid proliferation of educational technology and generative artificial intelligence has sparked a fierce debate regarding the future of pedagogy. While technological enthusiasts contend that intelligent software will soon render human educators redundant, I firmly believe that teachers remain indispensable facilitators of emotional empathy, critical thinking, and moral mentorship.

On the one hand, advocates of automated education argue that digital platforms offer unprecedented scalability and personalization. Advanced algorithmic tutors can analyze individual learning trajectories, dynamically tailoring exercises to address specific conceptual deficits. Furthermore, digital coursework eliminates geographical and economic barriers, enabling students in remote regions to access top-tier academic curricula without exorbitant tuition fees. Consequently, computerized instruction optimizes learning efficiency and democratizes knowledge dissemination on an unprecedented global scale.

On the other hand, the human dimension of teaching encompasses vital psychological and pedagogical faculties that artificial algorithms cannot replicate. Human educators do not merely transmit static data; they foster motivation, inspire intellectual curiosity, and cultivate social-emotional resilience. In collaborative seminar environments, a perceptive instructor can identify subtle non-verbal cues indicating student frustration or disengagement, promptly adapting instruction to reassure learners. Moreover, cultivating ethical reasoning and complex argumentation requires interactive philosophical dialogue with experienced human mentors who model nuanced cultural perspectives.

In conclusion, while cutting-edge digital platforms serve as powerful auxiliary instruments to augment instructional delivery, they cannot replace the empathetic and inspirational core of human educators. A hybrid pedagogical paradigm that harmoniously integrates algorithmic efficiency with compassionate human mentorship represents the optimal future for global education worldwide.`,
    sampleEssayBand7: `Nowadays, technology is developing very quickly in the field of education. Many people think that computer programs and AI can take the place of school teachers in the future, but other people say teachers are still necessary. In this essay, I will discuss both points of view and explain why I believe teachers are still needed.

Firstly, online learning has many clear advantages. Students can study from home anytime they want using computers and phones. AI programs can also grade tests instantly and give students personalized exercises. This helps students save a lot of money on travel and school fees. Therefore, many people believe that technology can teach subjects better and faster than normal classrooms.

Secondly, human teachers provide emotional support that computers cannot give. When students are stressed or having personal difficulties, a teacher can listen and encourage them. Furthermore, teachers teach children important life values such as honesty, discipline, and teamwork. Machines can only provide facts and answers, but they cannot care about student feelings.

In summary, although technology is very convenient and helpful for studying, human teachers are still essential for students' personal growth. Therefore, we should combine technology with traditional teaching.`,
    sampleAnalysis: {
      taskAchievement: 'Band 9: Fully addresses all parts of the prompt, presents a clear and nuanced position throughout, fully extended arguments.',
      coherenceCohesion: 'Band 9: Seamless paragraph progression, sophisticated discourse markers, precise referencing.',
      lexicalResource: 'Band 9: Wide range of academic vocabulary (pedagogy, scalability, trajectories, deficits, democratization, auxiliary instruments).',
      grammaticalRange: 'Band 9: Wide range of complex structures used with full flexibility and accuracy.',
    },
    keyVocabulary: [
      { word: 'Pedagogy', meaning: 'The method and practice of teaching', usage: 'Modern pedagogy emphasizes interactive problem-solving.' },
      { word: 'Proliferation', meaning: 'Rapid increase in numbers', usage: 'The proliferation of smartphones transformed classrooms.' },
      { word: 'Facilitator', meaning: 'One who makes a process easier', usage: 'Teachers act as facilitators rather than simple lecturers.' },
      { word: 'Indispensable', meaning: 'Absolutely necessary', usage: 'Human mentors remain indispensable in education.' },
      { word: 'Dissemination', meaning: 'The spreading of information widely', usage: 'The internet accelerated the dissemination of scientific research.' },
    ],
  },
  {
    id: 'wp_task1_acad',
    type: 'task1-academic',
    title: 'Global Renewable Energy Generation (2010–2025)',
    category: 'Academic Chart Description',
    prompt: `The chart below illustrates the proportion of global electricity generated from three distinct renewable sources (Solar, Wind, and Hydroelectric) between 2010 and 2025, with projected figures for 2030.

Summarize the information by selecting and reporting the main features, and make comparisons where relevant.`,
    chartDescription: 'Line graph showing Solar rising from 2% (2010) to 14% (2025) and projected 22% (2030); Wind rising from 5% (2010) to 16% (2025); Hydroelectric remaining dominant but relatively stable between 18% and 20%.',
    timeLimitMinutes: 20,
    minWordCount: 150,
    sampleEssayBand9: `The line graph delineates the percentage of worldwide electricity produced by solar, wind, and hydroelectric power from 2010 to 2025, alongside projected trends through 2030.

Overall, it is discernible that while hydroelectric power maintained the largest share throughout most of the period, both solar and wind energy experienced dramatic upward trajectories. By 2030, solar power is anticipated to become the single most dominant renewable electricity contributor.

In 2010, hydroelectricity constituted the overwhelming majority of renewable power at approximately 18%, before experiencing modest growth to reach 20% in 2020, where it is projected to plateau through 2030. In sharp contrast, wind energy stood at a modest 5% initially, but grew steadily to surpass 16% by 2025, with future projections reaching 19%.

Solar power exhibited the most meteoric expansion. Starting from a negligible 2% in 2010, solar generation rose moderately to 6% in 2018, followed by a steep acceleration to 14% by 2025. Projections indicate this surge will continue, culminating in a peak of 22% by 2030, thereby overtaking all other renewable counterparts.`,
    sampleEssayBand7: `The graph shows information about how much electricity was generated by solar, wind, and hydroelectric sources between 2010 and 2025, with future predictions for 2030.

Overall, electricity from all three renewable sources increased over the given period. Hydroelectric power started as the highest, but solar power is expected to become the highest by 2030.

In 2010, hydroelectricity was the most popular renewable source, making up 18% of global electricity. It rose slightly to 20% in 2020 and is expected to stay at that level until 2030. Meanwhile, wind energy started at only 5% in 2010 and increased steadily to 16% in 2025.

On the other hand, solar energy had the lowest percentage in 2010 at only 2%. However, it increased quickly after 2018 to reach 14% in 2025. By 2030, solar energy is predicted to reach 22%, which will be higher than wind and hydroelectric power.`,
    sampleAnalysis: {
      taskAchievement: 'Band 9: Clear overview presenting prominent trends, key data points selected, accurate comparisons made.',
      coherenceCohesion: 'Band 9: Logical flow, cohesive grouping by source and time periods.',
      lexicalResource: 'Band 9: Rich descriptive language (delineates, upward trajectories, plateau, meteoric expansion).',
      grammaticalRange: 'Band 9: Diverse participle clauses, compound-complex sentences, accurate passive forms.',
    },
    keyVocabulary: [
      { word: 'Delineates', meaning: 'Describes or portrays precisely', usage: 'The graph delineates regional energy consumption trends.' },
      { word: 'Meteoric', meaning: 'Very rapid and striking', usage: 'Solar energy experienced a meteoric rise.' },
      { word: 'Plateau', meaning: 'Reach a state of little or no change after a period of growth', usage: 'Hydroelectric capacity plateaued around 20%.' },
      { word: 'Trajectory', meaning: 'The curved path or general direction of growth', usage: 'Wind energy followed an upward trajectory.' },
    ],
  }
];
