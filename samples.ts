export interface SampleMedia {
  id: string;
  title: string;
  type: 'image' | 'audio';
  url: string;
  description: string;
}

export const SAMPLE_MEDIA_LIST: SampleMedia[] = [
  {
    id: 'tech-gadget',
    title: 'Minimalist Workspace (Image)',
    type: 'image',
    url: 'https://images.unsplash.com/photo-1498050108023-c5249f4df085?auto=format&fit=crop&w=1000&q=80',
    description: 'Clean desk with modern laptop and coding setup'
  },
  {
    id: 'nature-landscape',
    title: 'Mountain Sunrise (Image)',
    type: 'image',
    url: 'https://images.unsplash.com/photo-1464822759023-fed622ff2c3b?auto=format&fit=crop&w=1000&q=80',
    description: 'Dramatic mountain peak bathed in golden dawn light'
  },
  {
    id: 'podcast-intro',
    title: 'Sample Tech Podcast Audio',
    type: 'audio',
    url: 'https://www.soundhelix.com/examples/mp3/SoundHelix-Song-1.mp3',
    description: 'Upbeat background audio track for content commentary'
  }
];

export const SAMPLE_SCRIPTS = [
  {
    id: 'ai-tools',
    title: 'Top 3 AI Productivity Tools in 2026',
    text: `Hey everyone! Today I am showing you the top 3 AI tools that will save you 10+ hours every single week. First up is Gemini 3.6 Flash - it transcribes speech, translates scripts instantly, and creates video metadata in seconds. Second is our automated code builder, and third is an AI task organizer. Don't forget to hit subscribe and check the link in the description to try these out!`
  },
  {
    id: 'fitness-motivation',
    title: '5-Minute Morning Energy Routine',
    text: `Wake up, drink a glass of water, and move your body! In this quick 5-minute morning routine, we combine high-intensity jumping jacks, deep diaphragmatic breathing, and dynamic stretching to kickstart your dopamine and focus for the entire day. No gym equipment required!`
  },
  {
    id: 'recipe-tutorial',
    title: 'Crispy Garlic Butter Pasta in 15 Minutes',
    text: `If you're busy tonight, this 15-minute garlic butter pasta is your new holy grail dinner. Boil spaghetti al dente, sauté finely minced garlic in rich butter with chili flakes, toss in fresh parsley and aged parmesan cheese. Simple, mouthwatering, and cheap!`
  }
];
