export interface ShadowingPreset {
  id: string;
  title: string;
  skillType: 'speaking' | 'listening';
  partOrSection: string;
  bandScore: number;
  descriptionEn: string;
  descriptionVi: string;
  youtubeId?: string;
  subtitles: string;
}

export const SHADOWING_PRESETS: ShadowingPreset[] = [
  {
    id: 'speaking-part1-hometown',
    title: 'Speaking Part 1: Hometown Transformation & Memories',
    skillType: 'speaking',
    partOrSection: 'Part 1',
    bandScore: 9.0,
    descriptionEn: 'Band 9.0 native model response discussing urbanization, childhood memories, and cultural landmarks.',
    descriptionVi: 'Bài mẫu Band 9.0 thảo luận về sự phát triển đô thị, ký ức tuổi thơ và di tích văn hóa.',
    youtubeId: '7m16ld9704w',
    subtitles: `[00:00] Well, I grew up in a vibrant coastal city that has undergone profound economic transformation over the past decade.
[00:07] When I was a child, it was predominantly a tranquil fishing township with narrow cobbled streets.
[00:15] However, extensive commercial investments have catalyzed rapid modernization and high-rise developments.
[00:23] What I cherish most is the harmonious balance between historic architecture and innovative contemporary infrastructure.
[00:32] Local authorities have meticulously preserved heritage sites while expanding sustainable pedestrian promenades along the shoreline.`,
  },
  {
    id: 'speaking-part2-innovation',
    title: 'Speaking Part 2: Describing a Groundbreaking Innovation',
    skillType: 'speaking',
    partOrSection: 'Part 2 Cue Card',
    bandScore: 9.0,
    descriptionEn: 'Band 9.0 cue card monologue describing generative artificial intelligence and its societal ramifications.',
    descriptionVi: 'Độc thoại Part 2 chuẩn Band 9.0 mô tả đột phá trí tuệ nhân tạo và tác động xã hội.',
    youtubeId: 'yR7fRmV80U4',
    subtitles: `[00:00] Today, I would like to elucidate a technological innovation that has substantially revolutionized modern workflows.
[00:09] It is generative artificial intelligence, specifically natural language models capable of synthesizing complex data in seconds.
[00:18] I first encountered this technology approximately eighteen months ago during an intensive academic research seminar.
[00:27] What makes it truly extraordinary is its versatility in drafting research outlines, debugging code, and translating nuanced vernaculars.
[00:37] While concerns regarding intellectual property and cognitive over-reliance remain valid, its capacity to augment human productivity is indisputable.`,
  },
  {
    id: 'speaking-part3-sustainability',
    title: 'Speaking Part 3: Urban Mobility & Climate Strategy',
    skillType: 'speaking',
    partOrSection: 'Part 3 In-depth',
    bandScore: 8.5,
    descriptionEn: 'Band 8.5 analytical discourse exploring government policies, public transit incentives, and environmental mitigation.',
    descriptionVi: 'Thảo luận phân tích Band 8.5 về chính sách giao thông xanh và biện pháp giảm thiểu ô nhiễm.',
    youtubeId: 'b_fL8Hk67dM',
    subtitles: `[00:00] In my perspective, municipal governments must adopt comprehensive fiscal and regulatory incentives to mitigate carbon emissions.
[00:09] Simply appealing to civic responsibility is insufficient without accessible and subsidized mass transit alternatives.
[00:18] For instance, integrating electrified bus rapid transit with dedicated cycling corridors drastically diminishes private vehicle dependency.
[00:28] Furthermore, imposing congestion tariffs in metropolitan centers has yielded measurable reductions in particulate air pollution globally.
[00:38] Ultimately, enduring environmental progress necessitates strategic collaboration among policymakers, engineers, and local residents.`,
  },
  {
    id: 'listening-sec4-marine-ecology',
    title: 'Listening Section 4: Marine Ecology & Coral Bleaching',
    skillType: 'listening',
    partOrSection: 'Section 4 Lecture',
    bandScore: 9.0,
    descriptionEn: 'Band 9.0 academic lecture on ocean temperature anomalies, symbiotic algae, and reef conservation strategies.',
    descriptionVi: 'Bài giảng học thuật Section 4 về hiện tượng tẩy trắng san hô và giải pháp phục hồi hệ sinh thái biển.',
    youtubeId: '3U22Fq2l9mQ',
    subtitles: `[00:00] Good morning everyone. In today's marine biology lecture, we will examine the physiological mechanics of coral bleaching.
[00:08] Corals maintain an obligate symbiotic relationship with microscopic photosynthetic algae known as zooxanthellae.
[00:17] When sea surface temperatures exceed thermal thresholds for prolonged periods, corals expel these vital cellular symbionts.
[00:26] Consequently, the reef loses its pigment and essential metabolic nutrients, precipitating widespread structural decay.
[00:35] Marine conservationists are actively deploying genetic resilience breeding and artificial sub-surface shade canopies to foster ecosystem recovery.`,
  },
  {
    id: 'listening-sec3-tutoring',
    title: 'Listening Section 3: Academic Research & Peer Review',
    skillType: 'listening',
    partOrSection: 'Section 3 Dialogue',
    bandScore: 8.5,
    descriptionEn: 'Band 8.5 academic consultation between university researcher and supervisor analyzing sampling methodology.',
    descriptionVi: 'Hội thoại học thuật Section 3 phân tích phương pháp chọn mẫu và quy trình phản biện khoa học.',
    youtubeId: 'k1p4094_12Q',
    subtitles: `[00:00] Dr. Harrison, thank you for reviewing the preliminary methodology chapter for my environmental economics thesis.
[00:08] You've gathered comprehensive empirical data, but your stratified sampling strategy requires tighter demographic controls.
[00:17] I noticed that suburban low-income households were disproportionately underrepresented in the second survey wave.
[00:25] That is a critical observation; I will recalibrate the weighting algorithms to eliminate systemic statistical bias before submission.
[00:35] Excellent. Ensure you also cross-examine conflicting longitudinal studies in your literature review to fortify your analytical framework.`,
  },
];
