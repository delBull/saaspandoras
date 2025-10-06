const { db } = require('./src/db');
const { projects } = require('./src/db/schema');

async function createSampleProjects() {
  try {
    console.log('Creating sample projects...');

    const sampleProjects = [
      {
        title: 'EcoGreen Energy',
        slug: 'ecogreen-energy',
        description: 'Revolutionary renewable energy project using blockchain technology to democratize green power generation and distribution.',
        tagline: 'Power the future with sustainable energy',
        businessCategory: 'renewable_energy',
        targetAmount: '250000',
        totalTokens: 1000000,
        tokensOffered: 500000,
        tokenPriceUsd: '0.0005',
        website: 'https://ecogreen.energy',
        coverPhotoUrl: '/images/sem.jpeg',
        featured: false,
        featuredButtonText: 'Learn More',
        status: 'approved',
        applicantName: 'John Smith',
        applicantEmail: 'john@ecogreen.energy',
        applicantWalletAddress: '0x1234567890123456789012345678901234567890'
      },
      {
        title: 'TechStart AI',
        slug: 'techstart-ai',
        description: 'AI-powered startup revolutionizing automation and machine learning solutions for businesses worldwide.',
        tagline: 'AI for everyone, everywhere',
        businessCategory: 'tech_startup',
        targetAmount: '150000',
        totalTokens: 750000,
        tokensOffered: 375000,
        tokenPriceUsd: '0.0004',
        website: 'https://techstart.ai',
        coverPhotoUrl: '/images/blockbunny.jpg',
        featured: true,
        featuredButtonText: 'Join the AI revolution',
        status: 'approved',
        applicantName: 'Sarah Johnson',
        applicantEmail: 'sarah@techstart.ai',
        applicantWalletAddress: '0x0987654321098765432109876543210987654321'
      },
      {
        title: 'Artisan Marketplace',
        slug: 'artisan-marketplace',
        description: 'Blockchain-based marketplace connecting artisans directly with customers, ensuring fair compensation and authenticity.',
        tagline: 'Art made fair, trade made transparent',
        businessCategory: 'art_collectibles',
        targetAmount: '75000',
        totalTokens: 500000,
        tokensOffered: 250000,
        tokenPriceUsd: '0.0003',
        website: 'https://artisan.market',
        coverPhotoUrl: '/images/narailoft.jpg',
        featured: false,
        featuredButtonText: 'Support artisans',
        status: 'pending',
        applicantName: 'Michael Chen',
        applicantEmail: 'michael@artisan.market',
        applicantWalletAddress: '0xabcdef1234567890abcdef1234567890abcdef12'
      }
    ];

    for (const project of sampleProjects) {
      await db.insert(projects).values(project).onConflictDoNothing();
      console.log('✅ Created project:', project.title);
    }

    console.log('Sample projects created successfully!');
  } catch (error) {
    console.error('❌ Error creating sample projects:', error);
  }
}

createSampleProjects();